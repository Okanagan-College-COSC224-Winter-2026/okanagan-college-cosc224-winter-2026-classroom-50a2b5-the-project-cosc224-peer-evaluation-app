import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "../../lib/toast";
import Modal from "../../ui/Modal";
import { useUpdateUser } from "./useAdmin";
import { getUserId, getUserRole, isSuperAdmin } from "../../util/login";

interface EditUserFormProps {
  user: User | null;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  role: string;
}

const inputClass =
  "px-3.5 py-2.5 border border-border rounded-lg bg-bg-secondary text-text-primary text-sm w-full focus:outline-none focus:ring-2 focus:ring-btn-primary/30 focus:border-btn-primary transition-all disabled:opacity-60 font-[inherit]";

const selectClass =
  "px-3.5 py-2.5 border border-border rounded-lg bg-bg-secondary text-text-primary text-sm w-full focus:outline-none focus:ring-2 focus:ring-btn-primary/30 focus:border-btn-primary transition-all disabled:opacity-60 font-[inherit] appearance-none cursor-pointer";

export default function EditUserForm({ user, onClose }: EditUserFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const { mutate: updateUser, isPending } = useUpdateUser();

  const isCurrentUser = user ? getUserId() === user.id : false;
  const currentRole = getUserRole();
  const canAssignAdmin = isSuperAdmin();
  // A plain admin cannot edit admin or super_admin accounts
  const targetIsProtected = user
    ? user.role === "super_admin" || (user.role === "admin" && currentRole !== "super_admin")
    : false;

  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email, role: user.role });
    }
  }, [user, reset]);

  function onSubmit(data: FormData) {
    if (!user) return;

    updateUser(
      { userId: user.id, data },
      {
        onSuccess: () => {
          toast.success(`User "${data.name}" updated successfully`);
          onClose();
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update user");
        },
      }
    );
  }

  return (
    <Modal isOpen={!!user} onClose={onClose} title="Edit User">
      {targetIsProtected ? (
        <div className="flex flex-col gap-4">
          <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            {user?.role === "super_admin"
              ? "Super Admin accounts cannot be edited."
              : "Admin accounts can only be edited by a Super Admin."}
          </div>
          <div className="flex justify-end pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer bg-transparent"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Full name</label>
            <input
              type="text"
              className={inputClass}
              disabled={isPending}
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input
              type="email"
              className={inputClass}
              disabled={isPending}
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email address" },
              })}
            />
            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Role</label>
            <select
              className={selectClass}
              disabled={isPending || isCurrentUser}
              {...register("role", { required: "Role is required" })}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              {canAssignAdmin && <option value="admin">Admin</option>}
            </select>
            {isCurrentUser && (
              <p className="text-xs text-text-secondary m-0">You cannot change your own role.</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer bg-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-lg bg-btn-primary text-white text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
