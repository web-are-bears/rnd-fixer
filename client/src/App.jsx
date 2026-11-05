import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isLoggedIn } from "@/api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Profs from "@/pages/Profs";
import Projects from "@/pages/Projects";
import Students from "@/pages/Students";
import Users from "./pages/Users";
import Register from "./pages/Register";

function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}

function Protected({ children }) {
  return isLoggedIn() ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/profs"
          element={
            <Protected>
              <Profs />
            </Protected>
          }
        />
        <Route
          path="/projects"
          element={
            <Protected>
              <Projects />
            </Protected>
          }
        />
        <Route
          path="/students"
          element={
            <Protected>
              <Students />
            </Protected>
          }
        />
        <Route
          path="/users"
          element={
            <Protected>
              {" "}
              <Users />{" "}
            </Protected>
          }
        />
        <Route path="/register/:uname" element={<Register />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
