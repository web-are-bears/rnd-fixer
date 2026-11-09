import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout, getToken, users } from "@/api";
import Button from "./Button";

export default function Navbar() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const token = getToken();
        const uname = token?.uname;

        if (!uname) return;

        const currentUser = await users.get(uname);
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

  const links = [
    ...(role === "student"
      ? [
          { to: "/profs", label: "Professors" },
          { to: "/projects", label: "Projects" },
        ]
      : []),

    ...(role === "prof" || role === "professor"
      ? [
          { to: "/students", label: "Students" },
          { to: "/projects", label: "Projects" },
        ]
      : []),

    ...(role === "admin"
      ? [
          { to: "/profs", label: "Professors" },
          { to: "/projects", label: "Projects" },
          { to: "/students", label: "Students" },
          { to: "/users", label: "User Accounts" },
        ]
      : []),
  ];

  return (
    <nav className="nav">
      <div className="flex w-full items-center gap-6">
        <Link to="/" className="underline" onClick={() => setMenuOpen(false)}>
          Dashboard
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="underline">
              {link.label}
            </Link>
          ))}

          <Link to="/settings" className="underline">
            Settings
          </Link>
        </div>

        <Button onClick={handleLogout} className="ml-auto hidden md:block">
          Logout
        </Button>

        {/* hamburger */}
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="ml-auto text-2xl md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="underline"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <Link
            to="/settings"
            className="underline"
            onClick={() => setMenuOpen(false)}
          >
            Settings
          </Link>

          <Button onClick={handleLogout}>Logout</Button>
        </div>
      )}
    </nav>
  );
}
