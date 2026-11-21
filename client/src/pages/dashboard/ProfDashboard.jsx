import { useEffect, useState } from "react";
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

function ProjectDetail({ project, studentList }) {
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

      <div>
        <h3 className="heading text-lg">Students</h3>
        {studentList.length == 0 ? (
          <p className="text-sm text-ink-soft">
            No students have selected this project.
          </p>
        ) : (
          <div className="space-y-2">
            {studentList.map((student) => (
              <div key={student.uname} className="tile">
                <p className="font-bold">{student.name}</p>
                <p className="text-sm text-ink-soft">{student.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>
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

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [prof, currentPhase, list] = await Promise.all([
          profs.get(uname),
          getPhase(),
          projects.getByProf(uname),
        ]);

        let studentsByProject = {};

        if ([1, 2, 3, 5].includes(currentPhase)) {
          const results = await Promise.all(
            list.map((project) => students.getByProject(project._id)),
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
        if (active) {
          setError(err.message || "Failed to load professor dashboard.");
        }
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
    setProjectData({
      pname: "",
      desc: "",
      max_students: "",
    });
    setEditingProject(true);
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

      const updatedList = await projects.getByProf(uname);
      setProjectList(updatedList);
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

      <section className="section">
        <div className="flex items-center justify-between gap-3">
          <h3 className="heading text-2xl">Your projects</h3>

          <div className="flex items-center gap-3">
            {phase === 0 && (
              <Button onClick={openProjectEditor}>
                + Add project
              </Button>
            )}

            <Link to="/projects" className="text-sm font-bold">
              View all projects
            </Link>
          </div>
        </div>

        {projectList.length == 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            You have no projects yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {projectList.map((project) => (
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

                {[1, 2, 3, 5].includes(phase) && (
                  <p className="metadata">
                    {projectStudents[project._id]?.length ?? 0} students
                  </p>
                )}
              </Card>
            ))}
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
            studentList={projectStudents[selectedProject._id] ?? []}
          />
        </Popup>
      )}

      {editingProject && (
        <Popup
          title="Add Project"
          onClose={() => setEditingProject(false)}
        >
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

