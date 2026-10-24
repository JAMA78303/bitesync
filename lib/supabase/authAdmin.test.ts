import { createClient } from "@supabase/supabase-js";
import { AUTH_ADMIN_CLIENT_OPTIONS } from "@/lib/supabase/admin";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// Delete account removes the login through auth.admin. It must use a client
// built without `accessToken`, which makes supabase-js throw on auth access.
const authAdmin = createClient("https://example.supabase.co", "service-key", AUTH_ADMIN_CLIENT_OPTIONS);
assert(typeof authAdmin.auth.admin.deleteUser === "function", "auth.admin.deleteUser is available");

const tokenClient = createClient("https://example.supabase.co", "service-key", {
  accessToken: async () => "service-key",
});
let threw = false;
try {
  void tokenClient.auth.admin;
} catch {
  threw = true;
}
assert(threw, "a client with accessToken blocks auth.admin, so it must not be used for deletes");

console.log("authAdmin tests passed");
