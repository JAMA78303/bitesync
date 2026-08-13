import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function DietarySettingsRedirect() {
 redirect("/goals/dietary");
}
