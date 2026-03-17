import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import DashboardLayout from "./features/dashboard/DashboardLayout";
import ProtectedRoute from "./features/authentication/ProtectedRoute";
import Sidebar from "./ui/Sidebar";
import UpdateAccount from "./features/account/UpdateAccount";
import CreateClassForm from "./features/classes/CreateClassForm";
import LoginForm from "./features/authentication/LoginForm";
import ClassHome from "./features/classes/ClassHome";
import ClassMembers from "./features/classes/ClassMembers";
import AssignmentDetail from "./features/assignments/AssignmentDetail";
import GroupManager from "./features/groups/GroupManager";
import ClassEvaluations from "./features/reviews/ClassEvaluations";
import SignupForm from "./features/authentication/SignupForm";
import ChangePasswordForm from "./features/authentication/ChangePasswordForm";
import CreateTeacher from "./features/account/CreateTeacher";
import { logout } from "./util/login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
    },
  },
});

function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-50 bg-white border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <img src="/oc_logo.png" alt="OC Logo" className="h-7 w-7 object-contain" />
        <span className="text-text-primary font-bold text-sm">Peer Review</span>
      </div>
      <nav className="flex items-center gap-4 text-sm font-medium">
        <a href="/home" className="text-text-secondary hover:text-text-primary no-underline transition-colors">
          Home
        </a>
        <a href="/profile/1" className="text-text-secondary hover:text-text-primary no-underline transition-colors">
          Account
        </a>
        <button
          onClick={() => logout()}
          className="text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer text-sm font-medium p-0 transition-colors"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}

function AppContent() {
  const location = useLocation();
  const noSidebarPaths = ["/", "/login", "/register", "/change-password"];
  const showNav = !noSidebarPaths.includes(location.pathname);

  return (
    <div className="flex flex-row min-h-screen bg-bg-primary">
      {showNav && <Sidebar />}
      <div className={`flex flex-col flex-1 min-w-0 ${showNav ? 'bg-bg-secondary' : ''}`}>
        {showNav && <MobileHeader />}
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/register" element={<SignupForm />} />
          <Route path="/change-password" element={<ChangePasswordForm />} />

          <Route path="/home" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
          <Route path="/admin/create-teacher" element={<ProtectedRoute><CreateTeacher /></ProtectedRoute>} />
          <Route path="/classes/create" element={<ProtectedRoute><CreateClassForm /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute><UpdateAccount /></ProtectedRoute>} />
          <Route path="/classes/:id/home" element={<ProtectedRoute><ClassHome /></ProtectedRoute>} />
          <Route path="/classes/:id/members" element={<ProtectedRoute><ClassMembers /></ProtectedRoute>} />
          <Route path="/classes/:id/groups" element={<ProtectedRoute><GroupManager /></ProtectedRoute>} />
          <Route path="/classes/:id/evaluations" element={<ProtectedRoute><ClassEvaluations /></ProtectedRoute>} />
          <Route path="/assignments/:id" element={<ProtectedRoute><AssignmentDetail /></ProtectedRoute>} />
          <Route path="/assignments/:id/manage" element={<ProtectedRoute><AssignmentDetail /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
