import { useParams } from "react-router-dom";
import TabNavigation from "../components/TabNavigation";
import { useEffect, useState } from "react";
import Button from "../components/Button";
import { importCSV } from "../util/csv";
import { listCourseMembers, listClasses } from "../util/api";
import { isTeacher } from "../util/login";

export default function ClassMembers() {
  const { id } = useParams()
  const [members, setMembers] = useState<User[]>([])
  const [className, setClassName] = useState<string | null>(null);

  useEffect(() => {
    ;(async () => {
      const members = await listCourseMembers(id as string)
      const classes = await listClasses();
      const currentClass = classes.find((c: { id: number }) => c.id === Number(id));
      setMembers(members)
      setClassName(currentClass?.name || null);
    })()
  }, [id])

  return (
    <>
      <div className="flex flex-row justify-between items-center px-4 py-3 border-b border-border">
        <h2 className="text-xl font-semibold text-text-primary">{className}</h2>
        <div>
          {isTeacher() ? (
            <Button onClick={() => importCSV(id as string)}>Add Students via CSV</Button>
          ) : null}
        </div>
      </div>

      <TabNavigation
        tabs={[
          { label: "Home", path: `/classes/${id}/home` },
          { label: "Members", path: `/classes/${id}/members` },
        ]}
      />

      <div className="flex flex-col items-center justify-start w-full p-4 gap-1">
        {members.map(member => (
          <div
            key={member.id}
            className="w-full max-w-3xl px-4 py-3 rounded-lg flex items-center gap-3 hover:cursor-pointer hover:bg-bg-secondary transition-colors duration-100 border border-transparent hover:border-border"
          >
            <div className="w-9 h-9 rounded-full bg-btn-primary/15 flex items-center justify-center text-sm font-semibold text-btn-primary flex-shrink-0">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-text-primary font-medium">{member.name}</span>
            <span className="text-text-secondary text-xs ml-auto">#{member.id}</span>
          </div>
        ))}
      </div>
    </>
  );
}
