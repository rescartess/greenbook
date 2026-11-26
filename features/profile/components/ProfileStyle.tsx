import { UserColorsStyle } from "@/core/shell";
import { getLook } from "../queries";

/** The student's two colors as a style tag, for layouts that don't show the side menu (Admin). */
export async function ProfileStyle() {
  const look = await getLook();
  return <UserColorsStyle {...look.colors} />;
}
