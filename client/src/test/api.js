import { USERS, PROFS, PROJECTS, STUDENTS } from "./data";

const COOKIE_NAME = "pikachu";
const TOKEN_PREFIX = "charizard-";
const COOKIE_MAX_AGE = 14 * 24 * 60 * 60; // 14 days

/*** auth ***/

export const isLoggedIn = () => !!getToken();

export function getToken() {
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) return null;

  try {
    const value = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1));

    if (!value.startsWith(TOKEN_PREFIX)) return null;

    const uname = decodeURIComponent(value.slice(TOKEN_PREFIX.length));

    if (!Object.values(USERS).some((u) => u.uname === uname)) {
      return null;
    }

    return { uname };
  } catch {
    return null;
  }
}

export async function login(uname, pwd) {
  if (!uname || !pwd) {
    throw new Error("Username and password required");
  }

  const account = Object.values(USERS).find((u) => u.uname === uname);

  if (!account || account.pass !== pwd) {
    throw new Error("Invalid username or password");
  }

  const token = `${TOKEN_PREFIX}${encodeURIComponent(uname)}`;

  document.cookie =
    `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; ` +
    `max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;

  return { token };
}

export async function logout() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

/*** crud factory ***/

// TODO(s-mv): add permission clauses

function createCRUD(collection, prefix) {
  return {
    async getAll() {
      return Object.values(collection);
    },

    async get(uname) {
      const record = collection[uname];

      if (!record) throw new Error(`Record not found: ${uname}`);

      return record;
    },

    async add(data) {
      const id = data._id || `${prefix}_${crypto.randomUUID()}`;

      if (collection[id]) {
        throw new Error(`Record already exists: ${id}`);
      }

      const record = { ...data, _id: id };
      collection[id] = record;

      return record;
    },

    async update(id, changes) {
      const existing = collection[id];

      if (!existing) throw new Error(`Record not found: ${id}`);

      const updated = { ...existing, ...changes, _id: id };
      collection[id] = updated;

      return updated;
    },

    async remove(id) {
      const record = collection[id];

      if (!record) throw new Error(`Record not found: ${id}`);

      delete collection[id];
      return record;
    },
  };
}

/*** instantiation ***/

export const students = {
  ...createCRUD(STUDENTS, "student"),
  async getByProject(projectId) {
    return Object.values(STUDENTS).filter(
      (student) => student.final_proj_id == projectId,
    );
  },
};

export const profs = createCRUD(PROFS, "prof");

export const projects = {
  ...createCRUD(PROJECTS, "project"),
  async getByProf(profId) {
    return Object.values(PROJECTS).filter(
      (project) => project.prof_id == profId,
    );
  },
};

export const users = createCRUD(USERS, "user");
