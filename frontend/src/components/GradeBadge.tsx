import React from "react";

interface GradeBadgeProps {
  grade: number | null;
  maxScore: number | null;
  hasGrades: boolean;
  gradedAssignments: number;
  totalAssignments: number;
}

export default function GradeBadge({
  grade,
  maxScore,
  hasGrades,
  gradedAssignments,
  totalAssignments,
}: GradeBadgeProps) {
  // 1) No grades at all
  if (!hasGrades) {
    return (
      <span style={{ padding: "4px 8px", borderRadius: "999px", backgroundColor: "#eee", fontSize: "0.8rem" }}>
        No grades yet
      </span>
    );
  }

  // 2) We have a grade
  const ratio = maxScore ? grade! / maxScore : 0;
  let color = "#4caf50"; // green
  if (ratio < 0.6) {
    color = "#f44336"; // red
  } else if (ratio < 0.8) {
    color = "#ff9800"; // orange/yellow
  }

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: "999px",
        backgroundColor: color,
        color: "white",
        fontSize: "0.8rem",
        display: "inline-flex",
        gap: "8px",
        alignItems: "center",
      }}
    >
      <span>
        {grade?.toFixed(1)} / {maxScore}
      </span>
      <span style={{ fontSize: "0.7rem", opacity: 0.9 }}>
        {gradedAssignments} of {totalAssignments} graded
      </span>
    </span>
  );
}
