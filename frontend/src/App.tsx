import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Sidebar from "./components/Sidebar";

import "./App.css";
import Profile from "./pages/Profile";
import CreateClass from "./pages/CreateClass";
import LoginPage from "./pages/LoginPage";
import ClassHome from "./pages/ClassHome";
import ClassMembers from "./pages/ClassMembers";
import Assignment from "./pages/Assignment";
import Group from "./pages/Group";
import RegisterPage from "./pages/RegisterPage";

function App() {
  const arr = window.location.pathname.toString().split("/");
  const current = arr[arr.length - 1];
  const noSidebarPaths = ["", "register"];

  return (
    <div className="App">
      <BrowserRouter>
        {!noSidebarPaths.includes(current) && <Sidebar />}
          <div className="inner">
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/home" element={<Home />} />
              <Route path="/classes/create" element={<CreateClass />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/classes/:id/home" element={<ClassHome />} />
              <Route path="/classes/:id/members" element={<ClassMembers />} />
              <Route path="/assignment/:id" element={<Assignment />} />
              <Route path="/assignment/:id/group" element={<Group />} />
            </Routes>
          </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
