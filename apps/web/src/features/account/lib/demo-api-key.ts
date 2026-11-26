/** An API key as the settings list shows it. The full value is never kept here. */
export interface DemoApiKey {
  id: string;
  name: string;
  /** Last four characters of the key, the only part shown after creation. */
  lastFour: string;
  createdLabel: string;
}

const DEMO_KEY_PREFIX = "dk_demo_";
const TOKEN_BYTES = 12;

/**
 * A random demo key for the prototype; it does not authenticate anything. Reads randomness, so
 * call it from an event handler, never during render.
 */
export function generateDemoApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${DEMO_KEY_PREFIX}${token}`;
}

/** "3f9a" → "dk_••••••••3f9a" */
export function formatMaskedKey(lastFour: string): string {
  return `dk_••••••••${lastFour}`;
}
