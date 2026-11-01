import { useEffect, useState } from "react";
import { ErrorMessage, Loading } from "@/components/Extras";
import { projects, students, getPhase } from "@/test/api";
import Popup from "@/components/Popup";
import EdiTable from "@/components/EdiTable";

/*
 * PHASE 0 - Students can view professor information.
 * PHASE 1 - Students can allocate tokens to projects.
 * PHASE 2 - Students can view professor/project information.
 * PHASE 3 - Students can view their final allocation.
 * PHASE 4 - Students can view their final assignment.
 */

function ProjectDetail({ project }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="heading text-2xl">{project.pname}</h2>
        <p className="mt-2">{project.desc}</p>
      </div>

      <div>
        <p className="text-sm text-ink-soft">Maximum students</p>
        <p className="font-bold">{project.max_students}</p>
      </div>
    </div>
  );
}

export default function StudentDashboard({ uname }) {
  const [info, setInfo] = useState(null);
  const [phase, setPhase] = useState(null);
  const [projectList, setProjectList] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAssignment, setShowAssignment] = useState(false);
  const [error, setError] = useState("");

  // Load the student's profile and the current application phase.
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [student, currentPhase] = await Promise.all([
          students.get(uname),
          getPhase(),
        ]);

        if (active) {
          setInfo(student);
          setPhase(currentPhase);
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

  // Load projects only when the student requests token allocation.
  async function loadProjects() {
    try {
      setError("");

      const list = await projects.getAll();

      setProjectList(
        list.map((project) => ({
          ...project,
          tokens: info.token_dist?.[project._id] ?? 0,
        })),
      );
    } catch (err) {
      setError(err.message || "Failed to load projects.");
    }
  }

  // The API handles token validation and persistence.
  async function saveTokens(updatedRow) {
    const updatedStudent = await students.allocateTokens(
      uname,
      updatedRow._id,
      updatedRow.tokens,
    );

    setInfo(updatedStudent);

    setProjectList((previous) =>
      previous.map((project) =>
        project._id === updatedRow._id
          ? { ...project, tokens: updatedRow.tokens }
          : project,
      ),
    );
  }

  if (error && !info) return <ErrorMessage message={error} />;
  if (!info || phase === null) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading text-3xl">{info.name}</h2>
        <p className="text-sm text-ink-soft">{info.email}</p>
        {info.about && <p className="mt-3">{info.about}</p>}
      </div>

      {error && <ErrorMessage message={error} />}

      {phase === 1 && (
        <section className="space-y-3">
          <h3 className="heading text-xl">Allocate Tokens</h3>

          {!projectList ? (
            <button className="btn btn-primary" onClick={loadProjects}>
              View Projects
            </button>
          ) : (
            <EdiTable
              columns={[
                {
                  key: "pname",
                  label: "Project",
                  editable: false,
                  render: (project) => (
                    <button
                      className="font-bold underline hover:text-ink-soft"
                      onClick={() => setSelectedProject(project)}
                    >
                      {project.pname}
                    </button>
                  ),
                },
                {
                  key: "tokens",
                  label: "Tokens",
                  type: "number",
                  editable: true,
                },
              ]}
              data={projectList}
              onSave={saveTokens}
              pageSize={5}
            />
          )}
        </section>
      )}

      {(phase === 3 || phase === 4) && (
        <section className="space-y-3">
          <h3 className="heading text-xl">Project Assignment</h3>

          {!showAssignment ? (
            <button
              className="btn btn-primary"
              onClick={() => setShowAssignment(true)}
            >
              View Assignment
            </button>
          ) : info.final_proj_id ? (
            <p className="text-sm">
              Assigned project ID: <strong>{info.final_proj_id}</strong>
            </p>
          ) : (
            <p className="text-sm text-ink-soft">
              You have not been assigned a project yet.
            </p>
          )}
        </section>
      )}

      {selectedProject && (
        <Popup
          title={selectedProject.pname}
          onClose={() => setSelectedProject(null)}
        >
          <ProjectDetail project={selectedProject} />
        </Popup>
      )}
    </div>
  );
}
