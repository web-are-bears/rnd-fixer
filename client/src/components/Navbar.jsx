import { Link, useNavigate } from "react-router-dom";
import { logout } from "../test/api";
import Button from "./Button";

export default function Navbar() {
  const nav = useNavigate();

  async function handleLogout() {
    await logout();
    nav("/login");
  }

  return (
    <nav className="nav">
      <Link to="/">Dashboard</Link>
      <Button onClick={handleLogout} className="ml-auto">
        Logout
      </Button>
    </nav>
  );
}
