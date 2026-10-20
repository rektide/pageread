import { setupWorker } from "msw/browser";
import { http, HttpResponse } from "msw";

const worker = setupWorker(http.get("http://127.0.0.1:4173/api/conversation", () => HttpResponse.json({ title: "Local captured conversation", text: "The orchid reader captured this network response." }, { headers: { "x-fixture": "msw" } })));
await worker.start();
const button = document.querySelector<HTMLButtonElement>("#load")!;
button.disabled = false;
button.addEventListener("click", async () => {
	const response = await fetch("/api/conversation");
	document.querySelector("#response")!.textContent = await response.text();
});
