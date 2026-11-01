import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { profs } from "@/test/api";
import { ErrorMessage, Loading } from "@/components/Extras";
import Card from "@/components/Card";

export default function Profs() {
  const [profList, setProfList] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const list = await profs.getAll();

        if (active) setProfList(list);
      } catch (err) {
        if (active) setError(err.message || "Failed to load professors.");
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!profList) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading text-3xl">Professors</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Browse professors and explore their projects.
        </p>
      </div>

      {profList.length === 0 ? (
        <p className="text-sm text-ink-soft">No professors available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {profList.map((prof) => (
            <Card key={prof._id} className="space-y-3">
              <div>
                <h3 className="heading text-xl">{prof.name}</h3>
                <p className="text-sm text-ink-soft">{prof.email}</p>
              </div>

              {prof.about && <p className="text-sm">{prof.about}</p>}

              <Link
                to={`/projects?prof=${encodeURIComponent(prof._id)}`}
                className="inline-block text-sm font-bold underline hover:text-ink-soft"
              >
                View projects
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
