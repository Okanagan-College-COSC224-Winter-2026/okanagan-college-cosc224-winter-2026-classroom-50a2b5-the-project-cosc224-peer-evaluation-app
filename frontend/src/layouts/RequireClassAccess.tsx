import { Navigate, Outlet, useParams } from "react-router-dom";
import { useClasses } from "../features/classes/useClasses";
import { isAdmin } from "../util/login";

export default function RequireClassAccess() {
  const { id } = useParams<{ id: string }>();
  const { data: classes = [], isLoading } = useClasses();

  if (isAdmin()) return <Outlet />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  const hasAccess = (classes as { id: number }[]).some((c) => c.id === Number(id));
  if (!hasAccess) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
