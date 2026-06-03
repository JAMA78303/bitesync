import { PantryPageClient } from "@/components/pantry/PantryPageClient";
import { getPantryItems } from "@/lib/supabase/pantry";

export default async function PantryPage() {
  const items = await getPantryItems();

  return (
    <div className="-mx-4 min-h-screen bg-gray-50 pb-28 dark:bg-gray-950 md:mx-0">
      <div className="bg-gradient-to-b from-[#3a5a40] to-[#4a7a50] px-5 pt-14 pb-8">
        <h1 className="text-xl font-bold text-white">Pantry</h1>
        <p className="mt-0.5 text-sm text-white/70">Cook from what you already have at home</p>
      </div>

      <div className="-mt-4 px-4">
        <PantryPageClient items={items} />
      </div>
    </div>
  );
}
