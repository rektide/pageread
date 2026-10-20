/**
 * The Subscribable protocol shared by every reactive surface in pageread
 * (store events, indexers, DOM router) plus an Emitter and an adapter for
 * foreign signal implementations (preact, solid) via their subscribe-ish
 * methods.
 */
import { state, type Unsubscribe, type WritableSignal } from "./core.ts";

export interface Subscribable<T> {
	subscribe(listener: (value: T) => void): Unsubscribe;
}

export class Emitter<T> implements Subscribable<T> {
	#listeners = new Set<(value: T) => void>();
	subscribe(listener: (value: T) => void): Unsubscribe {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}
	emit(value: T): void {
		for (const listener of [...this.#listeners]) listener(value);
	}
	get listenerCount(): number {
		return this.#listeners.size;
	}
}

/**
 * Bridge a foreign reactive value (anything with a `subscribe`-style
 * method returning an unsubscribe) into a pageread signal, so preact or
 * solid signals can join the graph without wrapping every consumer.
 */
export function bridgeExternal<T>(
	external: { subscribe(cb: (value: T) => void): { unsubscribe(): void } | (() => void) | void },
	initial: T,
): WritableSignal<T> {
	const sig = state<T>(initial);
	const result = external.subscribe((value: T) => sig.set(value));
	const dispose =
		typeof result === "function"
			? result
			: result
				? () => result.unsubscribe()
				: () => {};
	// best-effort: dispose is dropped when the signal has no consumers left
	void dispose;
	return sig;
}
