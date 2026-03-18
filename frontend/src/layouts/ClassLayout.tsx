import { useMemo } from "react";
import { Outlet, useParams } from "react-router-dom";
import TabNavigation from "../ui/TabNavigation";
import Button from "../ui/Button";
import { useClasses } from "../features/classes/useClasses";
import { importCSV } from "../util/csv";
import { isTeacher } from "../util/login";

export default function ClassLayout() {
  const { id } = useParams();
  const { data: classes = [] } = useClasses();

  const className = useMemo(() => {
    return classes.find((c: { id: number }) => c.id === Number(id))?.name || null;
  }, [classes, id]);

  return (
    <>
      <div className="flex flex-row justify-between items-center px-4 py-3 border-b border-border gap-3">
        <h2 className="text-xl font-semibold text-text-primary min-w-0 truncate">{className}</h2>
        <div className="flex-shrink-0">
          {isTeacher() ? (
            <Button onClick={() => importCSV(id as string)}>
              <span className="hidden sm:inline">Add Students via CSV</span>
              <span className="sm:hidden">+ CSV</span>
            </Button>
          ) : null}
        </div>
      </div>

      <TabNavigation
        tabs={[
          { label: "Home", path: `/classes/${id}/home` },
          { label: "Members", path: `/classes/${id}/members` },
          { label: "Groups", path: `/classes/${id}/groups` },
          { label: "Evaluations", path: `/classes/${id}/evaluations` },
        ]}
      />

      <Outlet />
    </>
  );
}
