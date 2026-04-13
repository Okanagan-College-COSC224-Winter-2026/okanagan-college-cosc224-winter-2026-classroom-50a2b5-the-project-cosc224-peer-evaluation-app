import { useForm } from "react-hook-form";
import toast from "../../lib/toast";
import Modal from "../../ui/Modal";
import { isSuperAdmin } from "../../util/login";
import { useCreateUser } from "./useAdmin";

interface CreateUserFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role: string;
}

const inputClass =
  "px-3.5 py-2.5 border border-border rounded-lg bg-bg-secondary text-text-primary text-sm w-full focus:outline-none focus:ring-2 focus:ring-btn-primary/30 focus:border-btn-primary transition-all disabled:opacity-60 font-[inherit]";

const selectClass =
  "px-3.5 py-2.5 border border-border rounded-lg bg-bg-secondary text-text-primary text-sm w-full focus:outline-none focus:ring-2 focus:ring-btn-primary/30 focus:border-btn-primary transition-all disabled:opacity-60 font-[inherit] appearance-none cursor-pointer";

export default function CreateUserForm({ isOpen, onClose }: CreateUserFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { role: "student" },
  });
  const { mutate: createUser, isPending } = useCreateUser();
  const canCreateAdmin = isSuperAdmin();

  function onSubmit(data: FormData) {
    createUser(data, {
      onSuccess: (res) => {
        toast.success(`${res.user.role} account created for ${res.user.name}`);
        reset();
        onClose();
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to create user");
      },
    });
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New User">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Full name</label>
          <input
            type="text"
            placeholder="John Doe"
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
            placeholder="user@institution.edu"
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
          <label className="text-sm font-medium text-text-primary">Temporary password</label>
          <input
            type="password"
            placeholder="Min. 6 characters"
            className={inputClass}
            disabled={isPending}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "Password must be at least 6 characters" },
            })}
          />
          {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
          <p className="text-xs text-text-secondary m-0">User will be prompted to change this on first login.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Role</label>
          <select
            className={selectClass}
            disabled={isPending}
            {...register("role", { required: "Role is required" })}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            {canCreateAdmin && <option value="admin">Admin</option>}
          </select>
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-border">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer bg-transparent"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 rounded-lg bg-btn-primary text-white text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating..." : "Create user"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
