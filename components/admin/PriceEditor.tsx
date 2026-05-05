"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Check, ChevronDown, ChevronUp, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { addCanonicalItem, updateStorePrice } from "@/app/admin/prices/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CanonicalItem = {
  id: string;
  name: string;
  category: string;
  default_unit: string;
};

type StoreProduct = {
  id: string;
  store: string;
  product_name: string;
  canonical_item_id: string;
  price_gbp: number;
  size_value: number;
  size_unit: string;
  min_purchase_size: number | null;
  min_purchase_unit: string | null;
  min_purchase_price: number | null;
  price_volatility: "low" | "medium" | "high" | null;
  last_seen_at: string | null;
};

type Props = {
  canonicalItems: CanonicalItem[];
  storeProducts: StoreProduct[];
};

const STORES = ["tesco", "asda", "aldi"] as const;
const CATEGORIES = [
  "meat",
  "fish",
  "dairy",
  "grains",
  "veg",
  "fruit",
  "legumes",
  "nuts",
  "seeds",
  "oils",
  "condiments",
  "supplements",
] as const;
const VOLATILITY_OPTIONS = ["low", "medium", "high"] as const;

function getDaysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function getFreshnessColour(dateStr: string | null): string {
  const days = getDaysSince(dateStr);
  if (days <= 7) return "text-green-600";
  if (days <= 30) return "text-amber-600";
  return "text-red-500";
}

