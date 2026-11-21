/*
 * production API
 *
 * DO use this, if you can :)
 *
 * AI disclosure: bug fixing and some refactoring (I have a headache now)
 */

const BASE_URL = "http://localhost:8000";
const PIKACHU_NAME = "pikachu"; // cookie name

function getRawToken() {
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${PIKACHU_NAME}=`));
  return cookie
    ? decodeURIComponent(cookie.slice(PIKACHU_NAME.length + 1))
    : null;
}

async function call(method, path, { body, query, auth = true } = {}) {
  const headers = {};

  if (auth) {
    const token = getRawToken();
    if (!token) throw new Error("Not logged in");
    headers.Authorization = `Bearer ${token}`;
  }

  if (body) headers["Content-Type"] = "application/json";

  let url = BASE_URL + path;
  if (query) url += "?" + new URLSearchParams(query);

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && auth) await logout(); // token expired D:
    throw new Error(data.message || `${data.code || "Error"} (${res.status})`);
  }

  return data;
}

export const isLoggedIn = () => !!getToken();

export function getToken() {
  const raw = getRawToken();
  if (!raw) return null;

  try {
    const payload = JSON.parse(
      atob(raw.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (payload.exp * 1000 < Date.now()) return null; // expired
    return { uname: payload.username ?? payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export async function login(uname, pwd) {
  if (!uname || !pwd) throw new Error("Username and password required");

  const data = await call("POST", "/v1/auth/login", {
    auth: false,
    body: { username: uname, password: pwd },
  });

  document.cookie =
    `${PIKACHU_NAME}=${encodeURIComponent(data.access_token)}; path=/; ` +
    `max-age=${15 * 60}; SameSite=Lax`;

  return { token: data.access_token };
}

export async function logout() {
  document.cookie = `${PIKACHU_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export async function register(username, password, role) {
  return call("POST", "/v1/auth/register", {
    auth: false,
    body: { username, password, role },
  });
}

export async function getCurrentUser() {
  return getToken();
}

/*** some helpers to get backend <-> frontend stuff ***/

// this has been refacted by AI to some extent

function toProject(p) {
  return {
    _id: p.proj_id,
    proj_name: p.proj_name,
    prof_uname: p.prof_username,
    description: p.description,
    max_occupancy: p.max_occupancy,
    token_dist: p.token_distribution || {},
  };
}

function toProf(p) {
  return { ...p, _id: p.prof_username, uname: p.prof_username };
}

function toStudent(s) {
  const { token_distribution, ...rest } = s;
  return {
    ...rest,
    _id: s.stud_username,
    uname: s.stud_username,
    token_dist: token_distribution || {},
  };
}

/*** projects ***/

export const projects = {
  async getAll() {
    const res = await call("GET", "/v1/core/projects");
    return res.projects.map(toProject);
  },

  async get(id) {
    return toProject(
      await call("GET", `/v1/core/projects/${encodeURIComponent(id)}`),
    );
  },

  async getByProf(prof_uname) {
    const res = await call(
      "GET",
      `/v1/core/projects/prof/${encodeURIComponent(prof_uname)}`,
    );
    return res.projects.map(toProject);
  },

  async add(data) {
    const res = await call(
      "POST",
      `/v1/core/projects/${encodeURIComponent(data.prof_uname)}`,
      {
        body: {
          proj_name: data.proj_name,
          description: data.description,
          max_occupancy: data.max_occupancy,
        },
      },
    );
    return projects.get(res.proj_id);
  },

  async setToken(projectID, stud_username, token) {
    await call(
      "POST",
      `/v1/core/projects/tokens/${encodeURIComponent(projectID)}`,
      {
        body: { stud_username, token },
      },
    );
  },

  async removeToken(projectID, stud_username) {
    await call(
      "DELETE",
      `/v1/core/projects/tokens/${encodeURIComponent(projectID)}`,
      {
        query: { stud_username },
      },
    );
  },
};

/*** professors ***/

export const profs = {
  async getAll() {
    const res = await call("GET", "/v1/core/professors");
    return res.profs.map(toProf);
  },

  async get(uname) {
    return toProf(
      await call("GET", `/v1/core/professors/${encodeURIComponent(uname)}`),
    );
  },

  async add(data) {
    await call("POST", "/v1/core/professors", {
      body: {
        prof_username: data.uname,
        prof_name: data.prof_name,
        email: data.email,
        about: data.about,
        link: data.link,
      },
    });
    return profs.get(data.uname);
  },

  async update(uname, changes) {
    await call(
      "POST",
      `/v1/core/professors/edit/${encodeURIComponent(uname)}`,
      {
        body: {
          prof_name: changes.prof_name,
          email: changes.email,
          about: changes.about,
          link: changes.link,
        },
      },
    );
    return profs.get(uname);
  },
};

/*** students ***/

export const students = {
  async getAll() {
    const res = await call("GET", "/v1/core/students");
    return res.students.map(toStudent);
  },

  async get(uname) {
    return toStudent(
      await call("GET", `/v1/core/students/${encodeURIComponent(uname)}`),
    );
  },

  async getByProject(projectID) {
    const all = await students.getAll();
    return all.filter((s) => s.final_proj_id == projectID);
  },

  async add(data) {
    await call("POST", "/v1/core/students", {
      body: {
        stud_username: data.uname,
        stud_name: data.stud_name,
        email: data.email,
        about: data.about,
        link: data.link,
        final_proj_id: data.final_proj_id,
      },
    });
    return students.get(data.uname);
  },

  async update(uname, changes) {
    await call("POST", `/v1/core/students/edit/${encodeURIComponent(uname)}`, {
      body: {
        stud_name: changes.stud_name,
        email: changes.email,
        about: changes.about,
        link: changes.link,
      },
    });
    return students.get(uname);
  },

  async allocateTokens(uname, token_dist) {
    let total = 0;
    for (const n of Object.values(token_dist)) {
      if (!Number.isInteger(n) || n < 0) {
        throw new Error("Tokens must be non-negative integers.");
      }
      total += n;
    }
    if (total > 100)
      throw new Error("You cannot allocate more than 100 tokens.");

    const current = (await students.get(uname)).token_dist;

    for (const [projectID, n] of Object.entries(token_dist)) {
      if (n > 0) {
        await call(
          "POST",
          `/v1/core/students/tokens/${encodeURIComponent(uname)}`,
          {
            body: { proj_id: projectID, token: n },
          },
        );
        await projects.setToken(projectID, uname, n);
      } else if (projectID in current) {
        await removeBoth(uname, projectID);
      }
    }

    for (const projectID of Object.keys(current)) {
      if (!(projectID in token_dist)) await removeBoth(uname, projectID);
    }

    return students.get(uname);
  },
};

async function removeBoth(uname, projectID) {
  await call(
    "DELETE",
    `/v1/core/students/tokens/${encodeURIComponent(uname)}`,
    {
      query: { proj_id: projectID },
    },
  );

  await projects.removeToken(projectID, uname).catch(() => { }); // khatam
}
