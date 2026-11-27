/**
 * Desmos calculator for Math tests and practices (like Bluebook's built-in calculator).
 *
 * Desmos only allows its calculator on other sites through its API, with a key from
 * https://www.desmos.com/my-api (the owner's Desmos account). The key is public by design: it is
 * sent in every visitor's browser. While it is empty, the Calculator button is hidden.
 * An environment variable (NEXT_PUBLIC_DESMOS_API_KEY) can override it, e.g. for a test key.
 */
const DESMOS_KEY_IN_REPO = "";

export const DESMOS_API_KEY = process.env.NEXT_PUBLIC_DESMOS_API_KEY || DESMOS_KEY_IN_REPO;

/** Desmos API version loaded from desmos.com. */
export const DESMOS_API_VERSION = "v1.12";

/**
 * Like the College Board version of Desmos on the digital SAT: no images, folders or notes, no
 * links out, alphabetical (not QWERTY) letter keypad. Everything else matches desmos.com.
 */
export const DESMOS_GRAPHING_OPTIONS = {
  images: false,
  folders: false,
  notes: false,
  links: false,
  pasteGraphLink: false,
  qwertyKeyboard: false,
  border: false,
  keypad: true,
  expressions: true,
  settingsMenu: true,
  zoomButtons: true,
} as const;

export const DESMOS_SCIENTIFIC_OPTIONS = {
  links: false,
  qwertyKeyboard: false,
} as const;
