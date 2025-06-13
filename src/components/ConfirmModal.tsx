import { ReactNode, useState } from "react";
import Button from "@/components/Button";

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "default";
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger",
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      aria-modal="true"
      role="dialog"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--card)] text-[var(--card-foreground)] p-8 rounded-lg shadow-lg w-full max-w-sm relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-2xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 focus:outline-none cursor-pointer transition-colors"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-2 text-center">{title}</h2>
        {description && <div className="mb-4 text-center text-gray-600">{description}</div>}
        <div className="flex justify-center gap-4 mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={type === "danger" ? "destructive" : "primary"}
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}