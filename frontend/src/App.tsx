import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./features/authentication/AuthProvider";

import LoginForm from "./features/authentication/LoginForm";
import SignupForm from "./features/authentication/SignupForm";
import ChangePasswordForm from "./features/authentication/ChangePasswordForm";

import DashboardLayout from "./features/dashboard/DashboardLayout";
import UpdateAccount from "./features/account/UpdateAccount";
import NotificationsPage from "./features/notifications/NotificationsPage";

import AdminUsers from "./features/admin/AdminUsers";
import CreateTeacher from "./features/account/CreateTeacher";

import CreateClassForm from "./features/classes/CreateClassForm";
import ClassHome from "./features/classes/ClassHome";
import ClassMembers from "./features/classes/ClassMembers";
import ClassSettings from "./features/classes/ClassSettings";
import ClassEvaluations from "./features/reviews/ClassEvaluations";
import GroupManager from "./features/groups/GroupManager";
import Gradebook from "./features/gradebook/Gradebook";

import AssignmentDetail from "./features/assignments/AssignmentDetail";

import ProtectedLayout from "./layouts/ProtectedLayout";
import ClassLayout from "./layouts/ClassLayout";
import RequireRole from "./layouts/RequireRole";
import RequireClassAccess from "./layouts/RequireClassAccess";

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "12px",
            padding: "12px 16px",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/register" element={<SignupForm />} />
          <Route path="/change-password" element={<ChangePasswordForm />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/home" element={<DashboardLayout />} />
            <Route path="/profile/:id" element={<UpdateAccount />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            <Route element={<RequireRole allow={["admin", "super_admin"]} />}>
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/create-teacher" element={<CreateTeacher />} />
            </Route>

            <Route element={<RequireRole allow={["teacher", "admin", "super_admin"]} />}>
              <Route path="/classes/create" element={<CreateClassForm />} />
            </Route>

            <Route element={<RequireClassAccess />}>
              <Route path="/classes/:id" element={<ClassLayout />}>
                <Route path="home" element={<ClassHome />} />
                <Route path="members" element={<ClassMembers />} />
                <Route path="groups" element={<GroupManager />} />
                <Route path="evaluations" element={<ClassEvaluations />} />
                <Route path="assignments/:assignmentId" element={<AssignmentDetail />} />

                <Route element={<RequireRole allow={["teacher", "admin", "super_admin"]} />}>
                  <Route path="gradebook" element={<Gradebook />} />
                  <Route path="settings" element={<ClassSettings />} />
                  <Route path="assignments/:assignmentId/manage" element={<AssignmentDetail />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
