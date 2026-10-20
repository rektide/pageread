/** WHATWG event-stream framing: CR, LF, CRLF; incomplete EOF event is discarded. */
export interface SseEvent { event?: string; data: string }

export async function consumeSseStream(stream: ReadableStream<Uint8Array>, onEvent: (event: SseEvent) => void): Promise<void> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let line = "", skipLf = false, event: string | undefined;
	let data: string[] = [];
	const finishLine = () => {
		if (line === "") {
			if (data.length) onEvent({ event, data: data.join("\n") });
			data = []; event = undefined;
		} else if (!line.startsWith(":")) {
			const colon = line.indexOf(":");
			const field = colon < 0 ? line : line.slice(0, colon);
			let value = colon < 0 ? "" : line.slice(colon + 1);
			if (value.startsWith(" ")) value = value.slice(1);
			if (field === "data") data.push(value);
			if (field === "event") event = value;
		}
		line = "";
	};
	try {
		for (;;) {
			const { value, done } = await reader.read();
			const text = done ? decoder.decode() : decoder.decode(value, { stream: true });
			for (const char of text) {
				if (skipLf && char === "\n") { skipLf = false; continue; }
				skipLf = char === "\r";
				if (char === "\r" || char === "\n") finishLine(); else line += char;
			}
			if (done) break;
		}
	} finally { reader.releaseLock(); }
}
