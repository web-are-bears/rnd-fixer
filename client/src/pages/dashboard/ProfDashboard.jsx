import { useEffect, useState } from "react";
import { ErrorMessage, Loading } from "@/components/Extras";
import Card from "@/components/Card";
import Popup from "@/components/Popup";
import { profs, projects, students } from "@/test/api";

/*
 * PHASE 0 - prof should be able to see student list, their own projects,
 *    and also add/remove/modify projects. maybe we need a EdiTable component
 *    (pun intended)
 * PHASE 1 - prof should NOT be able to remove projects, only add them.
 * PHASE 2 - prof should be able to see a list of students who have given
 *    projects tokens. per project the prof would get 100 tokens so depending
 *    on the sum of token_dist in that project, they can assign tokens to
 *    students
 * PHASE 3 - prof should be able to navigate but they cannot modify their
 *    distribution in this phase
 * PHASE 4 - prof should be able to see final assignments. we could add a
 *    report/ticket system to admin later for this phase's "corrections" part
 */

function ProjectDetail({ projectID }) {
  const [info, setInfo] = useState(null);
  const [studentList, setStudentList] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [project, studentList] = await Promise.all([
          projects.get(projectID),
          students.getByProject(projectID),
        ]);

        if (active) {
          setInfo(project);
          setStudentList(studentList);
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to load project.");
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [projectID]);

  if (error) return <ErrorMessage message={error} />;
  if (!info || !studentList) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading text-3xl">{info.pname}</h2>
        <p className="mt-2">{info.desc}</p>
        <p className="mt-2 text-sm text-ink-soft">
          Maximum students: {info.max_students}
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="heading text-xl">Assigned Students</h3>

        {studentList.length === 0 ? (
          <p className="text-sm text-ink-soft">No students assigned.</p>
        ) : (
          studentList.map((student) => (
            <Card key={student._id}>
              <h4 className="font-bold">{student.name}</h4>
              <p className="text-sm text-ink-soft">{student.uname}</p>
              <p className="text-sm">{student.email}</p>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}

export default function ProfDashboard({ uname }) {
  const [info, setInfo] = useState(null);
  const [projectList, setProjectList] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const prof = await profs.get(uname);
        if (active) setInfo(prof);
      } catch (err) {
        if (active) setError(err.message || "Failed to load professor.");
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [uname]);

  useEffect(() => {
    if (!info) return;

    let active = true;

    async function load() {
      try {
        const result = await projects.getByProf(info._id);

        const withAssignees = await Promise.all(
          result.map(async (project) => ({
            ...project,
            assignees: (await students.getByProject(project._id)).length,
          })),
        );

        if (active) setProjectList(withAssignees);
      } catch (err) {
        if (active) setError(err.message || "Failed to load projects.");
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [info]);

  if (error) return <ErrorMessage message={error} />;
  if (!info || !projectList) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading text-3xl">{info.name}</h2>
        <p className="text-sm text-ink-soft">{info.email}</p>
        {info.about && <p className="mt-3">{info.about}</p>}
      </div>

      <section className="space-y-3">
        <h3 className="heading text-xl">Your Projects</h3>

        {projectList.length === 0 ? (
          <p className="text-sm text-ink-soft">You have no projects yet.</p>
        ) : (
          projectList.map((project) => (
            <Card
              key={project._id}
              onClick={() => setSelectedProject(project)}
              className="cursor-pointer hover:bg-butter"
            >
              <h4 className="font-bold">{project.pname}</h4>
              <p className="mt-1 text-sm">{project.desc}</p>
              <p className="mt-2 text-xs text-ink-soft">
                <span className="badge">
                  {project.assignees} / {project.max_students} students
                </span>
              </p>
            </Card>
          ))
        )}
      </section>

      {selectedProject && (
        <Popup
          title={selectedProject.pname}
          onClose={() => setSelectedProject(null)}
        >
          <ProjectDetail projectID={selectedProject._id} />
        </Popup>
      )}
    </div>
  );
}
