import { useEffect, useState } from "react";
import { ErrorMessage, Loading } from "@/components/Extras";
import { profs, projects, students } from "@/test/api";
import Card from "@/components/Card";
import Popup from "@/components/Popup";

/*
 * PHASE 0 - students should be able to see information on the professors
 * PHASE 1 - students should be able to give tokens to different projects,
 *    given that they have enough tokens in token_dist (100 total)
 * PHASE 2 - students should only be able to see project/prof information, and
 *    not modify their token distribution anymore
 * PHASE 3 - students should be able to navigate and see the final allocation,
 *    but they can't modify their distribution anymore
 * PHASE 4 - students should be able to see final assignments, and maybe in the
 *    future a ticket system could be added for any issues in allocation
 */

function ProfDetail({ uname }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const prof = await profs.get(uname);
        const projectList = await projects.getByProf(prof._id);

        if (active) setInfo({ ...prof, projectList });
      } catch (err) {
        if (active) setError(err.message || "Failed to load professor.");
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [uname]);

  if (error) return <ErrorMessage message={error} />;
  if (!info) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading text-3xl">{info.name}</h2>
        <p className="text-sm text-ink-soft">{info.email}</p>
        {info.about && <p className="mt-3">{info.about}</p>}
      </div>

      <section className="space-y-3">
        <h3 className="heading text-xl">Projects</h3>

        {info.projectList.length === 0 ? (
          <p className="text-sm text-ink-soft">No projects available.</p>
        ) : (
          info.projectList.map((project) => (
            <Card key={project._id}>
              <h4 className="font-bold">{project.pname}</h4>
              <p className="mt-1 text-sm">{project.desc}</p>
              <p className="mt-2 text-xs text-ink-soft">
                Maximum students: {project.max_students}
              </p>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}

export default function StudentDashboard({ uname }) {
  const [info, setInfo] = useState(null);
  const [profList, setProfList] = useState(null);
  const [selectedProf, setSelectedProf] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [student, profList] = await Promise.all([
          students.get(uname),
          profs.getAll(),
        ]);

        if (active) {
          setInfo(student);
          setProfList(profList);
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to load student.");
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [uname]);

  if (error) return <ErrorMessage message={error} />;
  if (!info || !profList) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading text-3xl">{info.name}</h2>
        <p className="text-sm text-ink-soft">{info.email}</p>
        {info.about && <p className="mt-3">{info.about}</p>}
      </div>

      <section className="space-y-3">
        <h3 className="heading text-xl">Project Assignment</h3>

        {info.final_proj_id ? (
          <p className="text-sm">
            Assigned project ID: <strong>{info.final_proj_id}</strong>
          </p>
        ) : (
          <p className="text-sm text-ink-soft">
            You have not been assigned a project yet.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="heading text-xl">Professors</h3>

        {profList.length === 0 ? (
          <p className="text-sm text-ink-soft">No professors available.</p>
        ) : (
          profList.map((prof) => (
            <Card
              key={prof._id}
              onClick={() => setSelectedProf(prof)}
              className="cursor-pointer hover:bg-butter"
            >
              <h4 className="font-bold">{prof.name}</h4>
              <p className="text-sm text-ink-soft">{prof.email}</p>
              {prof.about && <p className="mt-2 text-sm">{prof.about}</p>}
            </Card>
          ))
        )}
      </section>

      {selectedProf && (
        <Popup title={selectedProf.name} onClose={() => setSelectedProf(null)}>
          <ProfDetail uname={selectedProf.uname} />
        </Popup>
      )}
    </div>
  );
}
