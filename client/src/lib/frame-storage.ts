import { storedFrameSchema, type LoadedFrame, type StoredFrame } from "./frame-schema";

export interface FrameStorage {
  list(): Promise<StoredFrame[]>;
  save(frame: LoadedFrame): Promise<void>;
  remove(id: string): Promise<void>;
}

const DATABASE_NAME = "eye-club-local-frames";
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("Local frame storage is unavailable in this browser.")); return; }
    const request = indexedDB.open(DATABASE_NAME, 1);
    const timeout = window.setTimeout(() => { request.onerror = null; reject(new Error("Local frame storage timed out. Continuing without saved frames.")); }, 2_000);
    request.onupgradeneeded = () => request.result.createObjectStore("frames", { keyPath: "id" });
    request.onsuccess = () => { window.clearTimeout(timeout); resolve(request.result); };
    request.onerror = () => { window.clearTimeout(timeout); reject(new Error("Local frame storage is unavailable in this browser.")); };
    request.onblocked = () => { window.clearTimeout(timeout); reject(new Error("Close other Eye Club tabs, then retry local storage.")); };
  });
}

/** Only merchant frame assets/calibration enter this store. No photo or face data. */
export const frameStorage: FrameStorage = {
  async list() {
    const database = await openDatabase();
    try {
      return await new Promise<StoredFrame[]>((resolve, reject) => {
        const transaction = database.transaction("frames", "readonly");
        const request = transaction.objectStore("frames").getAll();
        transaction.oncomplete = () => {
          try { resolve(storedFrameSchema.array().parse(request.result as unknown)); }
          catch { reject(new Error("Saved frames could not be validated. Local data may be from an incompatible version.")); }
        };
        transaction.onabort = () => reject(new Error("Saved frames could not be read."));
        transaction.onerror = () => reject(new Error("Saved frames could not be read."));
      });
    } finally { database.close(); }
  },
  async save(frame) {
    const record = storedFrameSchema.parse(frame); // strips source URL and DOM image
    const database = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction("frames", "readwrite");
        transaction.objectStore("frames").put(record);
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(new Error("Could not save the frame. Browser storage may be full or unavailable."));
        transaction.onerror = () => reject(new Error("Could not save the frame. Browser storage may be full or unavailable."));
      });
    } finally { database.close(); }
  },
  async remove(id) {
    const database = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction("frames", "readwrite");
        transaction.objectStore("frames").delete(id);
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(new Error("The saved frame could not be removed."));
        transaction.onerror = () => reject(new Error("The saved frame could not be removed."));
      });
    } finally { database.close(); }
  },
};
