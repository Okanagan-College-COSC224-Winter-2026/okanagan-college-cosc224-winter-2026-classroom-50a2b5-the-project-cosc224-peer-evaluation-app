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

function App() {
  const arr = window.location.pathname.toString().split("/");
  const current = arr[arr.length - 1];

  return (
    <div className="App">
      <BrowserRouter>
        {current.length > 0 && <Sidebar />}
          <div className="inner">
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/home" element={<Home />} />
              <Route path="/classes/create" element={<CreateClass />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/classes/:id/home" element={<ClassHome />} />
              <Route path="/classes/:id/members" element={<ClassMembers />} />
              <Route path="/assignments/:id" element={<Assignment />} />
              <Route path="/assignments/:id/group" element={<Group />} />
            </Routes>
          </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
