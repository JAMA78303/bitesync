import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const redirectTo = next?.startsWith("/") ? next : "/today";

  return (
    <AuthLayout mode="login" error={error ?? null}>
      <LoginForm redirectTo={redirectTo} />
    </AuthLayout>
  );
}
