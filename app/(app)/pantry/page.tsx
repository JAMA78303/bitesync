import { PantryPageClient } from "@/components/pantry/PantryPageClient";
import { getPantryItems } from "@/lib/supabase/pantry";
import { ds } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function PantryPage() {
 const items = await getPantryItems();

 return (
 <div className={`${ds.mobilePage} ${ds.pageContent}`}>
 <div className={ds.gradientHeader}>
 <span className={ds.kicker}>WASTE LESS</span>
 <h1 className={`mb-1.5 ${ds.pageTitle}`}>Your Pantry</h1>
 <p className={ds.pageSubtitle}>Cook from what you already have at home</p>
 </div>

 <div className={`${ds.mobileGutter} ${ds.overlap}`}>
 <PantryPageClient items={items} />
 </div>
 </div>
 );
}
