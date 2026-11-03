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

// sighs
function createPersonCRUD(collection, prefix, role) {
  const crud = createCRUD(collection, prefix);

  return {
    ...crud,

    async add(data) {
      const uname = data.uname?.trim();
      const pass = data.pass;

      if (!uname || !pass) {
        throw new Error("Username and password are required.");
      }

      if (collection[uname] || USERS[uname]) {
        throw new Error(`Username already exists: ${uname}`);
      }

      const { pass: _pass, ...profile } = data;

      const account = {
        _id: uname,
        uname,
        pass,
        role,
      };

      USERS[uname] = account;

      try {
        return await crud.add({
          ...profile,
          _id: uname,
          uname,
        });
      } catch (err) {
        delete USERS[uname];
        throw err;
      }
    },

    async update(id, changes) {
      if (changes.uname !== undefined && changes.uname !== id) {
        throw new Error("Usernames cannot be changed.");
      }

      const { pass, ...profileChanges } = changes;
      const updated = await crud.update(id, profileChanges);

      if (pass) {
        if (!USERS[id]) {
          throw new Error(`Login account not found: ${id}`);
        }

        USERS[id] = { ...USERS[id], pass };
      }

      return updated;
    },

    async remove(id) {
      if (role === "prof") {
        const hasProjects = Object.values(PROJECTS).some(
          (project) => project.prof_id === id,
        );

        if (hasProjects) {
          throw new Error("Cannot delete a professor who still has projects.");
        }
      }

      const removed = await crud.remove(id);
      delete USERS[id];

      return removed;
    },
  };
}

/*** instantiation ***/

export const students = {
  ...createPersonCRUD(STUDENTS, "student", "student"),

  getByProject(projectID) {
    return Object.values(STUDENTS).filter(
      (student) => student.final_proj_id === projectID,
    );
  },

  async allocateTokens(uname, token_dist) {
    const student = STUDENTS[uname];

    if (!student) {
      throw new Error("Student not found.");
    }

    const normalized = {};

    for (const [projectID, amount] of Object.entries(token_dist)) {
      const tokens = Number(amount);

      if (!PROJECTS[projectID]) {
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
  ...createCRUD(PROJECTS, "project"),

  async getByProf(profID) {
    return Object.values(PROJECTS).filter(
      (project) => project.prof_id == profID,
    );
  },
};

export const profs = createPersonCRUD(PROFS, "prof", "prof");

export const users = createCRUD(USERS, "user");

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
