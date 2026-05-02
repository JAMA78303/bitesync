type Props = {
  freshnessDays: number;
};

export function FreshnessBadge({ freshnessDays }: Props) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
      prices from {freshnessDays} day{freshnessDays === 1 ? "" : "s"} ago
    </span>
  );
}
