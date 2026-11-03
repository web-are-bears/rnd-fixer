import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout, getToken, users } from "@/api";
import Button from "./Button";

export default function Navbar() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (token) {
          const currentUser = await users.get(token.uname);
          setUser(currentUser);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    }

    load();
  }, []);

  async function handleLogout() {
    await logout();
    nav("/login");
  }

  return (
    <nav className="nav">
      <Link to="/">Dashboard</Link>

      {user?.role === "student" && (
        <>
          <Link to="/profs">Professors</Link>
          <Link to="/projects">Projects</Link>
        </>
      )}

      {user?.role === "prof" && (
        <>
          <Link to="/students">Students</Link>
          <Link to="/projects">Projects</Link>
        </>
      )}

      <Button onClick={handleLogout} className="ml-auto">
        Logout
      </Button>
    </nav>
  );
}
