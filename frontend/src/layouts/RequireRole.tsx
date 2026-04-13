import { Navigate, Outlet } from "react-router-dom";
import { getUserRole } from "../util/login";

interface RequireRoleProps {
  /** Roles that are allowed through. Everyone else is redirected. */
  allow: string[];
  redirectTo?: string;
}

/**
 * Layout route that enforces role-based access.
 *
 * Usage in App.tsx:
 *   <Route element={<RequireRole allow={["admin", "super_admin"]} />}>
 *     <Route path="/admin/users" element={<AdminUsers />} />
 *   </Route>
 */
export default function RequireRole({ allow, redirectTo = "/home" }: RequireRoleProps) {
  const role = getUserRole();
  if (!allow.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
}
