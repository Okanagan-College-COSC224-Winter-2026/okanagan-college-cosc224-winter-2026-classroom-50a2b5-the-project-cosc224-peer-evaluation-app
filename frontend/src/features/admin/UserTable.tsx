import UserRow from "./UserRow";
import UserMobileCard from "./UserMobileCard";

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto text-text-secondary/30 mb-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
        <p className="text-text-secondary text-sm m-0">No users found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table — lg and up (1024px+) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[50%]" />
            <col className="w-[20%]" />
            <col className="w-[30%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <UserRow key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile + tablet card list — below lg */}
      <div className="lg:hidden divide-y divide-border">
        {users.map((user) => (
          <UserMobileCard key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </>
  );
}
