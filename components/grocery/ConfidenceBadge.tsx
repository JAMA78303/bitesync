type Props = {
 confidence: number; // 0-100
};

export function ConfidenceBadge({ confidence }: Props) {
 const tone =
 confidence >= 85
 ?"bg-emerald-100 text-emerald-800"
 : confidence >= 70
 ?"bg-amber-100 text-amber-800"
 :"bg-red-100 text-red-800";
 return (
 <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
 Confidence {confidence.toFixed(1)}%
 </span>
 );
}
