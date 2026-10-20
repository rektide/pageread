import { defineContentScript } from "wxt/utils/define-content-script";
import { browser } from "wxt/browser";
import { spec } from "../reader.ts";

export default defineContentScript({
  matches: spec.matches,
  world: "ISOLATED",
  runAt: "document_start",
  main() {
    window.addEventListener("message", (event) => {
      if (
        event.source !== window ||
        event.origin !== location.origin ||
        event.data?.channel !== "pageread-fixture"
      )
        return;
      void browser.runtime
        .sendMessage({ type: "capture", capture: event.data.capture })
        .catch((error) => console.error("pageread relay failed", error));
    });
  },
});
