import { redirect } from "next/navigation";

type Props = {
 searchParams: Promise<{ success?: string; cancelled?: string }>;
};

export const dynamic = "force-dynamic";

export default async function LegacyBillingRedirect({ searchParams }: Props) {
 const p = await searchParams;
 const q = new URLSearchParams();
 if (p.success != null) q.set("success", p.success);
 if (p.cancelled != null) q.set("cancelled", p.cancelled);
 const suffix = q.toString() ? `?${q.toString()}` :"";
 redirect(`/billing${suffix}`);
}
