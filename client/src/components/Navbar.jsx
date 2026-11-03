import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout, getToken, users } from "@/api";
import Button from "./Button";

export default function Navbar() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const token = await getToken();
        const uname = typeof token === "string" ? token : token?.uname;

        if (!uname) {
          console.error("No authenticated user found.");
          return;
        }

        const currentUser = await users.get(uname);

        if (!currentUser) {
          console.error("User not found:", uname);
          return;
        }

        setUser(currentUser);
      } catch (err) {
        console.error("Failed to load Navbar user:", err);
      }
    }

    loadUser();
  }, []);

  async function handleLogout() {
    await logout();
    nav("/login");
  }

  const role = user?.role?.toLowerCase();

  return (
    <nav className="nav">
      <Link to="/" className="underline">
        Dashboard
      </Link>

      {role === "student" && (
        <>
          <Link to="/profs" className="underline">
            Professors
          </Link>
          <Link to="/projects" className="underline">
            Projects
          </Link>
        </>
      )}

      {(role === "prof" || role === "professor") && (
        <>
          <Link to="/students" className="underline">
            Students
          </Link>
          <Link to="/projects" className="underline">
            Projects
          </Link>
        </>
      )}

      {role === "admin" && (
        <>
          <Link to="/profs" className="underline">
            Professors
          </Link>
          <Link to="/projects" className="underline">
            Projects
          </Link>
          <Link to="/students" className="underline">
            Students
          </Link>
        </>
      )}

      <Button onClick={handleLogout} className="ml-auto">
        Logout
      </Button>
    </nav>
  );
}
