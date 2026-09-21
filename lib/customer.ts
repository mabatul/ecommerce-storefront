// Anonymous customer identity: a random "guest-<uuid>" kept in localStorage. It scopes a cart
// and wishlist to this browser; it is NOT authentication (no login, no cross-device carts).
const STORAGE_KEY = "storefront-customer-id";
const FORMAT = /^guest-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

export const isValidCustomerId = (value: unknown): value is string => typeof value === "string" && FORMAT.test(value);

// crypto.randomUUID only exists in secure contexts (https / localhost); getRandomValues works everywhere.
function randomUuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

let fallbackId: string | null = null; // used when storage is blocked, so the tab stays consistent

function defaultStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getCustomerId(store: KeyValueStore | null = defaultStore()): string {
  try {
    const saved = store?.getItem(STORAGE_KEY);
    if (isValidCustomerId(saved)) return saved;
  } catch {
    // storage unreadable: fall through and mint one
  }

  const id = fallbackId ?? `guest-${randomUuid()}`;
  try {
    store?.setItem(STORAGE_KEY, id);
  } catch {
    fallbackId = id;
  }
  return id;
}

export function resetCustomerIdFallback() {
  fallbackId = null;
}
