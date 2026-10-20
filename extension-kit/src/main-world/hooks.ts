/**
 * MAIN-world network hooks: wrap fetch (including SSE event-stream
 * responses, tee'd so the page's stream is untouched) and XMLHttpRequest,
 * emitting captures through a single callback. One install per page —
 * double installs are refused.
 */
import { captureId, globMatch, type Capture } from "../capture.ts";
import { consumeSseStream } from "./sse.ts";

export interface HookOptions {
	methods?: string[];
	onError?: (error: unknown) => void;
	/** glob patterns; unmatched URLs pass through unhooked */
	include?: string[];
	/** default true */
	captureBodies?: boolean;
	/** default 5 MiB (approximate: measured on the string) */
	maxBodyBytes?: number;
}

interface HookGlobals {
	__pagereadHooks?: boolean;
	fetch?: typeof fetch;
	XMLHttpRequest?: unknown;
	[index: string]: unknown;
}

function headersToObject(headers: Headers): Record<string, string> {
	const out: Record<string, string> = {};
	headers.forEach((value, key) => {
		out[key] = value;
	});
	return out;
}

export function installNetworkHooks(emit: (capture: Capture) => void, opts?: HookOptions): () => void {
	const g = globalThis as HookGlobals;
	if (g.__pagereadHooks) return () => {};
	g.__pagereadHooks = true;

	const include = opts?.include;
	const captureBodies = opts?.captureBodies ?? true;
	const maxBytes = opts?.maxBodyBytes ?? 5 * 1024 * 1024;
	const report = opts?.onError ?? ((error: unknown) => console.error("pageread capture failed", error));
	const relevant = (url: string): boolean =>
		include === undefined || include.some((pattern) => globMatch(pattern, url));
	const clip = (body: string): string => (body.length <= maxBytes ? body : body.slice(0, maxBytes));

	// --- fetch ---
	const originalFetch = g.fetch!.bind(g);
	g.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		let url: string | undefined;
		let method: string;
		try {
			url =
				typeof input === "string"
					? input
					: input instanceof URL
						? input.href
						: (input as Request).url;
			method = (
				(init?.method as string | undefined) ??
				(typeof input === "object" && "method" in input ? (input as Request).method : "GET")
			).toUpperCase();
		} catch {
			return originalFetch(input as RequestInfo, init);
		}
		if (url !== undefined) url = new URL(url, globalThis.location?.href).href;
		if (url === undefined || !relevant(url) || (opts?.methods && !opts.methods.includes(method))) return originalFetch(input as RequestInfo, init);

		const startedAt = Date.now();
		const id = captureId(url, startedAt);
		let requestBody: string | undefined;
		if (captureBodies && init?.body != null) {
			const body = init.body;
			if (typeof body === "string") requestBody = clip(body);
			else if (body instanceof URLSearchParams) requestBody = clip(body.toString());
			// ReadableStream / FormData bodies are not buffered (documented)
		}

		let response: Response;
		try {
			response = await originalFetch(input as RequestInfo, init);
		} catch (err) {
			emit({
				kind: "http",
				id,
				url,
				method,
				requestBody,
				startedAt,
				endedAt: Date.now(),
				via: "fetch",
			});
			throw err;
		}

		const responseHeaders = headersToObject(response.headers);
		const contentType = response.headers.get("content-type") ?? "";
		if (captureBodies && contentType.includes("text/event-stream") && response.body) {
			const tap = response.clone().body!;
			void consumeSseStream(tap, (event) => {
				emit({
					kind: "sse",
					requestId: id,
					url,
					method,
					event: event.event,
					data: event.data,
					receivedAt: Date.now(),
				});
			})
				.catch(report)
				.finally(() => {
					emit({
						kind: "http",
						id,
						url,
						method,
						requestBody,
						status: response.status,
						responseHeaders,
						startedAt,
						endedAt: Date.now(),
						via: "fetch",
					});
				});
			return response;
		}

		if (captureBodies && response.body) {
			void response
				.clone()
				.text()
				.then((body) => {
					emit({
						kind: "http",
						id,
						url,
						method,
						requestBody,
						status: response.status,
						responseHeaders,
						responseBody: clip(body),
						startedAt,
						endedAt: Date.now(),
						via: "fetch",
					});
				})
				.catch((error) => {
					report(error);
					emit({
						kind: "http",
						id,
						url,
						method,
						requestBody,
						status: response.status,
						responseHeaders,
						startedAt,
						endedAt: Date.now(),
						via: "fetch",
					});
				});
		} else {
			emit({
				kind: "http",
				id,
				url,
				method,
				requestBody,
				status: response.status,
				responseHeaders,
				startedAt,
				endedAt: Date.now(),
				via: "fetch",
			});
		}
		return response;
	};

	// --- XMLHttpRequest ---
	const OriginalXHR = g.XMLHttpRequest as new () => XMLHttpRequest;
	let hookedXHR: unknown;
	if (OriginalXHR) {
		hookedXHR = class extends OriginalXHR {
			declare private __url: string;
			declare private __method: string;
			declare private __startedAt: number;
			// biome-ignore lint: private fields via closures are heavier; declared names are engine-private
			private get _pr(): Record<string, unknown> {
				return this as unknown as Record<string, unknown>;
			}
			open(method: string, url: string | URL, ...rest: unknown[]): void {
				this.__method = String(method).toUpperCase();
				this.__url = new URL(String(url), globalThis.location?.href).href;
				// @ts-expect-error passthrough variadic
				super.open(method, url, ...rest);
			}
			send(body?: Document | XMLHttpRequestBodyInit | null): void {
				this.__startedAt = Date.now();
				this.addEventListener("loadend", () => {
					const url = this.__url;
					if (!relevant(url)) return;
					let responseBody: string | undefined;
					if (captureBodies && (this.responseType === "" || this.responseType === "text")) {
						try {
							const text = this.responseText;
							responseBody = typeof text === "string" ? clip(text) : undefined;
						} catch {
							// responseText can throw after responseType changes
						}
					}
					emit({
						kind: "http",
						id: captureId(url, this.__startedAt),
						url,
						method: this.__method,
						requestBody: typeof body === "string" ? clip(body) : undefined,
						status: this.status,
						responseBody,
						startedAt: this.__startedAt,
						endedAt: Date.now(),
						via: "xhr",
					});
				});
				super.send(body ?? undefined);
			}
		};
		g.XMLHttpRequest = hookedXHR;
	}

	return () => {
		g.fetch = originalFetch as typeof fetch;
		if (OriginalXHR) g.XMLHttpRequest = OriginalXHR;
		delete g.__pagereadHooks;
	};
}
