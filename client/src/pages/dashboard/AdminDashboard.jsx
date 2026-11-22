
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { getPhase, setPhase, fixmatch } from "@/api";

const sections = [
  { title: "User Accounts", path: "/users" },
  { title: "Professors", path: "/profs" },
  { title: "Projects", path: "/projects" },
  { title: "Students", path: "/students" },
];

export default function AdminDashboard() {
  const [phase, setPhaseValue] = useState(null);
  const [saving, setSaving] = useState(false);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    getPhase().then(setPhaseValue).catch((err) => alert(err.message));
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

  async function runMatchfix() {
    if (!window.confirm("Are you sure you want to run the matching algorithm?")) {
      return;
    }

    try {
      setMatching(true);
      await fixmatch();
      alert("Matchfix completed successfully!");
    } catch (err) {
      alert(err.message || "Matchfix failed.");
    } finally {
      setMatching(false);
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

      <div className="section space-y-4">
        <div className="flex items-center justify-between gap-4">
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

        {phase === 3 && (
          <div className="border-t border-ink/10 pt-4 space-y-3">
            <div>
              <h3 className="heading text-xl">Match fixing</h3>
              <p className="text-sm text-ink-soft">
                Run the matching algorithm to fix the final project allocations!
              </p>
            </div>

            <Button
              variant="primary"
              disabled={matching}
              onClick={runMatchfix}
            >
              {matching ? "Running Matchfix..." : "Run Matchfix"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
