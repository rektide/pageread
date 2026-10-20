import type { Bundle } from "./engine.ts";

// Single record = one atomic snapshot of quads AND exact source documents.
async function open(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("checkpoints");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Checkpoint database upgrade blocked"));
  });
}
export async function saveCheckpoint(bundle: Bundle, name = "pageread-graph-lab"): Promise<void> {
  const db = await open(name);
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("checkpoints", "readwrite");
      tx.objectStore("checkpoints").put(bundle, "current");
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function loadCheckpoint(name = "pageread-graph-lab"): Promise<Bundle | undefined> {
  const db = await open(name);
  try {
    return await new Promise<Bundle | undefined>((resolve, reject) => {
      const tx = db.transaction("checkpoints", "readonly");
      const request = tx.objectStore("checkpoints").get("current");
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}
