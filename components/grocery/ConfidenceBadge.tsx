type Props = {
 confidence: number; // 0-100
};

export function ConfidenceBadge({ confidence }: Props) {
 const tone =
 confidence >= 85
 ?"bg-[var(--semantic-success-bg)] text-[var(--semantic-success-text)]"
 : confidence >= 70
 ?"bg-[var(--semantic-warn-bg)] text-[var(--semantic-warn-text)]"
 :"bg-[var(--semantic-error-bg)] text-[var(--semantic-error-text)]";
 return (
 <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
 Confidence {confidence.toFixed(1)}%
 </span>
 );
}
