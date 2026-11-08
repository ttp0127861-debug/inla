import { useState, type DragEvent } from "react";

export function Dropzone({
  state = "empty",
  fileName,
  hint,
  onSelect,
  disabled,
}: {
  state?: "empty" | "uploading" | "done" | "error";
  fileName?: string;
  hint?: string;
  onSelect?: (file: File) => void;
  disabled?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const displayName = fileName ?? "ban-ve-ky-thuat.pdf";
  if (state === "uploading") {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[#9ca3af] bg-[#f8f6f3] p-4">
        <p className="text-sm font-semibold">{displayName}</p>
        <p className="text-xs text-[var(--color-text-muted)]">Đang tải tệp lên hệ thống... 2,8 MB / 4,1 MB</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
          <div className="h-full w-[68%] bg-[var(--color-action-primary)]" />
        </div>
      </div>
    );
  }
  if (state === "done") {
    return (
      <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 py-2">
        <div>
          <p className="text-sm font-semibold">{displayName}</p>
          <p className="text-xs text-[#166534]">Tải tệp thành công · PDF · 4,1 MB</p>
        </div>
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-semantic-error)] bg-[#fff7f7] p-4 text-sm text-[var(--color-semantic-error)]">
        Chưa có tài liệu đính kèm. Bạn phải đính kèm ít nhất 01 tệp tài liệu bắt buộc.
      </div>
    );
  }

  const acceptDrop = (event: DragEvent<HTMLLabelElement>) => {
    if (disabled || !onSelect) return;
    event.preventDefault();
    event.stopPropagation();
  };

  const pick = onSelect ? (
    <label
      className={`grid h-[120px] place-items-center rounded-[var(--radius-md)] border-[1.5px] border-dashed text-center ${
        disabled ? "pointer-events-none border-[#9ca3af] bg-[#f8f6f3] opacity-50" : dragOver ? "cursor-copy border-[var(--color-action-primary)] bg-[#eff6ff]" : "cursor-pointer border-[#9ca3af] bg-[#f8f6f3]"
      }`}
      onDragEnter={acceptDrop}
      onDragOver={(event) => {
        acceptDrop(event);
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setDragOver(false);
      }}
      onDrop={(event) => {
        acceptDrop(event);
        setDragOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) onSelect(file);
      }}
    >
      <input
        type="file"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelect(file);
          event.target.value = "";
        }}
      />
      <div>
        <p className="text-sm font-semibold">{dragOver ? "Thả tệp để tải lên" : "Kéo thả tệp vào đây hoặc nhấn để chọn"}</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {hint ?? "PDF, DOCX, XLSX, JPG hoặc PNG · Tối đa 10MB/tệp"}
        </p>
      </div>
    </label>
  ) : (
    <div className="grid h-[120px] place-items-center rounded-[var(--radius-md)] border-[1.5px] border-dashed border-[#9ca3af] bg-[#f8f6f3] text-center">
      <div>
        <p className="text-sm font-semibold">Kéo thả tệp vào đây hoặc nhấn để chọn</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {hint ?? "PDF, DOCX, XLSX, JPG hoặc PNG · Tối đa 10MB/tệp"}
        </p>
      </div>
    </div>
  );

  return pick;
}
