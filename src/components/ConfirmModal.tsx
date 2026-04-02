"use client";

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Yes",
  cancelLabel = "No",
  onConfirm,
  onCancel,
  danger = false,
}: Props) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-navy-dark mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-white transition-colors ${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-navy hover:bg-navy-light"
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
