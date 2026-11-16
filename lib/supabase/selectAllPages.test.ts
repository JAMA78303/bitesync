import { selectAllPages, SUPABASE_PAGE_SIZE } from "@/lib/supabase/selectAllPages";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** Stands in for a Supabase table that, like the real one, returns at most 1,000 rows a select. */
function fakeTable(total: number) {
  const rows = Array.from({ length: total }, (_, i) => ({ id: i }));
  const calls: [number, number][] = [];
  const page = async (from: number, to: number) => {
    calls.push([from, to]);
    const end = Math.min(to + 1, from + SUPABASE_PAGE_SIZE);
    return { data: rows.slice(from, end), error: null };
  };
  return { page, calls };
}

async function main() {
  // 1,159 rows: the recipe_ingredients count when 32 recipes went missing.
  const ingredients = fakeTable(1159);
  const all = await selectAllPages(ingredients.page);
  assert(all.length === 1159, `expected 1159 rows, got ${all.length}`);
  assert(new Set(all.map((r) => r.id)).size === 1159, "no row twice");
  assert(ingredients.calls.length === 2, "two pages");
  assert(ingredients.calls[1][0] === 1000 && ingredients.calls[1][1] === 1999, "second page starts at 1000");

  // Exactly one full page needs a second, empty request to know it's the end.
  const exact = fakeTable(1000);
  assert((await selectAllPages(exact.page)).length === 1000, "exactly 1000");
  assert(exact.calls.length === 2, "checks for a second page");

  assert((await selectAllPages(fakeTable(0).page)).length === 0, "empty table");

  let threw = false;
  try {
    await selectAllPages(async () => ({ data: null, error: { message: "permission denied" } }));
  } catch (e) {
    threw = e instanceof Error && e.message === "permission denied";
  }
  assert(threw, "errors are thrown, not read as an empty table");

  console.log("selectAllPages.test.ts: pages past Supabase's 1,000-row cap");
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
