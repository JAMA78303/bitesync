import { PantryPageClient } from "@/components/pantry/PantryPageClient";
import { getPantryItems } from "@/lib/supabase/pantry";
import { ds } from "@/lib/ui/classes";

export default async function PantryPage() {
  const items = await getPantryItems();

  return (
    <div className={`${ds.mobilePage} ${ds.pageContent}`}>
      <div className={ds.gradientHeader}>
        <h1 className={ds.pageTitle}>Pantry</h1>
        <p className={`mt-0.5 ${ds.pageSubtitle}`}>Cook from what you already have at home</p>
      </div>

      <div className={`${ds.mobileGutter} ${ds.overlap}`}>
        <PantryPageClient items={items} />
      </div>
    </div>
  );
}
