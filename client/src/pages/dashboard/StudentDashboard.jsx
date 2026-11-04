import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage, Loading } from "@/components/Extras";
import { projects, profs, students, getPhase } from "@/api";
import Popup from "@/components/Popup";
import Button from "@/components/Button";

/*
 * PHASE 0 - students can view professor information - no token dist
 * PHASE 1 - students can allocate tokens to projects - token dist
 * PHASE 2 - students can view professor/project information - no token dist
 * PHASE 3 - students can view their final allocation - no token dist
 * PHASE 4 - students can view their final assignment - no token dist
 */

function ProjectDetail({ project, professor }) {
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

      {professor && (
        <div>
          <p className="text-sm text-ink-soft">Professor</p>
          <p className="font-bold">{professor.name}</p>
        </div>
      )}
    </div>
  );
}

function normalizeTokenDist(dist) {
  return Object.fromEntries(
    Object.entries(dist)
      .map(([id, amount]) => [id, Number(amount || 0)])
      .filter(([, amount]) => amount > 0)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

export default function StudentDashboard({ uname }) {
  const [info, setInfo] = useState(null);
  const [phase, setPhase] = useState(null);
  const [projectList, setProjectList] = useState([]);
  const [professorList, setProfessorList] = useState([]);

  const [draftTokenDist, setDraftTokenDist] = useState({});
  const [pickerTokens, setPickerTokens] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [showAllocation, setShowAllocation] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [student, currentPhase] = await Promise.all([
          students.get(uname),
          getPhase(),
        ]);

        if (!active) return;

        setInfo(student);
        setPhase(currentPhase);
        setDraftTokenDist({ ...(student.token_dist || {}) });
      } catch (err) {
        if (active) setError(err.message || "Failed to load student.");
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [uname]);

  async function loadDetails() {
    setLoading(true);
    setError("");

    try {
      const [allProjects, allProfs] = await Promise.all([
        projects.getAll(),
        profs.getAll(),
      ]);

      setProjectList(allProjects);
      setProfessorList(allProfs);
      setDetailsLoaded(true);
      return true;
    } catch (err) {
      setError(err.message || "Failed to load project information.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  function getProfessor(project) {
    return professorList.find((professor) => professor.uname === project.prof_uname);
  }

  function updateTokens(projectID, amount) {
    setDraftTokenDist((previous) => ({
      ...previous,
      [projectID]: amount === "" ? "" : Number(amount),
    }));
  }

  function addProject(projectID) {
    setDraftTokenDist((previous) => ({
      ...previous,
      [projectID]: Number(pickerTokens[projectID] || 0),
    }));

    setPickerTokens((previous) => ({
      ...previous,
      [projectID]: 0,
    }));

    setShowPicker(false);
  }

  function removeProject(projectID) {
    setDraftTokenDist((previous) => {
      const updated = { ...previous };
      delete updated[projectID];
      return updated;
    });
  }

  async function saveAllocation() {
    setSaving(true);
    setError("");

    try {
      const updatedStudent = await students.allocateTokens(
        uname,
        normalizeTokenDist(draftTokenDist),
      );

      setInfo(updatedStudent);
      setDraftTokenDist({ ...(updatedStudent.token_dist || {}) });
    } catch (err) {
      setError(err.message || "Failed to save allocation.");
    } finally {
      setSaving(false);
    }
  }

  const totalTokens = Object.values(draftTokenDist).reduce(
    (sum, amount) => sum + Number(amount || 0),
    0,
  );

  const selectedProjects = projectList.filter(
    (project) => project._id in draftTokenDist,
  );

  const hasUnsavedChanges =
    JSON.stringify(normalizeTokenDist(draftTokenDist)) !==
    JSON.stringify(normalizeTokenDist(info?.token_dist || {}));

  const assignedProject = info?.final_proj_id
    ? projectList.find((project) => project._id === info.final_proj_id)
    : null;

  if (error && !info) return <ErrorMessage message={error} />;
  if (!info || phase === null) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading text-3xl">{info.name}</h2>
        <p className="text-sm text-ink-soft">{info.email}</p>
        {info.about && <p className="mt-3">{info.about}</p>}
      </div>

      <div className="border-y-2 border-ink py-3">
        <h3 className="heading text-xl">
          PHASE {phase}: PHASE {phase}
        </h3>
      </div>

      {error && <ErrorMessage message={error} />}

      {phase === 0 && (
        <section className="space-y-3">
          <p>
            Student token distribution has not started yet. Please wait until
            the allocation window opens.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link className="btn" to="/profs">
              View Professors
            </Link>
            <Link className="btn" to="/projects">
              View Projects
            </Link>
          </div>
        </section>
      )}

      {phase === 1 && (
        <section className="space-y-4">
          <p>
            Student token distribution is now open. Select projects and
            distribute your 100 tokens among them.
          </p>

          <Button
            onClick={async () => {
              const success = await loadDetails();
              if (success) setShowPicker(true);
            }}
          >
            Add Project
          </Button>

          {loading && <Loading />}

          {detailsLoaded && (
            <div className="space-y-3">
              <h4 className="font-bold">Your allocation</h4>

              {selectedProjects.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  You haven't added any projects yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedProjects.map((project) => (
                    <div
                      key={project._id}
                      className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink p-3"
                    >
                      <button
                        className="text-left font-bold underline"
                        onClick={() => setSelectedProject(project)}
                      >
                        {project.pname}
                      </button>

                      <div className="flex items-center gap-2">
                        <label
                          className="text-sm"
                          htmlFor={`tokens-${project._id}`}
                        >
                          Tokens
                        </label>

                        <input
                          id={`tokens-${project._id}`}
                          className="input w-20"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={draftTokenDist[project._id] ?? ""}
                          onChange={(e) =>
                            updateTokens(project._id, e.target.value)
                          }
                        />

                        <Button
                          variant="danger"
                          onClick={() => removeProject(project._id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between border-t-2 border-ink pt-3">
                <p className="font-bold">Total: {totalTokens} / 100 tokens</p>

                {hasUnsavedChanges && (
                  <Button
                    disabled={saving || totalTokens > 100}
                    onClick={saveAllocation}
                  >
                    {saving ? "Saving..." : "Save Allocation"}
                  </Button>
                )}
              </div>

              {totalTokens > 100 && (
                <ErrorMessage message="Your allocation exceeds 100 tokens." />
              )}
            </div>
          )}
        </section>
      )}

      {phase === 2 && (
        <section className="space-y-3">
          <p>
            Professors are now reviewing student preferences and selecting
            students. Your token distribution can no longer be modified.
          </p>

          <Button
            variant="secondary"
            onClick={async () => {
              const success = await loadDetails();
              if (success) setShowAllocation(true);
            }}
          >
            View Token Distribution
          </Button>

          {showAllocation && (
            <div className="space-y-2">
              {Object.entries(info.token_dist || {}).length === 0 ? (
                <p className="text-sm text-ink-soft">
                  No token distribution found.
                </p>
              ) : (
                Object.entries(info.token_dist).map(([projectID, tokens]) => {
                  const project = projectList.find(
                    (item) => item._id === projectID,
                  );

                  return (
                    <div
                      key={projectID}
                      className="flex justify-between border-2 border-ink p-3"
                    >
                      <span>{project?.pname || projectID}</span>
                      <strong>{tokens} tokens</strong>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      )}

      {(phase === 3 || phase === 4) && (
        <section className="space-y-3">
          <h3 className="heading text-xl">Final Assignment</h3>

          <Button
            variant="secondary"
            onClick={async () => {
              const success = await loadDetails();
              if (success) setShowAllocation(true);
            }}
          >
            View Assignment
          </Button>

          {showAllocation &&
            (!info.final_proj_id ? (
              <p className="text-sm text-ink-soft">
                You have not been assigned a project yet.
              </p>
            ) : assignedProject ? (
              <div className="border-2 border-ink p-4">
                <ProjectDetail
                  project={assignedProject}
                  professor={getProfessor(assignedProject)}
                />
              </div>
            ) : (
              <p className="text-sm text-ink-soft">
                Loading assignment details...
              </p>
            ))}

          <div className="flex flex-wrap gap-3">
            <Link className="btn" to="/profs">
              Browse Professors
            </Link>
            <Link className="btn" to="/projects">
              Browse Projects
            </Link>
          </div>
        </section>
      )}

      {showPicker && (
        <Popup title="Add a project" onClose={() => setShowPicker(false)}>
          <div className="space-y-3">
            {projectList
              .filter((project) => !(project._id in draftTokenDist))
              .map((project) => (
                <div
                  key={project._id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-ink py-2"
                >
                  <div>
                    <button
                      className="font-bold underline"
                      onClick={() => setSelectedProject(project)}
                    >
                      {project.pname}
                    </button>
                    <p className="text-xs text-ink-soft">
                      {getProfessor(project)?.name || "Unknown professor"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      className="text-sm"
                      htmlFor={`picker-${project._id}`}
                    >
                      Tokens
                    </label>

                    <input
                      id={`picker-${project._id}`}
                      className="input w-20"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={pickerTokens[project._id] ?? 0}
                      onChange={(e) =>
                        setPickerTokens((previous) => ({
                          ...previous,
                          [project._id]: e.target.value,
                        }))
                      }
                    />

                    <Button onClick={() => addProject(project._id)}>Add</Button>
                  </div>
                </div>
              ))}

            {projectList.every((project) => project._id in draftTokenDist) && (
              <p className="text-sm text-ink-soft">
                You have added all available projects.
              </p>
            )}
          </div>
        </Popup>
      )}

      {selectedProject && (
        <Popup
          title={selectedProject.pname}
          onClose={() => setSelectedProject(null)}
        >
          <ProjectDetail
            project={selectedProject}
            professor={getProfessor(selectedProject)}
          />
        </Popup>
      )}
    </div>
  );
}
