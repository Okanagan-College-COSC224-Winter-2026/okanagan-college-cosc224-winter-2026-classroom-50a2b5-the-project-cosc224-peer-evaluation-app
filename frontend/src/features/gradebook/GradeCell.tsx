interface GradeCellProps {
  effectiveGrade: number | null;
  effectiveMax: number | null;
  isOverridden: boolean;
  onClickGrade: () => void;
  onClickDetails: () => void;
}

export default function GradeCell({
  effectiveGrade,
  effectiveMax,
  isOverridden,
  onClickGrade,
  onClickDetails,
}: GradeCellProps) {
  if (effectiveGrade === null) {
    return (
      <td className="px-4 py-3 text-center">
        <span className="text-text-secondary text-xs">--</span>
      </td>
    );
  }

  const percentage =
    effectiveMax && effectiveMax > 0
      ? ((effectiveGrade / effectiveMax) * 100).toFixed(0)
      : null;

  return (
    <td className="px-4 py-3">
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onClickGrade}
          className={`bg-transparent border-none cursor-pointer text-sm font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-bg-secondary ${
            isOverridden ? "text-amber-600" : "text-text-primary"
          }`}
          title={isOverridden ? "Teacher override (click to edit)" : "Peer review average (click to override)"}
        >
          {percentage !== null ? `${percentage}%` : effectiveGrade}
        </button>
        <button
          onClick={onClickDetails}
          className="bg-transparent border-none cursor-pointer text-text-secondary hover:text-btn-primary transition-colors p-1 rounded-lg hover:bg-bg-secondary"
          title="View reviews"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </td>
  );
}
