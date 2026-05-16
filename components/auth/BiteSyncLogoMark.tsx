export function BiteSyncLogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <line x1="10" y1="4" x2="10" y2="14" stroke="#3a5a40" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="4" x2="16" y2="14" stroke="#3a5a40" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="22" y1="4" x2="22" y2="14" stroke="#3a5a40" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 14 Q10 20 16 22 L16 28" stroke="#3a5a40" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 14 Q22 20 16 22" stroke="#3a5a40" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="4" x2="24" y2="28" stroke="#7ab87a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 4 Q30 9 27 14 L24 14 Z" fill="#7ab87a" />
    </svg>
  );
}
