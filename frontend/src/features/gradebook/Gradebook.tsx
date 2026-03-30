import { useState } from "react";
import GradeCell from "./GradeCell";
import ReviewDetailModal from "./ReviewDetailModal";

// ── Fake data for UI prototyping ──────────────────────────────────────────

const FAKE_ASSIGNMENTS = [
  { id: 1, name: "Assignment 1" },
  { id: 2, name: "Assignment 2" },
  { id: 3, name: "Midterm Project" },
  { id: 4, name: "Assignment 3" },
  { id: 5, name: "Final Project" },
];

const FAKE_STUDENTS = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    grades: {
      1: { effectiveGrade: 17.5, effectiveMax: 20, isOverridden: false },
      2: { effectiveGrade: 14, effectiveMax: 20, isOverridden: false },
      3: { effectiveGrade: 42, effectiveMax: 50, isOverridden: true },
      4: { effectiveGrade: 18, effectiveMax: 20, isOverridden: false },
      5: { effectiveGrade: null, effectiveMax: null, isOverridden: false },
    },
    courseTotal: { earned: 91.5, max: 110 },
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    grades: {
      1: { effectiveGrade: 15, effectiveMax: 20, isOverridden: false },
      2: { effectiveGrade: 18, effectiveMax: 20, isOverridden: false },
      3: { effectiveGrade: 38, effectiveMax: 50, isOverridden: false },
      4: { effectiveGrade: 16, effectiveMax: 20, isOverridden: true },
      5: { effectiveGrade: null, effectiveMax: null, isOverridden: false },
    },
    courseTotal: { earned: 87, max: 110 },
  },
  {
    id: 3,
    name: "Charlie Davis",
    email: "charlie@example.com",
    grades: {
      1: { effectiveGrade: 19, effectiveMax: 20, isOverridden: false },
      2: { effectiveGrade: 19.5, effectiveMax: 20, isOverridden: false },
      3: { effectiveGrade: 47, effectiveMax: 50, isOverridden: false },
      4: { effectiveGrade: 20, effectiveMax: 20, isOverridden: false },
      5: { effectiveGrade: null, effectiveMax: null, isOverridden: false },
    },
    courseTotal: { earned: 105.5, max: 110 },
  },
  {
    id: 4,
    name: "Diana Lee",
    email: "diana@example.com",
    grades: {
      1: { effectiveGrade: 12, effectiveMax: 20, isOverridden: false },
      2: { effectiveGrade: null, effectiveMax: null, isOverridden: false },
      3: { effectiveGrade: 30, effectiveMax: 50, isOverridden: false },
      4: { effectiveGrade: 14, effectiveMax: 20, isOverridden: false },
      5: { effectiveGrade: null, effectiveMax: null, isOverridden: false },
    },
    courseTotal: { earned: 56, max: 110 },
  },
  {
    id: 5,
    name: "Ethan Brown",
    email: "ethan@example.com",
    grades: {
      1: { effectiveGrade: 16, effectiveMax: 20, isOverridden: false },
      2: { effectiveGrade: 17, effectiveMax: 20, isOverridden: false },
      3: { effectiveGrade: 44, effectiveMax: 50, isOverridden: false },
      4: { effectiveGrade: 15, effectiveMax: 20, isOverridden: true },
      5: { effectiveGrade: null, effectiveMax: null, isOverridden: false },
    },
    courseTotal: { earned: 92, max: 110 },
  },
];

// ── Component ─────────────────────────────────────────────────────────────

interface ModalTarget {
  studentId: number;
  studentName: string;
  assignmentId: number;
  assignmentName: string;
}

export default function Gradebook() {
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);

  const openReviewModal = (
    studentId: number,
    studentName: string,
    assignmentId: number,
    assignmentName: string
  ) => {
    setModalTarget({ studentId, studentName, assignmentId, assignmentName });
  };

  return (
    <>
      <div className="p-4 md:p-8 w-full mx-auto flex flex-col gap-6">
        <h2 className="text-2xl font-semibold text-text-primary m-0">Gradebook</h2>

        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr className="bg-bg-secondary border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-text-primary sticky left-0 bg-bg-secondary z-10 min-w-[200px] border-r border-border">
                    Student
                  </th>
                  {FAKE_ASSIGNMENTS.map((a) => (
                    <th
                      key={a.id}
                      className="text-center px-4 py-3 font-semibold text-text-primary min-w-[120px]"
                    >
                      {a.name}
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 font-semibold text-text-primary min-w-[120px] sticky right-0 bg-bg-secondary z-10 border-l border-border">
                    Course Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {FAKE_STUDENTS.map((student) => {
                  const totalPct =
                    student.courseTotal.max > 0
                      ? ((student.courseTotal.earned / student.courseTotal.max) * 100).toFixed(0)
                      : null;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-bg-secondary/50 transition-colors"
                    >
                      <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-btn-primary/10 text-btn-primary flex items-center justify-center text-xs font-semibold shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-text-primary truncate">
                              {student.name}
                            </div>
                            <div className="text-xs text-text-secondary truncate">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      {FAKE_ASSIGNMENTS.map((a) => {
                        const grade =
                          student.grades[a.id as keyof typeof student.grades];
                        return (
                          <GradeCell
                            key={a.id}
                            effectiveGrade={grade?.effectiveGrade ?? null}
                            effectiveMax={grade?.effectiveMax ?? null}
                            isOverridden={grade?.isOverridden ?? false}
                            onClickGrade={() => {
                              /* will wire up inline edit later */
                            }}
                            onClickDetails={() =>
                              openReviewModal(student.id, student.name, a.id, a.name)
                            }
                          />
                        );
                      })}
                      <td className="px-4 py-3 text-center sticky right-0 bg-white z-10 border-l border-border">
                        <span className="font-bold text-btn-primary text-sm">
                          {totalPct !== null ? `${totalPct}%` : "--"}
                        </span>
                        <div className="text-xs text-text-secondary">
                          {student.courseTotal.earned} / {student.courseTotal.max}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ReviewDetailModal
        isOpen={modalTarget !== null}
        onClose={() => setModalTarget(null)}
        studentName={modalTarget?.studentName ?? ""}
        assignmentName={modalTarget?.assignmentName ?? ""}
      />
    </>
  );
}
