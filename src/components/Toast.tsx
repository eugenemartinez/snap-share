import { useEffect } from "react";

export default function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-51 px-6 py-3 rounded-lg shadow-lg font-semibold
        ${
          type === "error"
            ? "bg-[#ef4444] text-white border border-[#b91c1c]"
            : "bg-[#22c55e] text-white border border-[#15803d]"
        }
        animate-fade-in`}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
}