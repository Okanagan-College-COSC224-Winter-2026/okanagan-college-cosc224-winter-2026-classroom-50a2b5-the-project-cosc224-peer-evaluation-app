import { Navigate, Outlet, useParams } from "react-router-dom";
import { useClasses } from "../features/classes/useClasses";
import { isAdmin } from "../util/login";

/**
 * Layout route that enforces class ownership/membership.
 *
 * Passes through if:
 *   - The current user is an admin/super_admin (full access), OR
 *   - The class ID from the URL exists in the user's own class list
 *     (for teachers: classes they teach; for students: classes they're enrolled in).
 *
 * Otherwise redirects to /home.
 *
 * Usage in App.tsx — wrap the /classes/:id tree:
 *   <Route element={<RequireClassAccess />}>
 *     <Route path="/classes/:id" element={<ClassLayout />}>
 *       ...
 *     </Route>
 *   </Route>
 */
export default function RequireClassAccess() {
  const { id } = useParams<{ id: string }>();
  const { data: classes = [], isLoading } = useClasses();

  // Admins bypass the ownership check entirely.
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
