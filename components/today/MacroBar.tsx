type Props = {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
};

export function MacroBar({ label, value, target, unit, color }: Props) {
  const safeTarget = target > 0 ? target : 1;
  const progress = Math.min(value / safeTarget, 1);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-xs text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-300">{Math.round(value)}</span>
          {" / "}
          {target}
          {unit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
