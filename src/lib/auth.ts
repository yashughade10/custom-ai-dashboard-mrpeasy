import { removeLocalStorageItem } from "@/lib/local-storage";

export function clearAuth() {
  if (typeof window === "undefined") return;

  removeLocalStorageItem("auth");
  window.dispatchEvent(new Event("authChange"));
}

