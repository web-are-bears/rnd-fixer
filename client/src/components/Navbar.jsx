import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api";


export default function Navbar() {
  const nav = useNavigate();

  async function handleLogout() {
    await logout();
    nav("/login");
  }

  return (
    <nav className="nav">
      <Link to="/">Dashboard</Link>

      <button className="btn btn--light ml-auto" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
}
