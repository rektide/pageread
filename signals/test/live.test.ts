import { afterEach, describe, expect, it, vi } from "vitest";
import { domEvents, routerStats } from "../src/dom-router.ts";
import { liveQuery, liveQueryWhere } from "../src/live.ts";

afterEach(() => {
  document.body.innerHTML = "";
});

async function flushMicrotasks(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("dom router", () => {
  it("creates exactly one MutationObserver for the document across many consumers", async () => {
    routerStats.observersCreated = 0;
    const seen: number[] = [];
    domEvents().subscribe((b) => seen.push(b.records.length));
    domEvents().subscribe((b) => seen.push(b.records.length));
    expect(routerStats.observersCreated).toBe(1);
    document.body.append(document.createElement("div"));
    await flushMicrotasks();
    // both consumers got the same single batch
    expect(seen).toEqual([1, 1]);
    // more consumers, still one observer
    liveQuery("[data-msg]");
    liveQueryWhere((el) => el.tagName === "ARTICLE", { selector: "article" });
    expect(routerStats.observersCreated).toBe(1);
  });
});

describe("liveQuery", () => {
  it("starts with current matches and follows additions and removals", async () => {
    document.body.innerHTML = "<ul><li data-msg>a</li></ul>";
    const q = liveQuery("[data-msg]");
    expect(q().map((el) => el.textContent)).toEqual(["a"]);
    const seen: string[][] = [];
    q.subscribe((els) => seen.push(els.map((el) => el.textContent)));

    const li = document.createElement("li");
    li.dataset.msg = "";
    li.textContent = "b";
    document.querySelector("ul")!.append(li);
    await flushMicrotasks();
    expect(q().map((el) => el.textContent)).toEqual(["a", "b"]);

    li.remove();
    await flushMicrotasks();
    expect(q().map((el) => el.textContent)).toEqual(["a"]);
    expect(seen.at(-1)!.length).toBe(1);
  });

  it("precise invalidation: attribute change on a non-matching element does not notify", async () => {
    document.body.innerHTML = `<div id="other"></div><span data-role="msg"></span>`;
    const q = liveQuery("[data-role]");
    const calls: number[] = [];
    q.subscribe((els) => calls.push(els.length));
    expect(calls).toEqual([1]);

    (document.querySelector("#other") as HTMLElement).setAttribute("data-unrelated", "x");
    await flushMicrotasks();
    expect(calls).toEqual([1]); // no spurious notify

    (document.querySelector("span") as HTMLElement).setAttribute("data-role", "msg2");
    await flushMicrotasks();
    // attribute changed value but match set identical: no notify
    expect(calls).toEqual([1]);
    (document.querySelector("span") as HTMLElement).removeAttribute("data-role");
    await flushMicrotasks();
    expect(q()).toEqual([]);
    expect(calls.length).toBe(2);
  });

  it("subtree additions are detected (added node contains matches)", async () => {
    document.body.innerHTML = "";
    const q = liveQuery("[itemscope]");
    expect(q()).toEqual([]);
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div itemscope itemtype="https://opentelemetry.io/semconv/trace"></div>`;
    document.body.append(wrap);
    await flushMicrotasks();
    expect(q().length).toBe(1);
  });

  it("structural selectors re-query on any structural change", async () => {
    // jsdom's selector engine (nwsapi) can itself return stale :nth-child
    // results after mutation — the DOM above stays correct, only qsa lies.
    // So this asserts OUR invalidation (a fresh querySelectorAll ran),
    // not nwsapi's truth. Real browsers are the production target.
    document.body.innerHTML = "<ul><li>first</li><li id='target'>second</li></ul>";
    const qsa = vi.spyOn(document, "querySelectorAll");
    const second = liveQuery("li:nth-child(2)");
    expect(second()).toHaveLength(1);
    const callsBefore = qsa.mock.calls.length;
    document.querySelector("ul")!.prepend(document.createElement("li"));
    await flushMicrotasks();
    second();
    expect(qsa.mock.calls.length).toBeGreaterThan(callsBefore);
    qsa.mockRestore();
  });
});

describe("liveQueryWhere", () => {
  it("filters with a predicate and re-evaluates on structural change", async () => {
    document.body.innerHTML = `<div class="msg" data-author="user">one</div><div class="msg">two</div>`;
    const authored = liveQueryWhere((el) => el.hasAttribute("data-author"), {
      selector: ".msg",
    });
    expect(authored().length).toBe(1);
    const third = document.createElement("div");
    third.className = "msg";
    third.setAttribute("data-author", "user");
    document.body.append(third);
    await flushMicrotasks();
    expect(authored().length).toBe(2);
  });
});
