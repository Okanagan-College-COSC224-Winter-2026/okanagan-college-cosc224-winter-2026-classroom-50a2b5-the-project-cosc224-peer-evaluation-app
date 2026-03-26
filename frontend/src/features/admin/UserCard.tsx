import { getUserId } from "../../util/login";

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const dotColor: Record<string, string> = {
  admin: "bg-red-500 shadow-[0_0_8px_3px_rgba(239,68,68,0.5)]",
  teacher: "bg-blue-500 shadow-[0_0_8px_3px_rgba(59,130,246,0.5)]",
  student: "bg-emerald-500 shadow-[0_0_8px_3px_rgba(16,185,129,0.5)]",
};

const lineColor: Record<string, string> = {
  admin: "bg-red-500/30",
  teacher: "bg-blue-500/30",
  student: "bg-emerald-500/30",
};

const labelColor: Record<string, string> = {
  admin: "text-red-400",
  teacher: "text-blue-400",
  student: "text-emerald-400",
};

const btnHover: Record<string, string> = {
  admin: "hover:text-red-400 hover:border-red-500/30",
  teacher: "hover:text-blue-400 hover:border-blue-500/30",
  student: "hover:text-emerald-400 hover:border-emerald-500/30",
};

export default function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const isCurrentUser = getUserId() === user.id;

  return (
    <div className="group relative min-h-[11rem] flex flex-col items-center justify-center">
      {/* Two glowing dots — the anchors */}
      <div className="flex items-center gap-16 sm:gap-24">
        <div
          className={`w-[7px] h-[7px] rounded-full shrink-0 [animation:glowPulse_2.4s_ease-in-out_infinite] ${dotColor[user.role] || dotColor.student}`}
        />
        <div
          className={`w-[7px] h-[7px] rounded-full shrink-0 [animation:glowPulse_2.4s_ease-in-out_infinite_0.6s] ${dotColor[user.role] || dotColor.student}`}
        />
      </div>

      {/* Connecting line — draws on hover */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center w-[calc(100%-3rem)] pointer-events-none">
        <div
          className={`h-px w-0 group-hover:w-full transition-all duration-500 ease-out ${lineColor[user.role] || lineColor.student}`}
        />
      </div>

      {/* Revealed content — fades in on hover */}
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out pointer-events-none group-hover:pointer-events-auto">
        {/* Role label */}
        <span className={`text-[10px] uppercase tracking-[0.2em] font-medium mb-1.5 ${labelColor[user.role] || labelColor.student}`}>
          {user.role}
        </span>

        {/* Name */}
        <h3 className="text-text-primary text-base font-semibold m-0 text-center leading-tight">
          {user.name}
          {isCurrentUser && (
            <span className="ml-1.5 text-[10px] font-normal text-text-secondary/60">(you)</span>
          )}
        </h3>

        {/* Email */}
        <p className="text-text-secondary text-xs m-0 mt-0.5">{user.email}</p>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => onEdit(user)}
            className={`px-3 py-1 rounded border border-border/50 text-[11px] font-medium text-text-secondary bg-transparent cursor-pointer transition-all duration-200 ${btnHover[user.role] || btnHover.student}`}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(user)}
            disabled={isCurrentUser}
            className="px-3 py-1 rounded border border-border/50 text-[11px] font-medium text-text-secondary bg-transparent cursor-pointer transition-all duration-200 hover:text-red-500 hover:border-red-500/30 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:text-text-secondary disabled:hover:border-border/50"
            title={isCurrentUser ? "Cannot delete yourself" : "Delete user"}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
