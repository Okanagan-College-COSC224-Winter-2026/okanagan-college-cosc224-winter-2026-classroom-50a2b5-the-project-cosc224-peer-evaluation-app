import toast from "react-hot-toast";
import Modal from "../../ui/Modal";
import { useDeleteUser } from "./useAdmin";

interface DeleteUserConfirmProps {
  user: User | null;
  onClose: () => void;
}

export default function DeleteUserConfirm({ user, onClose }: DeleteUserConfirmProps) {
  const { mutate: deleteUser, isPending } = useDeleteUser();

  function handleDelete() {
    if (!user) return;

    deleteUser(user.id, {
      onSuccess: () => {
        toast.success(`User "${user.name}" deleted successfully`);
        onClose();
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete user");
        onClose();
      },
    });
  }

  return (
    <Modal isOpen={!!user} onClose={onClose} title="Delete User">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary m-0">
          Are you sure you want to delete <strong className="text-text-primary">{user?.name}</strong> ({user?.email})?
          This action cannot be undone. All their enrollments, submissions, and reviews will be permanently removed.
        </p>

        <div className="flex gap-3 justify-end pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer bg-transparent"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold border-none cursor-pointer transition-all duration-150 hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Deleting..." : "Delete user"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
