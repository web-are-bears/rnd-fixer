import { useEffect, useState } from "react";
import { getToken, profs, students, users } from "@/api";
import ProfDashboard from "@/pages/dashboard/ProfDashboard";
import StudentDashboard from "@/pages/dashboard/StudentDashboard";
import AdminDashboard from "@/pages/dashboard/AdminDashboard";
import { Loading, ErrorMessage } from "@/components/Extras";

export default function Dashboard() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function identifyAccount() {
      const token = getToken();

      if (!token) {
        if (active) {
          setError("You are not logged in. Please log in again.");
        }
        return;
      }

      if (active) setAccount(token);

      try {
        await profs.get(token.uname);
        if (active) setRole("prof");
        return;
      } catch { }

      try {
        await students.get(token.uname);
        if (active) setRole("student");
        return;
      } catch { }

      try {
        const user = await users.get(token.uname);

        if (active && user.role === "admin") {
          setRole("admin");
          return;
        }
      } catch { }

      if (active) {
        setError("Your account does not match a supported dashboard role.");
      }
    }

    identifyAccount();

    return () => {
      active = false;
    };
  }, []);

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
