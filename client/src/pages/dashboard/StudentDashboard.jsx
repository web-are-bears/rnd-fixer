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

function validateStudentAllocation(dist) {
  const amounts = Object.values(dist).map(Number);
  const positive = amounts.filter((amount) => amount > 0);
  const total = amounts.reduce((sum, amount) => sum + amount, 0);

  if (amounts.some((amount) => !Number.isInteger(amount)))
    return "Tokens must be whole numbers.";
  if (positive.some((amount) => amount <= 0))
    return "Each project must receive a positive token amount.";
  if (new Set(positive).size !== positive.length)
    return "Token amounts cannot be repeated.";
  if (total !== 100)
    return `Allocate exactly 100 tokens. Current total: ${total}.`;

  return "";
}

export default function StudentDashboard({ uname }) {
  const [info, setInfo] = useState(null);
  const [phase, setPhase] = useState(null);
  const [projectList, setProjectList] = useState([]);
  const [professorList, setProfessorList] = useState([]);
  const [draftTokenDist, setDraftTokenDist] = useState({});
  const [pickerProjectID, setPickerProjectID] = useState("");
  const [pickerAmount, setPickerAmount] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [showAllocation, setShowAllocation] = useState(false);
  const [showProfessorAllocations, setShowProfessorAllocations] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([students.get(uname), getPhase()])
      .then(([student, currentPhase]) => {
        if (!active) return;
        setInfo(student);
        setPhase(currentPhase);
        setDraftTokenDist(student.token_dist || {});
      })
      .catch((err) => active && setError(err.message || "Failed to load student."));

    return () => { active = false; };
  }, [uname]);

  async function loadDetails() {
    setLoading(true);
    setError("");

    try {
      const [allProjects, allProfs] = await Promise.all([projects.getAll(), profs.getAll()]);
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

  const getProfessor = (project) =>
    professorList.find((professor) => professor.uname === project.prof_uname);

  const selectedProjects = projectList.filter((project) => project._id in draftTokenDist);
  const availableProjects = projectList.filter((project) => !(project._id in draftTokenDist));
  const totalTokens = Object.values(draftTokenDist).reduce((sum, amount) => sum + Number(amount || 0), 0);
  const allocationError = validateStudentAllocation(draftTokenDist);
  const hasUnsavedChanges = JSON.stringify(normalizeTokenDist(draftTokenDist)) !== JSON.stringify(normalizeTokenDist(info?.token_dist || {}));
  const existingAmounts = Object.values(draftTokenDist).map(Number).filter((amount) => amount > 0);
  const duplicateAmount = pickerAmount !== "" && existingAmounts.includes(Number(pickerAmount));
  const validPickerAmount = Number.isInteger(Number(pickerAmount)) && Number(pickerAmount) > 0 && !duplicateAmount;

  const assignedProject = projectList.find((project) => String(project._id) === String(info?.final_proj_id));

  const professorAllocations = projectList
    .map((project) => ({ project, tokens: Number(project.token_dist?.[uname] || 0) }))
    .filter(({ tokens }) => tokens > 0)
    .sort((a, b) => String(a.project._id).localeCompare(String(b.project._id)));

  const phaseLabels = {
    0: "Project Browsing",
    1: "Preference Allocation",
    2: "Project Information",
    3: "Professor Allocation",
    4: "Final Assignment",
  };

  function addProject() {
    const amount = Number(pickerAmount);
    if (!pickerProjectID || !Number.isInteger(amount) || amount <= 0 || existingAmounts.includes(amount)) return;

    setDraftTokenDist((previous) => ({ ...previous, [pickerProjectID]: amount }));
    setPickerProjectID("");
    setPickerAmount("");
  }

  async function saveAllocation() {
    if (allocationError) return setError(allocationError);

    setSaving(true);
    setError("");

    try {
      const updated = await students.allocateTokens(uname, normalizeTokenDist(draftTokenDist));
      setInfo(updated);
      setDraftTokenDist(updated.token_dist || {});
    } catch (err) {
      setError(err.message || "Failed to save allocation.");
    } finally {
      setSaving(false);
    }
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

      <div className="border-y-2 border-ink py-3">
        <h3 className="heading text-xl">PHASE {phase}: {phaseLabels[phase] || "Unknown"}</h3>
      </div>

      {error && <ErrorMessage message={error} />}

      {phase === 0 && (
        <section className="space-y-3">
          <p>Browse professors before preference allocation begins.</p>
          <Link className="btn" to="/profs">View Professors</Link>
        </section>
      )}

      {phase === 1 && (
        <section className="space-y-4">
          <p>Allocate exactly 100 tokens. Each project must receive a positive, unique token amount.</p>

          <Button onClick={async () => { if (await loadDetails()) setShowPicker(true); }}>
            Add Project
          </Button>

          {loading && <Loading />}

          {detailsLoaded && (
            <div className="space-y-3">
              <h4 className="font-bold">Your preferences</h4>

              {!selectedProjects.length ? (
                <p className="text-sm text-ink-soft">No projects selected.</p>
              ) : (
                <div className="space-y-2">
                  {selectedProjects.map((project) => (
                    <div key={project._id} className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink p-3">
                      <button className="text-left font-bold underline" onClick={() => setSelectedProject(project)}>
                        {project.pname}
                      </button>
                      <div className="flex items-center gap-2">
                        <label htmlFor={`tokens-${project._id}`}>Tokens</label>
                        <input
                          id={`tokens-${project._id}`}
                          className="input w-20"
                          type="number"
                          min="0"
                          step="1"
                          value={draftTokenDist[project._id] ?? ""}
                          onChange={(e) => setDraftTokenDist((previous) => ({
                            ...previous,
                            [project._id]: e.target.value === "" ? "" : Number(e.target.value),
                          }))}
                        />
                        <Button variant="danger" onClick={() => setDraftTokenDist((previous) => {
                          const updated = { ...previous };
                          delete updated[project._id];
                          return updated;
                        })}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink pt-3">
                <p className="font-bold">{totalTokens} / 100 tokens</p>
                {hasUnsavedChanges && (
                  <Button disabled={saving || Boolean(allocationError)} onClick={saveAllocation}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                )}
              </div>

              {allocationError && <p className="text-sm text-ink-soft">{allocationError}</p>}
              {!hasUnsavedChanges && <p className="text-sm text-ink-soft">Allocation saved.</p>}
            </div>
          )}
        </section>
      )}

      {phase === 2 && (
        <section className="space-y-3">
          <p>Browse available projects and professors.</p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn" to="/profs">Professors</Link>
            <Link className="btn" to="/projects">Projects</Link>
          </div>
        </section>
      )}

      {phase === 3 && (
        <section className="space-y-4">
          <p>View the tokens professors have allocated to you.</p>
          <Button variant="secondary" onClick={async () => { if (await loadDetails()) setShowProfessorAllocations(true); }}>
            View Allocations
          </Button>
          {loading && <Loading />}
          {showProfessorAllocations && (
            <div className="space-y-3">
              {!professorAllocations.length ? (
                <p className="text-sm text-ink-soft">No allocations yet.</p>
              ) : professorAllocations.map(({ project, tokens }) => (
                <div key={project._id} className="flex items-center justify-between gap-3 border-2 border-ink p-3">
                  <div>
                    <button className="text-left font-bold underline" onClick={() => setSelectedProject(project)}>
                      {project.pname}
                    </button>
                    <p className="text-sm text-ink-soft">{getProfessor(project)?.name || "Unknown professor"}</p>
                  </div>
                  <p className="font-bold">{tokens} tokens</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {phase === 4 && (
        <section className="space-y-3">
          <Button variant="secondary" onClick={async () => { if (await loadDetails()) setShowAllocation(true); }}>
            View Assignment
          </Button>
          {showAllocation && (
            !info.final_proj_id ? (
              <p className="text-sm text-ink-soft">Not assigned yet.</p>
            ) : assignedProject ? (
              <div className="border-2 border-ink p-4">
                <ProjectDetail project={assignedProject} professor={getProfessor(assignedProject)} />
              </div>
            ) : <p className="text-sm text-ink-soft">Loading assignment...</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Link className="btn" to="/profs">Professors</Link>
            <Link className="btn" to="/projects">Projects</Link>
          </div>
        </section>
      )}

      {showPicker && (
        <Popup title="Add a project" onClose={() => setShowPicker(false)}>
          <div className="space-y-4">
            {!availableProjects.length ? (
              <p className="text-sm text-ink-soft">All projects added.</p>
            ) : (
              <>
                <div>
                  <label htmlFor="project-picker">Project</label>
                  <select id="project-picker" className="input mt-1 w-full" value={pickerProjectID} onChange={(e) => setPickerProjectID(e.target.value)}>
                    <option value="">Select a project</option>
                    {availableProjects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.pname} — {getProfessor(project)?.name || "Unknown professor"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="project-tokens">Tokens</label>
                  <input id="project-tokens" className="input mt-1 w-full" type="number" min="1" step="1" value={pickerAmount} onChange={(e) => setPickerAmount(e.target.value)} placeholder="Positive amount" />
                </div>
                {duplicateAmount && <p className="text-sm text-ink-soft">Token amount already used.</p>}
                <Button disabled={!pickerProjectID || !validPickerAmount} onClick={addProject}>Add</Button>
              </>
            )}
          </div>
        </Popup>
      )}

      {selectedProject && (
        <Popup title={selectedProject.pname} onClose={() => setSelectedProject(null)}>
          <ProjectDetail project={selectedProject} professor={getProfessor(selectedProject)} />
        </Popup>
      )}
    </div>
  );
}
