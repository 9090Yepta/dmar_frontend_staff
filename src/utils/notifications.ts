import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import toast from "react-hot-toast";

const confirmationDialog = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    confirmButton: "btn btn-primary",
    cancelButton: "btn btn-ghost",
    denyButton: "btn btn-error",
    popup: "rounded-2xl",
    actions: "gap-2",
  },
});

export async function confirmAction(options: {
  title: string;
  text: string;
  confirmButtonText: string;
}) {
  const result = await confirmationDialog.fire({
    icon: "warning",
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText,
    cancelButtonText: "Batal",
    reverseButtons: true,
  });
  return result.isConfirmed;
}

export function showSuccess(title: string) {
  return toast.success(title);
}

export function showError(title: string, text: string) {
  return toast.error(text ? `${title}: ${text}` : title);
}
