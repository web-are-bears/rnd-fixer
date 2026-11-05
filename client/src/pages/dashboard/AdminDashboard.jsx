import { Link } from "react-router-dom";
import Card from "@/components/Card";
import Button from "@/components/Button";

const sections = [
  { title: "User Accounts", path: "/users" },
  { title: "Professors", path: "/profs" },
  { title: "Projects", path: "/projects" },
  { title: "Students", path: "/students" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="heading text-3xl">Admin Dashboard</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.path} to={section.path}>
            <Card className="h-full flex items-center justify-between hover:bg-butter">
              <h3 className="heading text-xl">{section.title}</h3>
              <Button variant="danger">Manage</Button>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
