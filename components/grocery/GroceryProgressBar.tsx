type Props = {
  total: number;
  checked: number;
};

export function GroceryProgressBar({ total, checked }: Props) {
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {checked} of {total} items
        </span>
        <span className="text-sm font-semibold text-[#1A4731]">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#1A4731] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
