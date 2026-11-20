import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { profs, projects, students, getPhase } from "@/api";
import { ErrorMessage, Loading } from "@/components/Extras";
import Card from "@/components/Card";
import Popup from "@/components/Popup";

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
          <Link to="/projects" className="text-sm font-bold">
            View all projects
          </Link>
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
    </div>
  );
}
