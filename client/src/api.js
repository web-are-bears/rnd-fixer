const PROFS = {
  ash: {
    uname: "ash",
    name: "Prof. Ashutosh Sharma",
    email: "ashutosh@iitb.asc",
    projectList: [
      {
        pname: "JIT Appeaser",
        pdesc: "Pleasure entropy estimation for the JIT.",
        assignees: 2,
      },
    ],
  },
  smv: {
    uname: "smv",
    name: "Prof. Shreerang Vaidya",
    email: "shreerang@iitb.asc",
    projectList: [
      {
        pname: "Data Dependence Graphs",
        pdesc: "Implement formatting guidelines for the project.",
        assignees: 3,
      },
    ],
  },
  swarn: {
    uname: "swarn",
    name: "Prof. Swarnim Chavan",
    email: "swarnim@iiitb.asc",
    projectList: [
      {
        pname: "Pokemon Assembly",
        pdesc: "Propagation of Pokemon through different media.",
        assignees: 2,
      },
    ],
  },
};

const STUDENTS = {
  jp: {
    uname: "26m2198",
    name: "Jay Patel",
    email: "jaypee@student.com",
    stream: "TS",
  },
  od: {
    uname: "26m2199",
    name: "Om Dwivedi",
    email: "od@student.com",
    stream: "CS",
  },
};

const SELECTED = {
  "Data Dependence Graphs": ["od"],
  "Pokemon Assembly": ["jp"],
};

export const isLoggedIn = () =>
  document.cookie.split("; ").some((c) => c.startsWith("token="));

export function getToken() {
  const m = document.cookie.match(/(?:^|; )token=dummy-([^;]+)/);
  if (!m) return null;
  const uname = decodeURIComponent(m[1]);
  return { uname, role: uname in PROFS ? "prof" : "student" };
}

export async function login(uname, pwd) {
  if (!uname || !pwd) throw new Error("Username and password required");
  document.cookie = `token=dummy-${uname}; path=/; max-age=604800`;
  return { token: `dummy-${uname}` };
}

export async function logout() {
  document.cookie = "token=; path=/; max-age=0";
}

export async function profList() {
  return Object.values(PROFS).map(({ uname, name, email }) => ({
    uname,
    name,
    email,
  }));
}

export async function profInfo(uname) {
  const p = PROFS[uname];
  if (!p) throw new Error(`Professor not found (${p})`);
  return { name: p.name, email: p.email, projectList: p.projectList };
}

export async function stList(pname) {
  if (!(pname in SELECTED)) throw new Error(`Project not found (${pname})`);
  return SELECTED[pname].map((u) => {
    const { uname, name, email } = STUDENTS[u];
    return { uname, name, email };
  });
}

export async function stInfo(uname) {
  const s = STUDENTS[uname];
  if (!s) throw new Error(`Student not found (${s})`);
  return { name: s.name, email: s.email, stream: s.stream };
}
