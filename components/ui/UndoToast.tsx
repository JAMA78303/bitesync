"use client";

type Props = {
  message: string;
  undoLabel?: string;
  onUndo: () => void;
  visible: boolean;
};

/** Fixed snackbar with Undo — sits above mobile bottom nav. */
export function UndoToast({ message, undoLabel = "Undo", onUndo, visible }: Props) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-[70] flex justify-center px-4 md:bottom-6"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white shadow-2xl dark:border-gray-700">
        <p className="min-w-0 flex-1 font-medium">{message}</p>
        <button
          type="button"
          onClick={onUndo}
          className="flex-shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-[#86efac] hover:bg-white/10"
        >
          {undoLabel}
        </button>
      </div>
    </div>
  );
}
