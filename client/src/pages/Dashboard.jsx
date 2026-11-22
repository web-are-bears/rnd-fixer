import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getToken, users } from "@/api";
import ProfDashboard from "@/pages/dashboard/ProfDashboard";
import StudentDashboard from "@/pages/dashboard/StudentDashboard";
import AdminDashboard from "@/pages/dashboard/AdminDashboard";
import { Loading, ErrorMessage } from "@/components/Extras";

export default function Dashboard() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);
  const [error, setError] = useState("");
  const [loggedOut, setLoggedOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function identifyAccount() {
      try {
        const token = await getToken();

        if (!token) {
          if (active) setLoggedOut(true);
          return;
        }

        const user = await users.get(token.uname);

        if (active) {
          setAccount(token);
          setRole(user.role?.toLowerCase());
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to identify account.");
        }
      }
    }

    identifyAccount();

    return () => {
      active = false;
    };
  }, []);

  if (loggedOut) return <Navigate to="/login" replace />;
  if (error) return <ErrorMessage message={error} />;
  if (!account || !role) return <Loading />;

  switch (role) {
    case "prof":
      return <ProfDashboard uname={account.uname} />;
    case "student":
      return <StudentDashboard uname={account.uname} />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <ErrorMessage message="Unsupported account role." />;
  }
}
