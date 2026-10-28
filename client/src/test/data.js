/*
 * dummy data, do not use in production!
 *
 * Rough representation of the schema:
 *   User(_id, uname, pass, role)
 *   Admin(_id, uname, pass)
 *   Prof(_id, uname, email, name, about, [links])
 *   Project(_id, pname, prof_id, desc, max_students,
 *           <token_dist(student_id:num_tokens)>)
 *   Student(_id, uname, email, name, about, [links], final_proj_id,
 *           <token_dist(proj_id:num_tokens))
 */

export const USERS = {
  ash: { _id: "ash", uname: "ash", pass: "demo", role: "prof" },
  smv: { _id: "smv", uname: "smv", pass: "demo", role: "prof" },
  swarn: { _id: "swarn", uname: "swarn", pass: "demo", role: "prof" },
  jp: { _id: "jp", uname: "jp", pass: "demo", role: "student" },
  od: { _id: "od", uname: "od", pass: "demo", role: "student" },
  admin: { _id: "admin", uname: "admin", pass: "admin", role: "admin" },
};

export const ADMINS = {
  admin: { _id: "admin", uname: "admin" },
};

export const PROFS = {
  ash: {
    _id: "ash",
    uname: "ash",
    email: "ashutosh@iitb.asc",
    name: "Prof. Ashutosh Sharma",
    number: null,
    about: "",
    links: [],
  },
  smv: {
    _id: "smv",
    uname: "smv",
    email: "shreerang@iitb.asc",
    name: "Prof. Shreerang Vaidya",
    number: null,
    about: "",
    links: [],
  },
  swarn: {
    _id: "swarn",
    uname: "swarn",
    email: "swarnim@iiitb.asc",
    name: "Prof. Swarnim Chavan",
    number: null,
    about: "",
    links: [],
  },
};

export const PROJECTS = {
  jit_appeaser: {
    _id: "jit_appeaser",
    pname: "JIT Appeaser",
    prof_id: "ash",
    desc: "Pleasure entropy estimation for the JIT.",
    max_students: 2,
    token_dist: {},
  },
  data_dependence_graphs: {
    _id: "data_dependence_graphs",
    pname: "Data Dependence Graphs",
    prof_id: "smv",
    desc: "Implement formatting guidelines for the project.",
    max_students: 3,
    token_dist: {},
  },
  pokemon_assembly: {
    _id: "pokemon_assembly",
    pname: "Pokemon Assembly",
    prof_id: "swarn",
    desc: "Propagation of Pokemon through different media.",
    max_students: 2,
    token_dist: {},
  },
};

export const STUDENTS = {
  jp: {
    _id: "jp",
    uname: "jp",
    email: "jaypee@student.com",
    name: "Jay Patel",
    about: "",
    links: [],
    final_proj_id: "proj_pokemon_assembly",
    token_dist: {},
  },
  od: {
    _id: "od",
    uname: "jp",
    email: "od@student.com",
    name: "Om Dwivedi",
    about: "",
    links: [],
    final_proj_id: "proj_data_dependence_graphs",
    token_dist: {},
  },
};
