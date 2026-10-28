import { useEffect, useState } from "react";
import { getToken, profList, profInfo, stList, stInfo } from "../test/api";
import Modal from "../components/Popup";
import Card from "../components/Card";

/* TODO(s-mv): make components for the error message and loading panel */

const Loading = () => <p className="label">Loading…</p>;

function ErrorMessage({ message }) {
  return <p className="text-sm text-red-700">{message}</p>;
}

function isRoleMismatch(error) {
  return (
    error?.status === 403 ||
    error?.code === "ROLE_MISMATCH" ||
    error?.message === "Forbidden: insufficient role"
  );
}

function ProfDetail({ uname }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    profInfo(uname)
      .then((result) => {
        if (active) setInfo(result);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load professor.");
      });

    return () => {
      active = false;
    };
  }, [uname]);

  if (error) return <ErrorMessage message={error} />;
  if (!info) return <Loading />;

  return (
    <>
      <p className="mb-4 text-sm text-ink-soft">{info.email}</p>
      <h4 className="label mb-2">Projects</h4>

      <ul className="space-y-3">
        {info.projectList.map((project) => (
          <li key={project._id}>
            <Card>
              <div className="font-bold">{project.pname}</div>
              <div className="text-sm text-ink-soft">{project.desc}</div>
            </Card>
          </li>
        ))}

        {info.projectList.length === 0 && (
          <li className="italic text-ink-soft">No projects.</li>
        )}
      </ul>
    </>
  );
}

function StudentDashboard() {
  const [profs, setProfs] = useState(null);
  const [sel, setSel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    profList()
      .then((result) => {
        if (active) setProfs(result);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load professors.");
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!profs) return <Loading />;

  return (
    <>
      <h2 className="heading mb-6 text-3xl">Professors</h2>

      <div className="grid gap-5">
        {profs.map((prof) => (
          <Card
            key={prof.uname}
            onClick={() => setSel(prof)}
            className="cursor-pointer hover:bg-paper"
          >
            <div className="font-bold">{prof.name}</div>
            <div className="text-sm text-ink-soft">{prof.email}</div>
          </Card>
        ))}
      </div>

      {sel && (
        <Modal title={sel.name} onClose={() => setSel(null)}>
          <ProfDetail uname={sel.uname} />
        </Modal>
      )}
    </>
  );
}

function ProjectDetail({ project }) {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    stList(project._id)
      .then((result) => {
        if (active) setStudents(result);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load students.");
      });

    return () => {
      active = false;
    };
  }, [project._id]);

  return (
    <>
      <p className="mb-4 text-sm text-ink-soft">{project.desc}</p>
      <h4 className="label mb-2">Selected students</h4>

      {error ? (
        <ErrorMessage message={error} />
      ) : !students ? (
        <Loading />
      ) : students.length === 0 ? (
        <p className="italic text-ink-soft">None yet.</p>
      ) : (
        <ul className="space-y-3">
          {students.map((student) => (
            <li key={student._id}>
              <Card>
                <div className="font-bold">{student.name}</div>
                <div className="text-sm text-ink-soft">{student.email}</div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ProfDashboard({ uname }) {
  const [info, setInfo] = useState(null);
  const [sel, setSel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    profInfo(uname)
      .then((result) => {
        if (active) setInfo(result);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load your projects.");
      });

    return () => {
      active = false;
    };
  }, [uname]);

  if (error) return <ErrorMessage message={error} />;
  if (!info) return <Loading />;

  return (
    <>
      <h2 className="heading mb-6 text-3xl">Your projects</h2>

      <div className="grid gap-5">
        {info.projectList.map((project) => (
          <Card key={project._id} onClick={() => setSel(project)}>
            <div className="font-bold">{project.pname}</div>
            <span className="badge mt-2">{project.assignees} assigned</span>
          </Card>
        ))}

        {info.projectList.length === 0 && (
          <p className="italic text-ink-soft">You have no projects yet.</p>
        )}
      </div>

      {sel && (
        <Modal title={sel.pname} onClose={() => setSel(null)}>
          <ProjectDetail project={sel} />
        </Modal>
      )}
    </>
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
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function identifyAccount() {
      const token = getToken();

      if (!token) {
        if (active) setError("You are not logged in. Please log in again.");
        return;
      }

      if (active) setAccount(token);

      // Check whether the account exists in the professor collection.
      try {
        await profInfo(token.uname);
        if (active) setRole("prof");
        return;
      } catch (err) {
        // Only continue if the professor record wasn't found.
        if (!err.message?.startsWith("Professor not found")) {
          if (active) setError(err.message || "Unable to identify account.");
          return;
        }
      }

      // Otherwise, check whether it exists in the student collection.
      try {
        await stInfo(token.uname);
        if (active) setRole("student");
        return;
      } catch (err) {
        if (!err.message?.startsWith("Student not found")) {
          if (active) setError(err.message || "Unable to identify account.");
          return;
        }
      }

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

  if (role === "prof") {
    return <ProfDashboard uname={account.uname} />;
  }

  if (role === "student") {
    return <StudentDashboard />;
  }

  if (role === "admin") {
    return <AdminDashboard />;
  }

  return <ErrorMessage message="Unsupported account role." />;
}
