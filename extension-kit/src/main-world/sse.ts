/**
 * SSE (text/event-stream) parsing off a ReadableStream, per the WHATWG
 * spec's field lines, with multi-line `data:` joins. Emits one event per
 * `data:`-terminated block; `event:`, comments, `id:`, `retry:` handled
 * (id/retry ignored for capture purposes).
 */

export interface SseEvent {
	event?: string;
	data: string;
}

export async function consumeSseStream(
	stream: ReadableStream<Uint8Array>,
	onEvent: (event: SseEvent) => void,
): Promise<void> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			// events are separated by blank lines; tolerate \r\n
			let boundary: number;
			while ((boundary = buffer.search(/\r?\n\r?\n/)) !== -1) {
				const block = buffer.slice(0, boundary);
				buffer = buffer.slice(boundary + (buffer.slice(boundary).startsWith("\r\n\r\n") ? 4 : 2));
				const parsed = parseBlock(block);
				if (parsed) onEvent(parsed);
			}
		}
		const tail = parseBlock(buffer);
		if (tail) onEvent(tail);
	} finally {
		reader.releaseLock();
	}
}

function parseBlock(block: string): SseEvent | undefined {
	let event: string | undefined;
	const dataLines: string[] = [];
	for (const rawLine of block.split(/\r?\n/)) {
		if (rawLine === "" || rawLine.startsWith(":")) continue;
		const colon = rawLine.indexOf(":");
		const field = colon === -1 ? rawLine : rawLine.slice(0, colon);
		let value = colon === -1 ? "" : rawLine.slice(colon + 1);
		if (value.startsWith(" ")) value = value.slice(1);
		if (field === "data") dataLines.push(value);
		else if (field === "event") event = value;
	}
	if (dataLines.length === 0) return undefined;
	return { event, data: dataLines.join("\n") };
}
