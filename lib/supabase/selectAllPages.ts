/**
 * Supabase returns at most 1,000 rows from one select (the project's max-rows
 * setting) and doesn't say when it has stopped. With 1,159 ingredient rows, a
 * single `.in("recipe_id", ids)` across every recipe silently left 32 recipes
 * with no ingredients and one with its rice missing.
 *
 * This asks for one page at a time until a short page comes back. Give the
 * query a stable order (`.order("id")`), or pages can overlap and skip rows.
 */
export const SUPABASE_PAGE_SIZE = 1000;

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

export async function selectAllPages<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = SUPABASE_PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}
