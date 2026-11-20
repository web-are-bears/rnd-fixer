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
    <>
      <nav className="nav relative">
        <div className="flex w-full items-center gap-6">
          <Link to="/" className="underline" onClick={() => setMenuOpen(false)}>
            Dashboard
          </Link>

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
      </nav>

      {menuOpen && (
        <div className="mobile-menu fixed inset-0 z-[100] flex min-h-screen flex-col bg-ink p-6 text-paper md:hidden">
          <div className="flex items-center justify-between border-b border-butter pb-5">
            <h2 className="font-serif text-2xl font-bold">RnD Fixer</h2>

            <button
              onClick={() => setMenuOpen(false)}
              className="text-3xl text-paper"
              aria-label="Close menu"
            >
              &times;
            </button>
          </div>

          <div className="mt-8 flex flex-col">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="border-b border-butter/30 py-5 text-lg"
            >
              Dashboard
            </Link>

            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="border-b border-butter/30 py-5 text-lg"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-auto border-t border-butter pt-5">
            <Link
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="block py-4 text-lg"
            >
              Settings
            </Link>

            <Button
              onClick={handleLogout}
              className="btn btn--secondary mt-3 w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
