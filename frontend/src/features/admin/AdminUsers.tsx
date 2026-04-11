import { useMemo, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { getUserRole } from "../../util/login";
import { useUsers } from "./useAdmin";
import UserTable from "./UserTable";
import CreateUserForm from "./CreateUserForm";
import EditUserForm from "./EditUserForm";
import DeleteUserConfirm from "./DeleteUserConfirm";

type RoleFilter = "all" | "student" | "teacher" | "admin" | "super_admin";

export default function AdminUsers() {
  const { data: users = [], isLoading, isError, error } = useUsers();
  const currentUserRole = getUserRole();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    let result = users as User[];
    if (roleFilter !== "all") result = result.filter((u) => u.role === roleFilter);
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, roleFilter, debouncedQuery]);

  const counts = useMemo(() => {
    const all = users as User[];
    return {
      all: all.length,
      student: all.filter((u) => u.role === "student").length,
      teacher: all.filter((u) => u.role === "teacher").length,
      admin: all.filter((u) => u.role === "admin").length,
      super_admin: all.filter((u) => u.role === "super_admin").length,
    };
  }, [users]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 w-full">
        <h1 className="text-2xl font-bold text-text-primary border-b border-border pb-3 mb-6">User Management</h1>
        <p className="text-text-secondary">Loading users...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 md:p-8 w-full max-w-[85vw] sm:max-w-260 mx-auto">
        <h1 className="text-2xl font-bold text-text-primary border-b border-border pb-3 mb-6">User Management</h1>
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error instanceof Error ? error.message : "Failed to load users"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-[85vw] sm:max-w-260 mx-auto">
      {/* Header — same pattern as DashboardLayout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4 mb-6">
        <h1 className="text-2xl font-bold text-text-primary m-0">User Management</h1>

        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full px-4 py-2.5 rounded-lg bg-white text-sm text-text-primary placeholder:text-text-secondary border border-border shadow-sm focus:outline-none focus:border-btn-primary focus:shadow-md transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary bg-transparent border-none cursor-pointer text-xs transition-colors"
            >
              &#10005;
            </button>
          )}
        </div>
      </div>

      {/* Toolbar — filters + add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 bg-white rounded-lg border border-border shadow-sm p-1 overflow-x-auto shrink-0">
          {(["all", "student", "teacher", "admin", "super_admin"] as RoleFilter[]).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer border-none whitespace-nowrap ${
                roleFilter === role
                  ? "bg-btn-primary text-white shadow-sm"
                  : "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
              }`}
            >
              {role === "all" ? "All" : role === "super_admin" ? "Super Admin" : role.charAt(0).toUpperCase() + role.slice(1)}
              <span className={`ml-1.5 ${roleFilter === role ? "text-white/70" : "text-text-secondary/50"}`}>
                {counts[role]}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-btn-primary text-white text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border-none shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Add user
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <UserTable users={filteredUsers} onEdit={setEditingUser} onDelete={setDeletingUser} currentUserRole={currentUserRole} />
      </div>

      {debouncedQuery && filteredUsers.length === 0 && (
        <p className="text-text-secondary text-sm mt-6 text-center">No users matching &ldquo;{debouncedQuery}&rdquo;</p>
      )}

      {/* Modals */}
      <CreateUserForm isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <EditUserForm user={editingUser} onClose={() => setEditingUser(null)} />
      <DeleteUserConfirm user={deletingUser} onClose={() => setDeletingUser(null)} />
    </div>
  );
}
