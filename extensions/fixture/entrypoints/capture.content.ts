import { defineContentScript } from "wxt/utils/define-content-script";
import { installNetworkHooks } from "@pageread/extension-kit";
import { spec } from "../reader.ts";

export default defineContentScript({
  matches: spec.matches,
  world: "MAIN",
  runAt: spec.runAt,
  main() {
    installNetworkHooks(
      (capture) => window.postMessage({ channel: "pageread-fixture", capture }, location.origin),
      spec.network,
    );
  },
});
