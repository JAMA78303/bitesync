import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/shared/Logo";

const POSTS: Record<
  string,
  { title: string; category: string; body: string[] }
> = {
  "thermic-effect-of-protein": {
    title: "Why protein keeps you fuller for longer",
    category: "Nutrition science",
    body: [
      "Protein has a higher thermic effect of food (TEF) than carbs or fat — your body uses more energy digesting it.",
      "When you plan meals in BiteSync with a protein target, you spread intake across the day instead of loading it all at dinner.",
      "That steady distribution helps satiety and makes it easier to stick to your calorie goal without feeling deprived.",
    ],
  },
  "meal-planning-reduce-food-waste": {
    title: "How meal planning cuts food waste",
    category: "Sustainable shopping",
    body: [
      "Impulse shopping without a list is one of the biggest drivers of food waste in UK homes.",
      "BiteSync builds your grocery list from the meals you actually planned — so you buy what you will use.",
      "Checking items off in the supermarket keeps you focused, and archiving recipes lets you rotate favourites without clutter.",
    ],
  },
  "tesco-asda-aldi-grocery-comparison": {
    title: "Tesco vs Asda vs Aldi for your weekly shop",
    category: "UK supermarkets",
    body: [
      "BiteSync Pro estimates basket totals across Tesco, Asda, and Aldi using manually verified price snapshots.",
      "Prices are indicative — always check shelf labels — but comparing stores helps you spot where your usual basket is cheapest.",
      "Store badges on your grocery list remind you which items you priced at which chain when you planned the week.",
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
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 px-4 py-4">
        <Logo size="sm" href="/" />
      </header>
      <article className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm font-medium text-[#3a5a40]">{post.category}</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{post.title}</h1>
        <div className="mt-8 space-y-4 text-base leading-relaxed text-slate-600">
          {post.body.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
        <Link
          href="/signup"
          className="mt-10 inline-flex rounded-xl bg-[#3a5a40] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2f4a35]"
        >
          Try BiteSync free
        </Link>
        <p className="mt-6">
          <Link href="/" className="text-sm text-slate-500 hover:text-[#3a5a40]">
            ← Back to home
          </Link>
        </p>
      </article>
    </div>
  );
}
