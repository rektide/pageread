import { describe, expect, it } from "vitest";
import { itemTypeMatches, itemsFromDom } from "../src/index.ts";

const html = `
<body>
  <article itemscope itemtype="https://opentelemetry.io/semconv/trace" itemid="urn:pageread:trace:chatgpt/c-1">
    <div itemscope itemtype="https://opentelemetry.io/semconv/resource" itemprop="resource">
      <meta itemprop="service.name" content="chatgpt.com">
      <span itemprop="pageread.conversation.id" itemscope itemtype="https://opentelemetry.io/semconv/event">ignored</span>
    </div>
    <div itemscope itemtype="https://opentelemetry.io/semconv/span" itemprop="spans">
      <span itemprop="trace_id">0123456789abcdef0123456789abcdef</span>
      <span itemprop="name">GET /backend-api/conversation/c-1</span>
      <time itemprop="start_time_unix_nano" datetime="1000000000000">yesterday</time>
      <a itemprop="url.full" href="https://chatgpt.com/backend-api/conversation/c-1">link</a>
      <div itemprop="events" itemscope itemtype="https://opentelemetry.io/semconv/event">
        <span itemprop="name">gen_ai.content.prompt</span>
      </div>
    </div>
    <div itemprop="spans" itemscope itemtype="https://opentelemetry.io/semconv/span">
      <span itemprop="trace_id">0123456789abcdef0123456789abcdef</span>
      <span itemprop="span_id">0000000000000001</span>
      <span itemprop="name">chatgpt turn node-1</span>
      <span itemprop="start_time_unix_nano">2000000000000</span>
    </div>
    <span id="status-note" itemprop="status.code" itemscope itemtype="https://opentelemetry.io/semconv/event"></span>
  </article>
  <div itemprop="orphan" itemscope itemtype="https://opentelemetry.io/semconv/span"></div>
</body>`;

function doc(): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("itemsFromDom", () => {
  it("extracts typed items with nested values", () => {
    const items = itemsFromDom(doc(), { type: "https://opentelemetry.io/semconv/trace" });
    expect(items).toHaveLength(1);
    const t = items[0]!;
    expect(t["@id"]).toBe("urn:pageread:trace:chatgpt/c-1");
    expect(t["resource"]).toMatchObject({
      "@type": "https://opentelemetry.io/semconv/resource",
      "service.name": "chatgpt.com",
    });
    // multi-valued itemprop aggregates into an array
    const spans = t["spans"];
    expect(Array.isArray(spans) && spans.length === 2).toBe(true);
    // element-specific value rules: time→datetime, a→href
    const first = (Array.isArray(spans) ? spans[0] : {}) as Record<string, unknown>;
    expect(first["start_time_unix_nano"]).toBe("1000000000000");
    expect(first["url.full"]).toBe("https://chatgpt.com/backend-api/conversation/c-1");
  });

  it("extracts every typed item, unfiltered", () => {
    const all = itemsFromDom(doc());
    const types = all.map((i) => i["@type"]);
    expect(types.filter((t) => t.endsWith("/trace"))).toHaveLength(1);
    expect(types.filter((t) => t.endsWith("/span"))).toHaveLength(3);
  });

  it("supports itemref pulling props from outside the item subtree", () => {
    const d = new DOMParser().parseFromString(
      `<div itemscope itemtype="https://opentelemetry.io/semconv/span" itemref="ext">
				 <span itemprop="name">turn</span>
			 </div>
			 <span id="ext" itemprop="trace_id">0123456789abcdef0123456789abcdef</span>`,
      "text/html",
    );
    const items = itemsFromDom(d, { type: "https://opentelemetry.io/semconv/span" });
    expect(items[0]).toMatchObject({
      name: "turn",
      trace_id: "0123456789abcdef0123456789abcdef",
    });
  });
});

describe("itemTypeMatches", () => {
  it("matches exact and trailing segments, rejecting empties", () => {
    expect(
      itemTypeMatches(
        "https://opentelemetry.io/semconv/trace",
        "https://opentelemetry.io/semconv/trace",
      ),
    ).toBe(true);
    expect(itemTypeMatches("https://host/vocab#trace", "trace")).toBe(true);
    expect(itemTypeMatches("https://host/trace", "trace")).toBe(true);
    expect(itemTypeMatches("https://host/span", "trace")).toBe(false);
  });
});
