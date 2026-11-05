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

    if (!USERS.some((u) => u.uname == uname)) {
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

  const account = USERS.find((u) => u.uname == uname);

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

/*** accounts ***/

export const users = {
  async getAll() {
    return USERS;
  },

  async get(uname) {
    const account = USERS.find((user) => user.uname == uname);

    if (!account) {
      throw new Error(`Record not found: ${uname}`);
    }

    return account;
  },

  async add(data) {
    const uname = data.uname || `user_${crypto.randomUUID()}`;

    if (USERS.some((user) => user.uname == uname)) {
      throw new Error(`Record already exists: ${uname}`);
    }

    const account = { ...data, uname };
    USERS.push(account);

    return account;
  },

  async update(uname, changes) {
    const index = USERS.findIndex((user) => user.uname == uname);

    if (index == -1) {
      throw new Error(`Record not found: ${uname}`);
    }

    const updated = { ...USERS[index], ...changes, uname };
    USERS[index] = updated;

    return updated;
  },

  async remove(uname) {
    const index = USERS.findIndex((user) => user.uname == uname);

    if (index == -1) {
      throw new Error(`Record not found: ${uname}`);
    }

    return USERS.splice(index, 1)[0];
  },
};

/*** profiles ***/

// crud factory
function createCRUD(collection, role) {
  return {
    async getAll() {
      return collection;
    },

    async get(uname) {
      const profile = collection.find((item) => item.uname == uname);

      if (!profile) {
        throw new Error(`Record not found: ${uname}`);
      }

      return profile;
    },

    async add(data) {
      const uname = data.uname?.trim();

      if (!uname) {
        throw new Error("Username is required.");
      }

      const account = USERS.find((user) => user.uname == uname);

      if (!account) {
        throw new Error(`No login account exists for: ${uname}`);
      }

      if (account.role?.toLowerCase() !== role) {
        throw new Error(`Account ${uname} does not have the ${role} role.`);
      }

      if (collection.some((profile) => profile.uname == uname)) {
        throw new Error(`Profile already exists: ${uname}`);
      }

      const profile = {
        ...data,
        _id: uname,
        uname,
      };

      collection.push(profile);

      return profile;
    },

    async update(uname, changes) {
      if (changes.uname !== undefined && changes.uname !== uname) {
        throw new Error("Usernames cannot be changed.");
      }

      if (changes._id !== undefined && changes._id !== uname) {
        throw new Error("Profile IDs cannot be changed.");
      }

      const index = collection.findIndex((profile) => profile.uname == uname);

      if (index == -1) {
        throw new Error(`Record not found: ${uname}`);
      }

      const updated = { ...collection[index], ...changes, uname, _id: uname };
      collection[index] = updated;

      return updated;
    },

    async remove(uname) {
      if (!collection.some((profile) => profile.uname == uname)) {
        throw new Error(`Record not found: ${uname}`);
      }

      if (
        role == "prof" &&
        PROJECTS.some((project) => project.prof_uname == uname)
      ) {
        throw new Error("Cannot delete a professor who still has projects.");
      }

      const index = collection.findIndex((profile) => profile.uname == uname);

      return collection.splice(index, 1)[0];
    },
  };
}

export const students = {
  ...createCRUD(STUDENTS, "student"),

  getByProject(projectID) {
    return STUDENTS.filter((student) => student.final_proj_id == projectID);
  },

  async allocateTokens(uname, token_dist) {
    const student = STUDENTS.find((s) => s.uname == uname);

    if (!student) {
      throw new Error("Student not found.");
    }

    const normalized = {};

    for (const [projectID, amount] of Object.entries(token_dist)) {
      const tokens = Number(amount);

      if (!PROJECTS.some((p) => p._id == projectID)) {
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

export const profs = createCRUD(PROFS, "prof");

export const admins = createCRUD(ADMINS, "admin");

/*** projects ***/

export const projects = {
  async getAll() {
    return PROJECTS;
  },

  async get(id) {
    const project = PROJECTS.find((item) => item._id == id);

    if (!project) {
      throw new Error(`Record not found: ${id}`);
    }

    return project;
  },

  async add(data) {
    const id = data._id || `project_${crypto.randomUUID()}`;

    if (PROJECTS.some((project) => project._id == id)) {
      throw new Error(`Record already exists: ${id}`);
    }

    const project = { ...data, _id: id };
    PROJECTS.push(project);

    return project;
  },

  async update(id, changes) {
    const index = PROJECTS.findIndex((project) => project._id == id);

    if (index == -1) {
      throw new Error(`Record not found: ${id}`);
    }

    const updated = { ...PROJECTS[index], ...changes, _id: id };
    PROJECTS[index] = updated;

    return updated;
  },

  async remove(id) {
    const index = PROJECTS.findIndex((project) => project._id == id);

    if (index == -1) {
      throw new Error(`Record not found: ${id}`);
    }

    return PROJECTS.splice(index, 1)[0];
  },

  async getByProf(prof_uname) {
    return PROJECTS.filter((project) => project.prof_uname == prof_uname);
  },
};

/*** current user ***/

export async function getCurrentUser() {
  const token = getToken();

  if (!token) return null;

  return users.get(token.uname);
}

/*** terribly terrible PHASE APIs ***/

let currentPhase = PHASE;

export const getPhase = async () => {
  return currentPhase;
};

export const setPhase = async (n) => {
  if (!Number.isInteger(n) || n < 0 || n > 4) {
    throw new Error("Invalid phase.");
  }

  currentPhase = n;
  return currentPhase;
};
