import { useEffect, useId, useRef, type ReactNode } from "react";
import { LuX } from "react-icons/lu";

export function Modal({
  open,
  title,
  onClose,
  children,
  headerless = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  headerless?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={headerless ? undefined : titleId}
      aria-label={headerless ? title : undefined}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {headerless ? (
        children
      ) : (
        <section className="modal-box max-h-[90vh] max-w-2xl overflow-y-auto p-0">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-base-300 bg-base-100 px-5 py-4">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <button
              type="button"
              className="btn btn-square btn-ghost btn-sm"
              aria-label="Tutup modal"
              onClick={onClose}
            >
              <LuX className="size-5" />
            </button>
          </header>
          {children}
        </section>
      )}
    </dialog>
  );
}
