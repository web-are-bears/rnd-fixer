import { useEffect, useState } from "react";
import { getToken, profList, profInfo, stList } from "../api";
import Modal from "../components/Popup";

const Loading = () => <p className="label">Loading…</p>;

function ProfDetail({ uname }) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    profInfo(uname).then(setInfo);
  }, [uname]);

  if (!info) return <Loading />;
  return (
    <>
      <p className="mb-4 text-sm text-ink-soft">{info.email}</p>
      <h4 className="label mb-2">Projects</h4>
      <ul className="space-y-3">
        {info.projectList.map((p) => (
          <li key={p.pname} className="tile">
            <div className="font-bold">{p.pname}</div>
            <div className="text-sm text-ink-soft">{p.pdesc}</div>
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
  useEffect(() => {
    profList().then(setProfs);
  }, []);

  if (!profs) return <Loading />;
  return (
    <>
      <h2 className="heading mb-6 text-3xl">Professors</h2>
      <div className="grid gap-5">
        {profs.map((p) => (
          <button key={p.uname} className="card" onClick={() => setSel(p)}>
            <div className="font-bold">{p.name}</div>
            <div className="text-sm text-ink-soft">{p.email}</div>
          </button>
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
  useEffect(() => {
    stList(project.pname).then(setStudents);
  }, [project.pname]);

  return (
    <>
      <p className="mb-4 text-sm text-ink-soft">{project.pdesc}</p>
      <h4 className="label mb-2">Selected students</h4>
      {!students ? (
        <Loading />
      ) : students.length === 0 ? (
        <p className="italic text-ink-soft">None yet.</p>
      ) : (
        <ul className="space-y-3">
          {students.map((s) => (
            <li key={s.uname} className="tile">
              <div className="font-bold">{s.name}</div>
              <div className="text-sm text-ink-soft">{s.email}</div>
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
  useEffect(() => {
    profInfo(uname).then(setInfo);
  }, [uname]);

  if (!info) return <Loading />;
  return (
    <>
      <h2 className="heading mb-6 text-3xl">Your projects</h2>
      <div className="grid gap-5">
        {info.projectList.map((p) => (
          <button key={p.pname} className="card" onClick={() => setSel(p)}>
            <div className="font-bold">{p.pname}</div>
            <span className="badge mt-2">{p.assignees} assigned</span>
          </button>
        ))}
      </div>
      {sel && (
        <Modal title={sel.pname} onClose={() => setSel(null)}>
          <ProjectDetail project={sel} />
        </Modal>
      )}
    </>
  );
}

export default function Dashboard() {
  const token = getToken();
  return token.role === "prof" ? (
    <ProfDashboard uname={token.uname} />
  ) : (
    <StudentDashboard />
  );
}
