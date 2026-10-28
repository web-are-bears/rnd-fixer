import { USERS, ADMINS, PROFS, PROJECTS, STUDENTS } from "./data";

const COOKIE_NAME = "pikachu";
const TOKEN_PREFIX = "charizard-";
const COOKIE_MAX_AGE = 14 * 24 * 60 * 60; // 14 days

/* TODO(s-mv): dummy error handling */

export const isLoggedIn = () =>
  document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

export function getToken() {
  const escapedName = COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapedName}=([^;]*)`),
  );

  if (!match) return null;

  try {
    const value = decodeURIComponent(match[1]);

    if (!value.startsWith(TOKEN_PREFIX)) return null;

    const uname = decodeURIComponent(value.slice(TOKEN_PREFIX.length));
    const account = Object.values(USERS).find((u) => u.uname === uname);

    if (!account) return null;

    return { uname };
  } catch {
    return null;
  }
}

export async function login(uname, pwd) {
  if (!uname || !pwd) throw new Error("Username and password required");

  const account = Object.values(USERS).find((u) => u.uname === uname);

  if (!account || account.pass !== pwd)
    throw new Error("Invalid username or password");

  const token = `${TOKEN_PREFIX}${encodeURIComponent(uname)}`;

  document.cookie =
    `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; ` +
    `max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;

  return { token };
}

export async function logout() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export async function profList() {
  return Object.values(PROFS).map(({ _id, uname, name, email }) => ({
    _id,
    uname,
    name,
    email,
  }));
}

export async function profInfo(uname) {
  const prof = Object.values(PROFS).find(
    (p) => p.uname === uname || p._id === uname,
  );

  if (!prof) throw new Error(`Professor not found (${uname})`);

  const projectList = Object.values(PROJECTS)
    .filter((project) => project.prof_id === prof._id)
    .map((project) => ({
      ...project,
      assignees: Object.values(STUDENTS).filter(
        (student) => student.final_proj_id === project._id,
      ).length,
    }));

  return { ...prof, projectList };
}

export async function stList(pname) {
  const project = Object.values(PROJECTS).find(
    (p) => p.pname === pname || p._id === pname,
  );

  if (!project) throw new Error(`Project not found (${pname})`);

  return Object.values(STUDENTS)
    .filter((student) => student.final_proj_id === project._id)
    .map(({ _id, uname, name, email }) => ({ _id, uname, name, email }));
}

export async function stInfo(uname) {
  const student = Object.values(STUDENTS).find(
    (s) => s.uname === uname || s._id === uname,
  );

  if (!student) throw new Error(`Student not found (${uname})`);

  return { ...student };
}