export function PriceEditor({ canonicalItems, storeProducts }: Props) {
  const router = useRouter();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const productsByItem = useMemo(() => {
    return storeProducts.reduce(
      (acc, p) => {
        if (!acc[p.canonical_item_id]) acc[p.canonical_item_id] = {};
        acc[p.canonical_item_id]![p.store] = p;
        return acc;
      },
      {} as Record<string, Record<string, StoreProduct>>,
    );
  }, [storeProducts]);

  const filteredItems = useMemo(() => {
    return canonicalItems.filter((item) => {
      const matchCat = filterCategory === "all" || item.category === filterCategory;
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [canonicalItems, filterCategory, search]);

  const byCategory = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category]!.push(item);
        return acc;
      },
      {} as Record<string, CanonicalItem[]>,
    );
  }, [filteredItems]);

  async function handleSave(productId: string, formData: FormData) {
    const data = {
      price_gbp: Number(formData.get("price_gbp")),
      size_value: Number(formData.get("size_value")),
      size_unit: String(formData.get("size_unit") ?? ""),
      min_purchase_size: formData.get("min_purchase_size")
        ? Number(formData.get("min_purchase_size"))
        : null,
      min_purchase_unit: String(formData.get("min_purchase_unit") ?? "") || null,
      min_purchase_price: formData.get("min_purchase_price")
        ? Number(formData.get("min_purchase_price"))
        : null,
      price_volatility: String(formData.get("price_volatility") ?? "medium") as "low" | "medium" | "high",
    };

    startTransition(async () => {
      setErrorMsg(null);
      const result = await updateStorePrice(productId, data);
      if ("success" in result && result.success) {
        setSavedItems((prev) => new Set([...prev, productId]));
        setTimeout(() => {
          setSavedItems((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        }, 2000);
        router.refresh();
      } else if ("error" in result) {
        setErrorMsg(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-9 max-w-xs rounded-md border border-slate-200 bg-white px-2 text-sm"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <Button onClick={() => setShowAddForm(true)} className="ml-auto bg-[#1A4731] text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      </div>

      {errorMsg ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold text-slate-800">{canonicalItems.length}</p>
          <p className="mt-1 text-xs text-slate-400">Canonical items</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold text-slate-800">{storeProducts.length}</p>
          <p className="mt-1 text-xs text-slate-400">Store products</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold text-amber-600">
            {storeProducts.filter((p) => getDaysSince(p.last_seen_at) > 30).length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Need updating</p>
        </div>
      </div>

      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category} className="rounded-xl border bg-white">
          <div className="rounded-t-xl border-b bg-slate-50 px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{category}</h2>
          </div>

          <div className="divide-y">
            {items.map((item) => {
              const products = productsByItem[item.id] ?? {};
              const isExpanded = expandedItem === item.id;
              const oldestUpdate = Object.values(products)
                .map((p) => p.last_seen_at)
                .sort()[0];
              const needsUpdate = oldestUpdate && getDaysSince(oldestUpdate) > 30;

              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium capitalize text-slate-800">{item.name}</span>
                      {needsUpdate ? (
                        <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          Update needed
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden gap-4 text-sm sm:flex">
                        {STORES.map((store) => {
                          const p = products[store];
                          return (
                            <span key={store} className="text-slate-500">
                              <span className="mr-1 text-xs text-slate-300">{store}</span>
                              {p ? `£${Number(p.price_gbp).toFixed(2)}` : "—"}
                            </span>
                          );
                        })}
                      </div>
                      {oldestUpdate ? (
                        <span className={`text-xs ${getFreshnessColour(oldestUpdate)}`}>
                          {getDaysSince(oldestUpdate)}d ago
                        </span>
                      ) : null}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="bg-slate-50/50 px-5 pb-5">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {STORES.map((store) => {
                          const p = products[store];
                          if (!p) {
                            return (
                              <div
                                key={store}
                                className="rounded-lg border border-dashed p-4 text-center text-sm text-slate-400"
                              >
                                No {store} product
                              </div>
                            );
                          }

                          return (
                            <form
                              key={store}
                              action={async (formData) => {
                                await handleSave(p.id, formData);
                              }}
                              className="space-y-3 rounded-lg border bg-white p-4"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-semibold capitalize text-slate-700">{store}</span>
                                <span className={`text-xs ${getFreshnessColour(p.last_seen_at)}`}>
                                  {getDaysSince(p.last_seen_at)}d ago
                                </span>
                              </div>

                              <div>
                                <label className="mb-1 block text-xs text-slate-500">Pack price (£)</label>
                                <Input
                                  name="price_gbp"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  defaultValue={p.price_gbp}
                                  className="h-8 text-sm"
                                />
                              </div>

                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="mb-1 block text-xs text-slate-500">Pack size</label>
                                  <Input
                                    name="size_value"
                                    type="number"
                                    step="0.1"
                                    defaultValue={p.size_value}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="w-20">
                                  <label className="mb-1 block text-xs text-slate-500">Unit</label>
                                  <Input name="size_unit" defaultValue={p.size_unit} className="h-8 text-sm" />
                                </div>
                              </div>

                              <div>
                                <label className="mb-1 block text-xs text-slate-500">Min purchase price (£)</label>
                                <Input
                                  name="min_purchase_price"
                                  type="number"
                                  step="0.01"
                                  defaultValue={p.min_purchase_price ?? p.price_gbp}
                                  className="h-8 text-sm"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-xs text-slate-500">Price volatility</label>
                                <select
                                  name="price_volatility"
                                  defaultValue={p.price_volatility ?? "medium"}
                                  className="h-8 w-full rounded-md border bg-white px-2 text-sm"
                                >
                                  {VOLATILITY_OPTIONS.map((v) => (
                                    <option key={v} value={v}>
                                      {v.charAt(0).toUpperCase() + v.slice(1)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <input type="hidden" name="min_purchase_size" defaultValue={p.min_purchase_size ?? ""} />
                              <input type="hidden" name="min_purchase_unit" defaultValue={p.min_purchase_unit ?? ""} />

                              <button
                                type="submit"
                                disabled={isPending}
                                className={`flex h-8 w-full items-center justify-center gap-1 rounded-md text-xs font-medium transition-all ${
                                  savedItems.has(p.id)
                                    ? "bg-green-500 text-white"
                                    : "bg-[#1A4731] text-white hover:bg-[#153928]"
                                }`}
                              >
                                {isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : savedItems.has(p.id) ? (
                                  <>
                                    <Check className="h-3 w-3" /> Saved
                                  </>
                                ) : (
                                  "Save"
                                )}
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {showAddForm ? <AddItemForm onClose={() => setShowAddForm(false)} /> : null}
    </div>
  );
}

function AddItemForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setErrorMsg(null);
      const result = await addCanonicalItem({
        name: String(formData.get("name") ?? ""),
        category: String(formData.get("category") ?? ""),
        default_unit: String(formData.get("default_unit") ?? ""),
        is_vegan: formData.get("is_vegan") === "true",
        is_vegetarian: formData.get("is_vegetarian") === "true",
        is_gluten_free: formData.get("is_gluten_free") === "true",
        is_dairy_free: formData.get("is_dairy_free") === "true",
      });
      if ("success" in result && result.success) {
        onClose();
        router.refresh();
      } else if ("error" in result) {
        setErrorMsg(result.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Add new canonical item</h2>
        {errorMsg ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
        ) : null}
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Name (lowercase)</label>
            <Input name="name" placeholder="e.g. brown rice" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Category</label>
            <select name="category" className="h-9 w-full rounded-md border px-2 text-sm">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Default unit</label>
            <Input name="default_unit" placeholder="g, ml, piece" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["is_vegan", "Vegan"],
              ["is_vegetarian", "Vegetarian"],
              ["is_gluten_free", "Gluten free"],
              ["is_dairy_free", "Dairy free"],
            ].map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name={name} value="true" />
                {label}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} className="flex-1 bg-[#1A4731] text-white">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add item"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
