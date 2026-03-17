import { useParams } from "react-router-dom";
import TabNavigation from "../../ui/TabNavigation";
import Button from "../../ui/Button";
import { importCSV } from "../../util/csv";
import { useCourseMembers, useClasses } from "./useClasses";
import { isTeacher } from "../../util/login";

export default function ClassMembers() {
  const { id } = useParams()
  const { data: members = [] } = useCourseMembers(id as string);
  const { data: classes = [] } = useClasses();

  const className = classes.find((c: { id: number }) => c.id === Number(id))?.name || null;

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
          {
            label: "Home",
            path: `/classes/${id}/home`,
          },
          {
            label: "Members",
            path: `/classes/${id}/members`,
          },
        ]}
      />

      <div className="flex flex-col items-center justify-start w-full p-4 gap-1">
        {members.map((member: User) => (
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
