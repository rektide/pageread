import { browser } from "wxt/browser";

async function refresh() {
	const query = (document.querySelector("#query") as HTMLInputElement).value;
	const result = await browser.runtime.sendMessage({ type: "read", query });
	document.querySelector("#result")!.textContent = JSON.stringify(result, null, 2);
}
document.querySelector("#refresh")!.addEventListener("click", () => { void refresh(); });
void refresh();
