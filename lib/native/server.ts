import { headers } from "next/headers";
import { isNativeAppUserAgent } from "@/lib/native/app";

/** True when this request comes from the BiteSync iPhone app. */
export async function isNativeAppRequest(): Promise<boolean> {
  return isNativeAppUserAgent((await headers()).get("user-agent"));
}
