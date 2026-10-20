/**
 * A minimal TC39-signals-style reactive core: `state`, `computed`,
 * `effect`, `batch`, `untrack`. Deviates from the proposal's exact API
 * surface (no Signal.subtle yet) but keeps the model: many consumers per
 * source, lazy computeds, eager invalidation, deferred effects.
 *
 * Evaluation strategy: dependency changes eagerly mark dependents
 * `Check` and notify their subscribers; recomputation happens lazily on
 * read (`changedInputs` walks cached dep versions, so a parent computed
 * whose value did not change does not force children to recompute).
 * Effects re-run deferred, coalesced by `batch`.
 */

export type Unsubscribe = () => void;
export type Equals<T> = (a: T, b: T) => boolean;

let batchDepth = 0;
const effectQueue = new Set<() => void>();

interface Node {
	version: number;
	subs: Set<() => void>;
}

class StateNode<T> implements Node {
	version = 0;
	subs = new Set<() => void>();
	constructor(
		public value: T,
		private equals: Equals<T>,
	) {}
	set(next: T): boolean {
		if (this.equals(next, this.value)) return false;
		this.value = next;
		this.version++;
		const notify = [...this.subs];
		for (const cb of notify) cb();
		return true;
	}
}

const enum Flags {
	Clean = 0,
	Check = 1,
}

class ComputedNode<T> implements Node {
	version = 0;
	subs = new Set<() => void>();
	flags: Flags = Flags.Check;
	evaluated = false;
	value: T | undefined = undefined;
	/** deps and the callbacks we registered on them, for unsubscribe */
	deps = new Map<Node, Set<() => void>>();

	constructor(
		private computeFn: () => T,
		public equals: Equals<T>,
	) {}

	markCheck = (): void => {
		if (this.flags !== Flags.Clean) return;
		this.flags = Flags.Check;
		const notify = [...this.subs];
		for (const cb of notify) cb();
	};

	read(): T {
		if (!this.evaluated) {
			this.recompute();
			this.flags = Flags.Clean;
		} else if (this.flags === Flags.Check) {
			if (this.changedInputs()) this.recompute();
			this.flags = Flags.Clean;
		}
		return this.value as T;
	}

	private changedInputs(): boolean {
		for (const [dep] of this.deps) {
			// pull model: a Check dep may or may not have changed — force its
			// freshness (recursively) before comparing versions
			if (dep instanceof ComputedNode && dep.flags === Flags.Check) dep.read();
			const seen = this.depVersions.get(dep);
			if (seen === undefined || seen !== dep.version) return true;
		}
		return false;
	}

	private depVersions = new Map<Node, number>();

	private recompute(): void {
		const parent = evaluationContext;
		// This is a dynamic dependency-tracking context, not a scope alias.
		// oxlint-disable-next-line typescript/no-this-alias
		evaluationContext = this;
		const oldDeps = this.deps;
		this.deps = new Map();
		let threw = true;
		let next: T | undefined;
		try {
			next = this.computeFn();
			threw = false;
		} finally {
			evaluationContext = parent;
			const firstEval = !this.evaluated;
			this.evaluated = true;
			for (const [dep, cbs] of oldDeps) {
				if (this.deps.has(dep)) continue;
				for (const cb of cbs) dep.subs.delete(cb);
			}
			if (!threw) {
				for (const [dep] of this.deps) this.depVersions.set(dep, dep.version);
				// version only moves on a real value change — children of a
				// recomputed-but-equal parent skip their own recompute
				if (firstEval || !this.equals(next as T, this.value as T)) {
					this.value = next;
					this.version++;
				}
			}
		}
	}
}

let evaluationContext: Pick<ComputedNode<unknown>, "deps" | "markCheck"> | null = null;

function trackRead(node: Node): void {
	const ctx = evaluationContext;
	if (!ctx) return;
	let cbs = ctx.deps.get(node);
	if (!cbs) {
		cbs = new Set();
		ctx.deps.set(node, cbs);
		const cb = ctx.markCheck;
		cbs.add(cb);
		node.subs.add(cb);
	}
}

// ---------------------------------------------------------------------------
// public API

export interface ReadableSignal<T> {
	(): T;
	subscribe(listener: (value: T) => void): Unsubscribe;
}

export interface WritableSignal<T> extends ReadableSignal<T> {
	set(value: T): void;
	update(fn: (current: T) => T): void;
	peek(): T;
}

function signalFrom<T>(node: StateNode<T> | ComputedNode<T>): ReadableSignal<T> {
	const read = (): T => {
		trackRead(node);
		return node instanceof StateNode ? node.value : node.read();
	};
	const equals =
		node instanceof ComputedNode ? node.equals : ((a: T, b: T) => Object.is(a, b) as boolean);
	const readable = (() => read()) as ReadableSignal<T>;
	readable.subscribe = (listener: (value: T) => void): Unsubscribe => {
		let last = read();
		listener(last);
		const run = () => {
			const v = read();
			if (!equals(v, last)) {
				last = v;
				listener(v);
			}
		};
		node.subs.add(run);
		return () => node.subs.delete(run);
	};
	return readable;
}

export function state<T>(initial: T, opts?: { equals?: Equals<T> | false }): WritableSignal<T> {
	const node = new StateNode<T>(
		initial,
		opts?.equals === false ? () => false : ((opts?.equals ?? Object.is) as Equals<T>),
	);
	const readable = signalFrom(node);
	const writable = Object.assign(readable, {
		set(value: T) {
			if (node.set(value)) scheduleEffectFlush();
		},
		update(fn: (current: T) => T) {
			if (node.set(fn(node.value))) scheduleEffectFlush();
		},
		peek: () => node.value,
	});
	return writable as WritableSignal<T>;
}

export function computed<T>(fn: () => T, opts?: { equals?: Equals<T> | false }): ReadableSignal<T> {
	const node = new ComputedNode<T>(
		fn,
		opts?.equals === false ? () => false : ((opts?.equals ?? Object.is) as Equals<T>),
	);
	return signalFrom(node);
}

export function effect(fn: () => void | (() => void)): Unsubscribe {
	let cleanup: void | (() => void) | undefined;
	let disposed = false;
	const node = new ComputedNode<null>(() => {
		cleanup?.();
		cleanup = fn();
		return null;
	}, () => false);
	const execute = () => {
		if (!disposed) node.read();
	};
	const run = () => {
		if (!disposed) effectQueue.add(execute);
	};
	node.read();
	node.subs.add(run);
	return () => {
		disposed = true;
		cleanup?.();
		effectQueue.delete(execute);
		node.subs.delete(run);
		for (const [dep, cbs] of node.deps) for (const cb of cbs) dep.subs.delete(cb);
		node.deps.clear();
	};
}

export function batch<T>(fn: () => T): T {
	batchDepth++;
	try {
		return fn();
	} finally {
		batchDepth--;
		if (batchDepth === 0) {
			const queued = [...effectQueue];
			effectQueue.clear();
			for (const run of queued) run();
		}
	}
}

export function untrack<T>(fn: () => T): T {
	const parent = evaluationContext;
	evaluationContext = null;
	try {
		return fn();
	} finally {
		evaluationContext = parent;
	}
}

function scheduleEffectFlush(): void {
	if (batchDepth > 0) return;
	const queued = [...effectQueue];
	effectQueue.clear();
	for (const run of queued) run();
}

/** Structural equality for arrays — the default for live queries. */
export function shallowArrayEquals<T>(a: readonly T[], b: readonly T[]): boolean {
	if (a === b) return true;
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
	return true;
}
