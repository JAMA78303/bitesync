import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/shared/Logo";

const POSTS: Record<
 string,
 { title: string; category: string; body: string[] }
> = {
"thermic-effect-of-protein": {
 title:"Why protein keeps you fuller for longer",
 category:"Nutrition science",
 body: [
"Protein has a higher thermic effect of food (TEF) than carbs or fat — your body uses more energy digesting it.",
"When you plan meals in BiteSync with a protein target, you spread intake across the day instead of loading it all at dinner.",
"That steady distribution helps satiety and makes it easier to stick to your calorie goal without feeling deprived.",
 ],
 },
"meal-planning-reduce-food-waste": {
 title:"How meal planning cuts food waste",
 category:"Sustainable shopping",
 body: [
"Impulse shopping without a list is one of the biggest drivers of food waste in UK homes.",
"BiteSync builds your grocery list from the meals you actually planned — so you buy what you will use.",
"Checking items off in the supermarket keeps you focused, and archiving recipes lets you rotate favourites without clutter.",
 ],
 },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
 return Object.keys(POSTS).map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: Props) {
 const { slug } = await params;
 const post = POSTS[slug];
 if (!post) notFound();

 return (
 <div className="min-h-screen bg-[var(--surface-card)]">
 <header className="border-b border-[var(--border-subtle)] px-4 py-4">
 <Logo size="sm" href="/" />
 </header>
 <article className="mx-auto max-w-2xl px-4 py-12">
 <p className="text-sm font-medium text-[var(--brand-primary)]">{post.category}</p>
 <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{post.title}</h1>
 <div className="mt-8 space-y-4 text-base leading-relaxed text-[var(--text-secondary)]">
 {post.body.map((paragraph) => (
 <p key={paragraph.slice(0, 40)}>{paragraph}</p>
 ))}
 </div>
 <Link
 href="/signup"
 className="mt-10 inline-flex rounded-xl bg-[var(--btn-primary-bg)] px-5 py-2.5 text-sm font-medium text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
 >
 Try BiteSync free
 </Link>
 <p className="mt-6">
 <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--brand-primary)]">
 ← Back to home
 </Link>
 </p>
 </article>
 </div>
 );
}
