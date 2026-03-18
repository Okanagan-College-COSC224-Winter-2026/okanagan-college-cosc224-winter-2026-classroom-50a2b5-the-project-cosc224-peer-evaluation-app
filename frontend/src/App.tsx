import { BrowserRouter, Route, Routes } from "react-router-dom";

import ClassHome from "./features/classes/ClassHome";
import ClassLayout from "./layouts/ClassLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";
import GroupManager from "./features/groups/GroupManager";
import ClassMembers from "./features/classes/ClassMembers";
import LoginForm from "./features/authentication/LoginForm";
import SignupForm from "./features/authentication/SignupForm";
import UpdateAccount from "./features/account/UpdateAccount";
import CreateTeacher from "./features/account/CreateTeacher";
import CreateClassForm from "./features/classes/CreateClassForm";
import DashboardLayout from "./features/dashboard/DashboardLayout";
import ClassEvaluations from "./features/reviews/ClassEvaluations";
import AssignmentDetail from "./features/assignments/AssignmentDetail";
import ChangePasswordForm from "./features/authentication/ChangePasswordForm";
import { AuthProvider } from "./features/authentication/AuthProvider";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/register" element={<SignupForm />} />
          <Route path="/change-password" element={<ChangePasswordForm />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/home" element={<DashboardLayout />} />
            <Route path="/admin/create-teacher" element={<CreateTeacher />} />
            <Route path="/classes/create" element={<CreateClassForm />} />
            <Route path="/profile/:id" element={<UpdateAccount />} />

            <Route path="/classes/:id" element={<ClassLayout />}>
              <Route path="home" element={<ClassHome />} />
              <Route path="members" element={<ClassMembers />} />
              <Route path="groups" element={<GroupManager />} />
              <Route path="evaluations" element={<ClassEvaluations />} />
            </Route>

            <Route path="/assignments/:id" element={<AssignmentDetail />} />
            <Route path="/assignments/:id/manage" element={<AssignmentDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
