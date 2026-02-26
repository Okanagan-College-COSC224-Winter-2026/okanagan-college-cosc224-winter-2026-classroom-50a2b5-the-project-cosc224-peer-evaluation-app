// src/pages/ClassMembers.tsx

import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import TabNavigation from "../components/TabNavigation";
import Button from "../components/Button";
import { importCSV } from "../util/csv";
import { listCourseMembers, listClasses } from "../util/api";
import { isTeacher } from "../util/login";

import "./ClassMembers.css";

type Member = {
  id: number;
  name: string;
  email?: string | null;
  role?: string | null;
};

type Course = {
  id: number;
  name: string;
};

export default function ClassMembers() {
  const { id } = useParams();
  const classId = useMemo(() => Number(id), [id]);

  const [members, setMembers] = useState<Member[]>([]);
  const [className, setClassName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        if (!id || Number.isNaN(classId)) {
          throw new Error("Invalid class id in URL");
        }

        // Fetch in parallel
        const [membersResp, classesResp] = await Promise.all([
          listCourseMembers(id),
          listClasses(),
        ]);

        if (cancelled) return;

        const classes: Course[] = Array.isArray(classesResp) ? classesResp : [];
        const currentClass = classes.find((c) => c.id === classId);

        const normalizedMembers: Member[] = (Array.isArray(membersResp)
          ? membersResp
          : []
        ).map((m: any) => ({
          id: Number(m.id),
          name: String(m.name ?? ""),
          email: m.email ?? null,
          role: m.role ?? null,
        }));

        // Optional: sort by name then id
        normalizedMembers.sort((a, b) => {
          const an = a.name.toLowerCase();
          const bn = b.name.toLowerCase();
          if (an < bn) return -1;
          if (an > bn) return 1;
          return a.id - b.id;
        });

        setMembers(normalizedMembers);
        setClassName(currentClass?.name || null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load class members");
        setMembers([]);
        setClassName(null);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, classId]);

  return (
    <>
      <div className="ClassHeader">
        <div className="ClassHeaderLeft">
          <h2>{className ?? "Class"}</h2>
        </div>

        <div className="ClassHeaderRight">
          {isTeacher() ? (
            <Button onClick={() => importCSV(id as string)}>
              Add Students via CSV
            </Button>
          ) : null}
        </div>
      </div>

      <TabNavigation
        tabs={[
          { label: "Home", path: `/classes/${id}/home` },
          { label: "Members", path: `/classes/${id}/members` },
        ]}
      />

      <div className="ClassMemberList">
        {loading ? (
          <div className="Member">Loading members...</div>
        ) : error ? (
          <div className="Member">Error: {error}</div>
        ) : members.length === 0 ? (
          <div className="Member">No students enrolled yet.</div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="Member">
              <div>
                <strong>{member.name}</strong> ({member.id})
              </div>
              {member.email ? (
                <div className="MemberEmail">{member.email}</div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </>
  );
}