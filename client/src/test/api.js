// hardcoding this for now
const HOSTURL = "http://localhost:4321";

/*** helpers and stuff ***/

async function api(path, options = {}) {
  const response = await fetch(`${HOSTURL}/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return data;
}

const get = (path) => api(path);

const post = (path, data) =>
  api(path, {
    method: "POST",
    body: JSON.stringify(data),
  });

const put = (path, data) =>
  api(path, {
    method: "PUT",
    body: JSON.stringify(data),
  });

const del = (path) =>
  api(path, { method: "DELETE" });


/*** auth ***/

export async function login(uname, pwd) {
  if (!uname || !pwd) {
    throw new Error("Username and password required");
  }

  return post("/auth/login", { uname, pwd });
}

export async function logout() {
  return post("/auth/logout", {});
}

export async function getCurrentUser() {
  return get("/auth/me");
}

export async function getToken() {
  const user = await getCurrentUser();
  return user ? { uname: user.uname } : null;
}

export async function isLoggedIn() {
  return !!(await getCurrentUser());
}


/*** crud "factory" ***/

function createCRUD(path) {
  return {
    getAll() {
      return get(`/${path}`);
    },

    get(id) {
      return get(`/${path}/${encodeURIComponent(id)}`);
    },

    add(data) {
      return post(`/${path}`, data);
    },

    update(id, changes) {
      return put(`/${path}/${encodeURIComponent(id)}`, changes);
    },

    remove(id) {
      return del(`/${path}/${encodeURIComponent(id)}`);
    },
  };
}

export const users = createCRUD("users");
export const profs = createCRUD("profs");
export const admins = createCRUD("admins");

export const students = {
  ...createCRUD("students"),

  getByProject(projectID) {
    return get(`/students/by-project/${encodeURIComponent(projectID)}`);
  },

  allocateTokens(uname, token_dist) {
    return post(
      `/students/${encodeURIComponent(uname)}/allocate-tokens`,
      { token_dist }
    );
  },
};


export const projects = {
  ...createCRUD("projects"),

  getByProf(prof_uname) {
    return get(`/projects/by-prof/${encodeURIComponent(prof_uname)}`);
  },
};


/*** phase ***/

export async function getPhase() {
  const data = await get("/phase");
  return data.phase;
}

export async function setPhase(n) {
  const data = await put("/phase", { phase: n });
  return data.phase;
}
