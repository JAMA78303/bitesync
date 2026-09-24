import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { CONFIRMED_LOG_IN_MESSAGE } from "@/lib/auth/emailVerification";
import { ds } from "@/lib/ui/classes";

export default async function LoginPage({
 searchParams,
}: {
 searchParams: Promise<{ error?: string; next?: string; confirmed?: string }>;
}) {
 const { error, next, confirmed } = await searchParams;
 const redirectTo = next?.startsWith("/") ? next :"/today";

 // A flag, not a message: the text comes from here, so a crafted link cannot
 // put words of its own on the login page.
 const success =
 confirmed ==="1" ? (
 <p className={`mb-4 rounded-2xl px-4 py-3 text-sm ${ds.successCallout}`}>{CONFIRMED_LOG_IN_MESSAGE}</p>
 ) : null;

 return (
 <AuthLayout mode="login" error={error ?? null} success={success}>
 <LoginForm redirectTo={redirectTo} />
 </AuthLayout>
 );
}
