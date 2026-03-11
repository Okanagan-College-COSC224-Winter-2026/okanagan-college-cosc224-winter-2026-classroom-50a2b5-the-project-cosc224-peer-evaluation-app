import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Profile from "./pages/Profile";
import CreateClass from "./pages/CreateClass";
import LoginPage from "./pages/LoginPage";
import ClassHome from "./pages/ClassHome";
import ClassMembers from "./pages/ClassMembers";
import Assignment from "./pages/Assignment";
import Group from "./pages/Group";
import RegisterPage from "./pages/RegisterPage";
import ChangePassword from "./pages/ChangePassword";
import CreateTeacher from "./pages/CreateTeacher";
import { logout } from "./util/login";

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
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/change-password" element={<ChangePassword />} />

          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/admin/create-teacher" element={<ProtectedRoute><CreateTeacher /></ProtectedRoute>} />
          <Route path="/classes/create" element={<ProtectedRoute><CreateClass /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/classes/:id/home" element={<ProtectedRoute><ClassHome /></ProtectedRoute>} />
          <Route path="/classes/:id/members" element={<ProtectedRoute><ClassMembers /></ProtectedRoute>} />
          <Route path="/classes/:id/groups" element={<ProtectedRoute><Group /></ProtectedRoute>} />
          <Route path="/assignments/:id" element={<ProtectedRoute><Assignment /></ProtectedRoute>} />
          <Route path="/assignments/:id/manage" element={<ProtectedRoute><Assignment /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
