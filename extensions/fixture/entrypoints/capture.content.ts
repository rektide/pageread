import { defineContentScript } from "wxt/utils/define-content-script";
import { installNetworkHooks } from "@pageread/extension-kit";

export default defineContentScript({
	matches: ["http://127.0.0.1/*"], world: "MAIN", runAt: "document_start",
	main() {
		installNetworkHooks((capture) => window.postMessage({ channel: "pageread-fixture", capture }, location.origin), { include: ["http://127.0.0.1:*/api/conversation"], methods: ["GET"] });
	},
});
