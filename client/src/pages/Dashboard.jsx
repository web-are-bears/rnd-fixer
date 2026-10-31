import { useEffect, useState } from "react";
import { getToken, profs, projects, students, users } from "../test/api";
import Card from "../components/Card";
import Modal from "../components/Popup";

function Loading() {
  return <p className="text-sm text-ink-soft">Loading...</p>;
}

function ErrorMessage({ message }) {
  return (
    <p className="text-sm font-bold text-red-700" role="alert">
      {message}
    </p>
  );
}

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

function StudentDashboard({ uname }) {
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
        <Modal
          title={selectedProf.name}
          onClose={() => setSelectedProf(null)}
        >
          <ProfDetail uname={selectedProf.uname} />
        </Modal>
      )}
    </div>
  );
}

function ProjectDetail({ projectId }) {
  const [info, setInfo] = useState(null);
  const [studentList, setStudentList] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [project, studentList] = await Promise.all([
          projects.get(projectId),
          students.getByProject(projectId),
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
  }, [projectId]);

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

function ProfDashboard({ uname }) {
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
        <Modal
          title={selectedProject.pname}
          onClose={() => setSelectedProject(null)}
        >
          <ProjectDetail projectId={selectedProject._id} />
        </Modal>
      )}
    </div>
  );
}

function AdminDashboard() {
  return (
    <>
      <h2 className="heading mb-6 text-3xl">Admin</h2>
      <p className="text-sm text-ink-soft">
        The admin dashboard hasn't been implemented yet.
      </p>
    </>
  );
}

export default function Dashboard() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function identifyAccount() {
      const token = getToken();

      if (!token) {
        if (active) {
          setError("You are not logged in. Please log in again.");
        }
        return;
      }

      if (active) setAccount(token);

      try {
        await profs.get(token.uname);
        if (active) setRole("prof");
        return;
      } catch { }

      try {
        await students.get(token.uname);
        if (active) setRole("student");
        return;
      } catch { }

      try {
        const user = await users.get(token.uname);

        if (active && user.role === "admin") {
          setRole("admin");
          return;
        }
      } catch { }

      if (active) {
        setError("Your account does not match a supported dashboard role.");
      }
    }

    identifyAccount();

    return () => {
      active = false;
    };
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!account || !role) return <Loading />;

  switch (role) {
    case "prof":
      return <ProfDashboard uname={account.uname} />;
    case "student":
      return <StudentDashboard uname={account.uname} />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <ErrorMessage message="Unsupported account role." />;
  }
}
