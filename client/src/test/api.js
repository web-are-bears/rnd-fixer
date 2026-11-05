import { USERS, PROFS, PROJECTS, STUDENTS, ADMINS, PHASE } from "./data";

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

  if (!account || !account.pass || account.pass !== pwd) {
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

/*** generic CRUD ***/

function createCRUD(collection, prefix, key = "uname") {
  return {
    async getAll() {
      return collection;
    },

    async get(id) {
      const record = collection.find((item) => item[key] === id);

      if (!record) {
        throw new Error(`Record not found: ${id}`);
      }

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

      if (index === -1) {
        throw new Error(`Record not found: ${id}`);
      }

      const updated = { ...collection[index], ...changes, [key]: id };
      collection[index] = updated;

      return updated;
    },

    async remove(id) {
      const index = collection.findIndex((item) => item[key] === id);

      if (index === -1) {
        throw new Error(`Record not found: ${id}`);
      }

      return collection.splice(index, 1)[0];
    },
  };
}

/*** accounts ***/

const userCRUD = createCRUD(USERS, "user");

export const users = {
  getAll: userCRUD.getAll,
  get: userCRUD.get,

  async add(data) {
    const uname = data.uname?.trim();
    const role = data.role?.toLowerCase();

    if (!uname) {
      throw new Error("Username is required.");
    }

    if (!["student", "prof", "admin"].includes(role)) {
      throw new Error("Invalid user role.");
    }

    if (USERS.some((user) => user.uname === uname)) {
      throw new Error(`Username already exists: ${uname}`);
    }

    const account = {
      _id: uname,
      uname,
      role,
      pass: null, // this is deliberate
    };

    USERS.push(account);

    return account;
  },

  async update(uname, changes) {
    if (
      changes.uname !== undefined ||
      changes._id !== undefined ||
      changes.role !== undefined
    ) {
      throw new Error("Username and role cannot be changed.");
    }

    const account = await userCRUD.get(uname);

    return userCRUD.update(uname, {
      pass: changes.pass ?? account.pass,
    });
  },

  async remove(uname) {
    const account = await userCRUD.get(uname);
    const role = account.role?.toLowerCase();

    const profileCollections = {
      student: STUDENTS,
      prof: PROFS,
      admin: ADMINS,
    };

    if (profileCollections[role]?.some((profile) => profile.uname === uname)) {
      throw new Error(
        "Cannot delete an account while its profile still exists.",
      );
    }

    if (
      role === "prof" &&
      PROJECTS.some((project) => project.prof_uname === uname)
    ) {
      throw new Error(
        "Cannot delete a professor account while they still have projects.",
      );
    }

    return userCRUD.remove(uname);
  },
};

/*** profiles ***/

function createProfileCRUD(collection, prefix, role) {
  const crud = createCRUD(collection, prefix);

  return {
    getAll: crud.getAll,
    get: crud.get,

    async add(data) {
      const uname = data.uname?.trim();

      if (!uname) {
        throw new Error("Username is required.");
      }

      const account = USERS.find((user) => user.uname === uname);

      if (!account) {
        throw new Error(`No login account exists for: ${uname}`);
      }

      if (account.role?.toLowerCase() !== role) {
        throw new Error(`Account ${uname} does not have the ${role} role.`);
      }

      if (collection.some((profile) => profile.uname === uname)) {
        throw new Error(`Profile already exists: ${uname}`);
      }

      return crud.add({
        ...data,
        _id: uname,
        uname,
      });
    },

    async update(uname, changes) {
      if (changes.uname !== undefined && changes.uname !== uname) {
        throw new Error("Usernames cannot be changed.");
      }

      if (changes._id !== undefined && changes._id !== uname) {
        throw new Error("Profile IDs cannot be changed.");
      }

      return crud.update(uname, changes);
    },

    async remove(uname) {
      if (role === "prof") {
        const hasProjects = PROJECTS.some(
          (project) => project.prof_uname === uname,
        );

        if (hasProjects) {
          throw new Error("Cannot delete a professor who still has projects.");
        }
      }

      return crud.remove(uname);
    },
  };
}

export const students = {
  ...createProfileCRUD(STUDENTS, "student", "student"),

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

      if (tokens > 0) {
        normalized[projectID] = tokens;
      }
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

export const profs = createProfileCRUD(PROFS, "prof", "prof");

export const admins = createProfileCRUD(ADMINS, "admin", "admin");

/*** projects ***/

export const projects = {
  ...createCRUD(PROJECTS, "project", "_id"),

  async getByProf(prof_uname) {
    return PROJECTS.filter((project) => project.prof_uname === prof_uname);
  },
};

/*** current user ***/

export async function getCurrentUser() {
  const token = getToken();

  if (!token) return null;

  return users.get(token.uname);
}

/*** phase APIs ***/

// Keep the current phase locally in this module.
// See note below about synchronizing this with data.js.

let currentPhase = PHASE;

export const getPhase = async () => currentPhase;

export const setPhase = async (n) => {
  if (!Number.isInteger(n) || n < 0 || n > 4) {
    throw new Error("Invalid phase.");
  }

  currentPhase = n;
  return currentPhase;
};
