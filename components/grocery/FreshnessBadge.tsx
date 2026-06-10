type Props = {
 freshnessDays: number;
};

export function FreshnessBadge({ freshnessDays }: Props) {
 return (
 <span className="inline-flex rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
 prices from {freshnessDays} day{freshnessDays === 1 ?"" :"s"} ago
 </span>
 );
}
