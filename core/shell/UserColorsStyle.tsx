import { USER_COLORS_STYLE_ID, userColorsCss, type UserColors } from "./colors";

/** Puts the student's two colors on the page (inside `.gb-colors` only). The profile page updates it live. */
export function UserColorsStyle(colors: UserColors) {
  return <style id={USER_COLORS_STYLE_ID} dangerouslySetInnerHTML={{ __html: userColorsCss(colors) }} />;
}
