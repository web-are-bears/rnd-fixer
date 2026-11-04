import { USERS, PROFS, PROJECTS, STUDENTS, PHASE } from "./data";

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

    if (!USERS.some((u) => u.uname === uname)) {
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

  const account = USERS.find((u) => u.uname === uname);

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

function createCRUD(collection, prefix, key = "uname") {
  return {
    async getAll() {
      return collection;
    },

    async get(id) {
      const record = collection.find((item) => item[key] === id);

      if (!record) throw new Error(`Record not found: ${id}`);

      return record;
    },

    async add(data) {
      const id = data[key] || `${prefix}_${crypto.randomUUID()}`;

      if (collection.some((item) => item[key] === id)) {
        throw new Error(`Record already exists: ${id}`);
      }

      const record = { ...data, [key]: id };
      collection.push(record);

      return record;
    },

    async update(id, changes) {
      const index = collection.findIndex((item) => item[key] === id);

      if (index === -1) throw new Error(`Record not found: ${id}`);

      const updated = { ...collection[index], ...changes, [key]: id };
      collection[index] = updated;

      return updated;
    },

    async remove(id) {
      const index = collection.findIndex((item) => item[key] === id);

      if (index === -1) throw new Error(`Record not found: ${id}`);

      return collection.splice(index, 1)[0];
    },
  };
}

/*** instantiation ***/

export const students = {
  ...createCRUD(STUDENTS, "student"),

  getByProject(projectID) {
    return STUDENTS.filter((student) => student.final_proj_id === projectID);
  },

  async allocateTokens(uname, token_dist) {
    const student = STUDENTS.find((s) => s.uname === uname);

    if (!student) {
      throw new Error("Student not found.");
    }

    const normalized = {};

    for (const [projectID, amount] of Object.entries(token_dist)) {
      const tokens = Number(amount);

      if (!PROJECTS.some((p) => p._id === projectID)) {
        throw new Error(`Unknown project: ${projectID}`);
      }

      if (!Number.isInteger(tokens) || tokens < 0) {
        throw new Error("Tokens must be non-negative integers.");
      }

      if (tokens > 0) normalized[projectID] = tokens;
    }

    const total = Object.values(normalized).reduce(
      (sum, tokens) => sum + tokens,
      0,
    );

    if (total > 100) {
      throw new Error("You cannot allocate more than 100 tokens.");
    }

    return this.update(uname, { token_dist: normalized });
  },
};

export const projects = {
  ...createCRUD(PROJECTS, "project", "_id"),

  async getByProf(prof_uname) {
    return PROJECTS.filter((project) => project.prof_uname === prof_uname);
  },
};

export const profs = createCRUD(PROFS, "prof");
export const users = createCRUD(USERS, "user");
export const admins = createCRUD(USERS, "admin");

export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  return users.get(token.uname);
}

/*** terribly terrible PHASE APIs ***/

export const getPhase = async () => {
  return PHASE;
};

export const setPhase = async (n) => {
  PHASE = n;
};
