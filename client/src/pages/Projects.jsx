import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { profs, projects, getCurrentUser } from "@/api";
import { ErrorMessage, Loading } from "@/components/Extras";
import Card from "@/components/Card";
import Popup from "@/components/Popup";
import Button from "@/components/Button";

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

      <Link
        to={`/projects?prof=${encodeURIComponent(project.prof_id)}`}
        className="inline-block text-sm font-bold underline hover:text-ink-soft"
      >
        View other projects by this professor
      </Link>
    </div>
  );
}

// can we inline this? maybe not
function ProjectEditor({ project, profList, defaultProfId, onSave, onClose }) {
  const [form, setForm] = useState({
    pname: project?.pname ?? "",
    desc: project?.desc ?? "",
    max_students: project?.max_students ?? 1,
    prof_id: project?.prof_id ?? defaultProfId ?? profList[0]?._id ?? "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();

    const maxStudents = Number(form.max_students);

    if (!Number.isInteger(maxStudents) || maxStudents < 1) {
      setError("Maximum students must be a positive integer.");
      return;
    }

    if (!form.prof_id) {
      setError("Please select a supervising professor.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await onSave(
        {
          ...form,
          max_students: maxStudents,
        },
        project,
      );

      onClose();
    } catch (err) {
      setError(err.message || "Failed to save project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-bold">Project title</label>
        <input
          value={form.pname}
          onChange={(e) => update("pname", e.target.value)}
          required
          className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-bold">Description</label>
        <textarea
          value={form.desc}
          onChange={(e) => update("desc", e.target.value)}
          required
          rows={5}
          className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-bold">
            Maximum students
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={form.max_students}
            onChange={(e) => update("max_students", e.target.value)}
            required
            className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold">Professor</label>
          <select
            value={form.prof_id}
            onChange={(e) => update("prof_id", e.target.value)}
            required
            className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="">Select professor</option>
            {profList.map((prof) => (
              <option key={prof._id} value={prof._id}>
                {prof.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || profList.length == 0}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

export default function Projects() {
  const [searchParams] = useSearchParams();
  const profId = searchParams.get("prof");

  const [projectList, setProjectList] = useState(null);
  const [profList, setProfList] = useState([]);
  const [prof, setProf] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(undefined);
  const [error, setError] = useState("");

  async function load() {
    const [list, professors, user] = await Promise.all([
      profId ? projects.getByProf(profId) : projects.getAll(),
      profs.getAll(),
      getCurrentUser(),
    ]);

    let professor = null;

    if (profId) {
      professor = await profs.get(profId);
    }

    setProjectList(list);
    setProfList(professors);
    setProf(professor);
    setIsAdmin(user?.role?.toLowerCase() == "admin");
    setError("");
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const [list, professors, user, professor] = await Promise.all([
          profId ? projects.getByProf(profId) : projects.getAll(),
          profs.getAll(),
          getCurrentUser(),
          profId ? profs.get(profId) : Promise.resolve(null),
        ]);

        if (active) {
          setProjectList(list);
          setProfList(professors);
          setProf(professor);
          setIsAdmin(user?.role?.toLowerCase() == "admin");
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load projects.");
        }
      }
    }

    setProjectList(null);
    setProf(null);
    setError("");

    initialLoad();

    return () => {
      active = false;
    };
  }, [profId]);

  if (error) return <ErrorMessage message={error} />;
  if (!projectList) return <Loading />;

  async function saveProject(data, original) {
    if (original) {
      await projects.update(original._id, data);
    } else {
      await projects.add(data);
    }

    await load();
  }

  async function deleteProject(project) {
    if (!window.confirm(`Delete project "${project.pname}"?`)) return;

    try {
      await projects.remove(project._id);
      await load();
    } catch (err) {
      setError(err.message || "Failed to delete project.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading text-3xl">
            {prof ? `Projects by ${prof.name}` : "Projects"}
          </h2>

          <p className="mt-2 text-sm text-ink-soft">
            {prof
              ? `Showing projects supervised by ${prof.name}.`
              : "Browse all available projects."}
          </p>

          {prof && (
            <Link
              to="/projects"
              className="mt-3 inline-block text-sm font-bold underline hover:text-ink-soft"
            >
              View all projects
            </Link>
          )}
        </div>

        {isAdmin && (
          <Button onClick={() => setEditingProject(null)}>+ Add project</Button>
        )}
      </div>

      {isAdmin ? (
        <div className="w-full overflow-x-auto border-2 border-ink">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead className="bg-ink text-paper">
              <tr>
                {[
                  "Project",
                  "Professor",
                  "Maximum students",
                  "Description",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="p-3 font-bold uppercase">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {projectList.map((project) => {
                const supervisor = profList.find(
                  (p) => p._id == project.prof_id,
                );

                return (
                  <tr key={project._id} className="border-t-2 border-ink">
                    <td className="p-3 font-bold">{project.pname}</td>
                    <td className="p-3">
                      {supervisor?.name ?? project.prof_id}
                    </td>
                    <td className="p-3">{project.max_students}</td>
                    <td className="max-w-sm p-3">
                      <p className="line-clamp-2">{project.desc}</p>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setEditingProject(project)}
                        >
                          Modify
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => deleteProject(project)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {projectList.length == 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-ink-soft">
                    No projects available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : projectList.length == 0 ? (
        <p className="text-sm text-ink-soft">No projects available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projectList.map((project) => (
            <Card
              key={project._id}
              onClick={() => setSelectedProject(project)}
              className="cursor-pointer space-y-2 hover:bg-butter"
            >
              <h3 className="heading text-xl">{project.pname}</h3>
              <p className="text-sm text-ink-soft line-clamp-3">
                {project.desc}
              </p>
              <p className="text-xs text-ink-soft">
                Maximum students: {project.max_students}
              </p>
            </Card>
          ))}
        </div>
      )}

      {selectedProject && (
        <Popup
          title={selectedProject.pname}
          onClose={() => setSelectedProject(null)}
        >
          <ProjectDetail project={selectedProject} />
        </Popup>
      )}

      {editingProject !== undefined && (
        <Popup
          title={
            editingProject ? `Modify ${editingProject.pname}` : "Add project"
          }
          onClose={() => setEditingProject(undefined)}
        >
          <ProjectEditor
            project={editingProject}
            profList={profList}
            defaultProfId={profId}
            onSave={saveProject}
            onClose={() => setEditingProject(undefined)}
          />
        </Popup>
      )}
    </div>
  );
}
