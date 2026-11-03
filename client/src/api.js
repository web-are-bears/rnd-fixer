const api =
  import.meta.env.TEST == "TRUE"
    ? await import("./test/api.js")
    : await import("./prod/api.js");

export const {
  isLoggedIn,
  getToken,
  login,
  logout,
  students,
  profs,
  projects,
  users,
  getPhase,
  setPhase,
} = api;
