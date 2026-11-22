import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { profs, projects, students, getPhase } from "@/api";
import { ErrorMessage, Loading } from "@/components/Extras";
import Card from "@/components/Card";
import Popup from "@/components/Popup";
import Button from "@/components/Button";

/* phase information
 * 0 - professor can add projects and modify their projects
 * 1, 3, 5 - professor can't do anything, just see projects/students
 * 2 - professors can see what students picked their projects and give tokens
 */

function ProjectDetail({ project, projectList, studentList, phase, onSaved }) {
  const [tokenInputs, setTokenInputs] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const initial = {};
    studentList.forEach((student) => {
      initial[student.uname] = String(project.token_dist?.[student.uname] ?? 0);
    });
    setTokenInputs(initial);
    setFeedback("");
  }, [studentList, project._id, project.token_dist]);

  async function saveTokens() {
    try {
      setSaving(true);
      setFeedback("");

      const tokenDist = {};

      for (const student of studentList) {
        const value = tokenInputs[student.uname] ?? "0";

        if (value.trim() === "") {
          throw new Error(`Enter a token amount for ${student.name}.`);
        }

        const amount = Number(value);

        if (!Number.isInteger(amount) || amount < 0 || amount > 100) {
          throw new Error(`Invalid tokens for ${student.name}.`);
        }

        if (amount > 0) {
          const otherAmounts = projectList
            .filter((item) => String(item._id) !== String(project._id))
            .map((item) => Number(item.token_dist?.[student.uname] ?? 0))
            .filter((n) => n > 0);

          if (otherAmounts.includes(amount)) {
            throw new Error(
              `${student.name} already has this token amount in another project.`,
            );
          }

          const total =
            otherAmounts.reduce((sum, n) => sum + n, 0) + amount;

          if (total > 100) {
            throw new Error(
              `${student.name} has been allocated more than 100 tokens.`,
            );
          }

          tokenDist[student.uname] = amount;
        }
      }

      await projects.allocateTokens(project._id, tokenDist);
      await onSaved(project._id);
      setFeedback("Allocations saved.");
    } catch (err) {
      setFeedback(err.message || "Failed to save allocations.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="heading text-2xl">{project.pname}</h2>
        <p className="mt-2">{project.desc}</p>
        <p className="mt-2 text-sm text-ink-soft">
          Maximum students: {project.max_students}
        </p>
      </div>

      {phase === 2 && (
        <div className="space-y-3">
          <h3 className="heading text-lg">
            Interested students ({studentList.length})
          </h3>

          {!studentList.length ? (
            <p className="text-sm text-ink-soft">
              No students have selected this project.
            </p>
          ) : (
            <>
              {studentList.map((student) => {
                const amount = Number(tokenInputs[student.uname] ?? 0);
                const otherTotal = projectList.reduce(
                  (sum, item) =>
                    sum +
                    (String(item._id) === String(project._id)
                      ? 0
                      : Number(item.token_dist?.[student.uname] ?? 0)),
                  0,
                );

                return (
                  <div key={student.uname} className="tile space-y-3">
                    <div>
                      <p className="font-bold">{student.name}</p>
                      <p className="text-sm text-ink-soft">{student.email}</p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-bold">
                        Professor tokens
                      </label>
                      <span className="text-xs text-ink-soft">
                        {otherTotal + (Number.isFinite(amount) ? amount : 0)} / 100
                        allocated
                      </span>
                    </div>

                    <input
                      className="input w-24"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={tokenInputs[student.uname] ?? "0"}
                      onChange={(e) =>
                        setTokenInputs((prev) => ({
                          ...prev,
                          [student.uname]: e.target.value,
                        }))
                      }
                    />
                  </div>
                );
              })}

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-ink-soft">{feedback}</p>
                <Button onClick={saveTokens} disabled={saving}>
                  {saving ? "Saving..." : "Save allocations"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {phase === 4 && (
        <div className="space-y-3">
          <h3 className="heading text-lg">
            Assigned students ({studentList.length})
          </h3>
          {!studentList.length ? (
            <p className="text-sm text-ink-soft">
              No students have been assigned to this project.
            </p>
          ) : (
            studentList.map((student) => (
              <div key={student.uname} className="tile">
                <p className="font-bold">{student.name}</p>
                <p className="text-sm text-ink-soft">{student.email}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfDashboard({ uname }) {
  const [info, setInfo] = useState(null);
  const [phase, setPhase] = useState(null);
  const [projectList, setProjectList] = useState([]);
  const [projectStudents, setProjectStudents] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(false);
  const [projectData, setProjectData] = useState({
    pname: "",
    desc: "",
    max_students: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const projectsSection = useRef(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [prof, currentPhase, list] = await Promise.all([
          profs.get(uname),
          getPhase(),
          projects.getByProf(uname),
        ]);

        const studentsByProject = {};

        if (currentPhase === 2 || currentPhase === 4) {
          const results = await Promise.all(
            list.map((project) =>
              currentPhase === 2
                ? students.getByAllocation(project._id)
                : students.getByProject(project._id),
            ),
          );

          list.forEach((project, index) => {
            studentsByProject[project._id] = results[index];
          });
        }

        if (active) {
          setInfo(prof);
          setPhase(currentPhase);
          setProjectList(list);
          setProjectStudents(studentsByProject);
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to load professor dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [uname]);

  function openProjectEditor() {
    setProjectData({ pname: "", desc: "", max_students: "" });
    setEditingProject(true);
  }

  function goToProjects() {
    projectsSection.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    const firstProject =
      projectList.find(
        (project) => (projectStudents[project._id] || []).length > 0,
      ) || projectList[0];

    if (firstProject) setSelectedProject(firstProject);
  }

  async function refreshProjectStudents(projectID) {
    const [updatedStudents, updatedProjects] = await Promise.all([
      students.getByAllocation(projectID),
      projects.getByProf(uname),
    ]);

    setProjectStudents((prev) => ({ ...prev, [projectID]: updatedStudents }));
    setProjectList(updatedProjects);
    setSelectedProject(
      updatedProjects.find((item) => String(item._id) === String(projectID)) ||
      null,
    );
  }

  async function saveProject(e) {
    e.preventDefault();
    const maxStudents = Number(projectData.max_students);

    if (
      !projectData.pname.trim() ||
      !Number.isInteger(maxStudents) ||
      maxStudents <= 0
    ) {
      alert("Enter a project name and a valid maximum number of students.");
      return;
    }

    try {
      setSaving(true);
      await projects.add({
        ...projectData,
        max_students: maxStudents,
        prof_uname: uname,
      });
      setProjectList(await projects.getByProf(uname));
      setEditingProject(false);
    } catch (err) {
      alert(err.message || "Failed to add project.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!info) return <ErrorMessage message="Professor profile not found." />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="heading text-3xl">{info.name}</h2>
          <p className="mt-1 text-sm text-ink-soft">{info.email}</p>
        </div>
        <span className="badge">Phase {phase}</span>
      </div>

      {phase === 2 && (
        <div className="section flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="heading text-xl">Token allocation</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Review interested students and allocate your tokens.
            </p>
          </div>
          <Button onClick={goToProjects}>Allocate Tokens</Button>
        </div>
      )}

      {phase === 3 && (
        <div className="section">
          <h3 className="heading text-xl">Match fixing in progress</h3>
          <p className="mt-1 text-sm text-ink-soft">
            Project allocations are being processed.
          </p>
        </div>
      )}

      <section className="section" ref={projectsSection}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="heading text-2xl">Your projects</h3>
          <div className="flex items-center gap-3">
            {phase === 0 && (
              <Button onClick={openProjectEditor}>+ Add project</Button>
            )}
            <Link to="/projects" className="text-sm font-bold">
              View all projects
            </Link>
          </div>
        </div>

        {!projectList.length ? (
          <p className="mt-4 text-sm text-ink-soft">
            You have no projects yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {projectList.map((project) => {
              const studentCount = projectStudents[project._id]?.length ?? 0;

              return (
                <Card
                  key={project._id}
                  onClick={() => setSelectedProject(project)}
                  className="cursor-pointer space-y-2 hover:bg-butter"
                >
                  <h4 className="heading text-xl">{project.pname}</h4>
                  <p className="text-sm text-ink-soft line-clamp-3">
                    {project.desc}
                  </p>
                  <p className="text-xs text-ink-soft">
                    Maximum students: {project.max_students}
                  </p>
                  {phase === 2 && (
                    <p className="metadata">
                      {studentCount} interested students
                    </p>
                  )}
                  {phase === 4 && (
                    <p className="metadata">{studentCount} assigned students</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {selectedProject && (
        <Popup
          title={selectedProject.pname}
          onClose={() => setSelectedProject(null)}
        >
          <ProjectDetail
            project={selectedProject}
            projectList={projectList}
            studentList={projectStudents[selectedProject._id] ?? []}
            phase={phase}
            onSaved={refreshProjectStudents}
          />
        </Popup>
      )}

      {editingProject && (
        <Popup title="Add Project" onClose={() => setEditingProject(false)}>
          <form onSubmit={saveProject} className="space-y-4">
            <div>
              <label className="text-sm font-bold">Project Name</label>
              <input
                className="input w-full"
                value={projectData.pname}
                onChange={(e) =>
                  setProjectData({ ...projectData, pname: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-bold">Description</label>
              <textarea
                className="input w-full"
                rows={4}
                value={projectData.desc}
                onChange={(e) =>
                  setProjectData({ ...projectData, desc: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-bold">Maximum Students</label>
              <input
                className="input w-full"
                type="number"
                min="1"
                value={projectData.max_students}
                onChange={(e) =>
                  setProjectData({
                    ...projectData,
                    max_students: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingProject(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Add Project"}
              </Button>
            </div>
          </form>
        </Popup>
      )}
    </div>
  );
}
