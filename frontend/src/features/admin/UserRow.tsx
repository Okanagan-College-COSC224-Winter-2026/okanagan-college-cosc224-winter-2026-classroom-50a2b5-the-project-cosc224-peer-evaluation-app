import { getUserId } from "../../util/login";

interface UserRowProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  currentUserRole: string;
}

const roleBadge: Record<string, string> = {
  super_admin: "bg-yellow-50 text-yellow-700",
  admin: "bg-purple-50 text-purple-700",
  teacher: "bg-blue-50 text-blue-700",
  student: "bg-emerald-50 text-emerald-700",
};

const avatarBg: Record<string, string> = {
  super_admin: "bg-yellow-100 text-yellow-600",
  admin: "bg-purple-100 text-purple-600",
  teacher: "bg-blue-100 text-blue-600",
  student: "bg-emerald-100 text-emerald-600",
};

function roleLabel(role: string) {
  if (role === "super_admin") return "Super Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function UserRow({ user, onEdit, onDelete, currentUserRole }: UserRowProps) {
  const isCurrentUser = getUserId() === user.id;

  // A plain admin cannot edit/delete admin or super_admin accounts.
  // Nobody can edit/delete super_admin accounts.
  const targetIsProtected =
    user.role === "super_admin" ||
    (user.role === "admin" && currentUserRole !== "super_admin");

  const canEdit = !targetIsProtected;
  const canDelete = !isCurrentUser && !targetIsProtected;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <tr className="hover:bg-bg-secondary/50 transition-colors duration-150">
      {/* User: avatar + name + email */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarBg[user.role] || avatarBg.student}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-primary m-0 truncate">{user.name}</p>
              {isCurrentUser && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-bg-secondary text-text-secondary">
                  you
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary m-0 truncate">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${roleBadge[user.role] || "bg-gray-50 text-gray-700"}`}>
          {roleLabel(user.role)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(user)}
            disabled={!canEdit}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary bg-transparent border border-border hover:bg-bg-secondary hover:text-text-primary transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title={!canEdit ? "Cannot edit this account" : undefined}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(user)}
            disabled={!canDelete}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-transparent border border-red-200 hover:bg-red-50 transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title={
              isCurrentUser
                ? "Cannot delete your own account"
                : !canDelete
                ? "Cannot delete this account"
                : "Delete user"
            }
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
