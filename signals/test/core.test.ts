import { describe, expect, it } from "vitest";
import { batch, computed, effect, state, untrack } from "../src/core.ts";

describe("state/computed", () => {
	it("propagates through diamonds without glitches", () => {
		const a = state(1);
		const left = computed(() => a() * 2);
		const right = computed(() => a() * 3);
		const sum = computed(() => left() + right());
		expect(sum()).toBe(5);
		a.set(2);
		expect(sum()).toBe(10);
	});

	it("skips recompute when intermediate value is unchanged", () => {
		const a = state(1);
		let evals = 0;
		const unchanged = computed(() => {
			evals++;
			return a() < 10 ? "small" : "big";
		});
		let observed = "";
		unchanged.subscribe((v) => (observed = v));
		expect(observed).toBe("small");
		const evalsBefore = evals;
		a.set(2);
		expect(unchanged()).toBe("small");
		// subscriber not called again (value identical)
		expect(observed).toBe("small");
		expect(evals).toBe(evalsBefore + 1);
	});

	it("an equal-value recompute does not cascade into children", () => {
		const a = state(1);
		let childEvals = 0;
		const parent = computed(() => {
			a();
			return "constant";
		});
		const child = computed(() => {
			parent();
			childEvals++;
			return childEvals;
		});
		expect(child()).toBe(1);
		a.set(2);
		expect(child()).toBe(1); // parent recomputed but equal: child skipped
		expect(childEvals).toBe(1);
	});

	it("subscribe fires immediately with the current value", () => {
		const s = state("x");
		const seen: string[] = [];
		s.subscribe((v) => seen.push(v));
		s.set("y");
		expect(seen).toEqual(["x", "y"]);
	});
});

describe("effect", () => {
	it("runs on dependency change and disposes cleanly", () => {
		const s = state(0);
		const seen: number[] = [];
		const dispose = effect(() => {
			seen.push(s());
		});
		expect(seen).toEqual([0]);
		s.set(1);
		expect(seen).toEqual([0, 1]);
		dispose();
		s.set(2);
		expect(seen).toEqual([0, 1]);
	});

	it("receives cleanup functions between runs", () => {
		const s = state("a");
		const log: string[] = [];
		effect(() => {
			const v = s();
			log.push(`start:${v}`);
			return () => log.push(`end:${v}`);
		});
		s.set("b");
		expect(log).toEqual(["start:a", "end:a", "start:b"]);
	});

	it("coalesces under batch", () => {
		const a = state(0);
		const b = state(0);
		const runs: string[] = [];
		effect(() => {
			runs.push(`${a()}-${b()}`);
		});
		expect(runs).toEqual(["0-0"]);
		batch(() => {
			a.set(1);
			b.set(1);
		});
		expect(runs).toEqual(["0-0", "1-1"]);
	});
});

describe("untrack", () => {
	it("reads without subscribing", () => {
		const a = state(0);
		const b = state(0);
		let evals = 0;
		const c = computed(() => {
			evals++;
			const base = a();
			return base + untrack(() => b());
		});
		expect(c()).toBe(0);
		b.set(5);
		expect(c()).toBe(0); // cached: b is not a dependency
		expect(evals).toBe(1);
		a.set(1);
		expect(c()).toBe(6);
	});
});

describe("interop", () => {
	it("bridges preact signals", async () => {
		const { signal } = await import("@preact/signals-core");
		const foreign = signal(10);
		const { bridgeExternal } = await import("../src/subscribable.ts");
		const bridged = bridgeExternal(foreign, foreign.value);
		expect(bridged()).toBe(10);
		foreign.value = 20;
		expect(bridged()).toBe(20);
	});
});
