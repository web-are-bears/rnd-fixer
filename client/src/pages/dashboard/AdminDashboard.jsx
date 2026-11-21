import { Link } from "react-router-dom";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useEffect, useState } from "react";
import { getPhase, setPhase } from "@/api";

const sections = [
  { title: "User Accounts", path: "/users" },
  { title: "Professors", path: "/profs" },
  { title: "Projects", path: "/projects" },
  { title: "Students", path: "/students" },
];

export default function AdminDashboard() {
  const [phase, setPhaseValue] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPhase().then(setPhaseValue);
  }, []);

  async function changePhase(value) {
    try {
      setSaving(true);
      const updated = await setPhase(Number(value));
      setPhaseValue(updated);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

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

      <div className="section flex items-center justify-between gap-4">
        <div>
          <h3 className="heading text-xl">Application Phase</h3>
          <p className="text-sm text-ink-soft">
            Current phase: {phase ?? "Loading..."}
          </p>
        </div>

        <select
          className="input max-w-32"
          value={phase ?? ""}
          disabled={phase === null || saving}
          onChange={(e) => changePhase(e.target.value)}
        >
          {[0, 1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              Phase {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
