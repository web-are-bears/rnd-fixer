/*
 * dummy data, do not use in production!
 *
 * Rough representation of the schema:
 *   User(_id, uname, pass, role)
 *   Admin(_id, uname)
 *   Prof(_id, uname, email, name, about, [links])
 *   Project(_id, pname, prof_uname, desc, max_students,
 *           <token_dist(student_uname:num_tokens)>)
 *   Student(_id, uname, email, name, about, [links], final_pname,
 *           <token_dist(proj_id:num_tokens))
 *
 *   PHASE -> temp added by s-mv
 */

export const USERS = [
  { _id: "ash", uname: "ash", pass: "demo", role: "prof" },
  { _id: "smv", uname: "smv", pass: "demo", role: "prof" },
  { _id: "swarn", uname: "swarn", pass: "demo", role: "prof" },
  { _id: "jp", uname: "jp", pass: "demo", role: "student" },
  { _id: "od", uname: "od", pass: "demo", role: "student" },
  { _id: "admin", uname: "admin", pass: "admin", role: "admin" },
  { _id: "ksh", uname: "ksh", pass: "demo", role: "student" },
  { _id: "ar", uname: "ar", pass: "demo", role: "student" },
  { _id: "bn", uname: "bn", pass: "demo", role: "student" },
];

export const ADMINS = [{ _id: "admin", uname: "admin" }];

export const PROFS = [
  {
    _id: "ash",
    uname: "ash",
    email: "ashutosh@iitb.asc",
    name: "Prof. Ashutosh Sharma",
    number: null,
    about: "",
    links: [],
  },
  {
    _id: "smv",
    uname: "smv",
    email: "shreerang@iitb.asc",
    name: "Prof. Shreerang Vaidya",
    number: null,
    about: "",
    links: [],
  },
  {
    _id: "swarn",
    uname: "swarn",
    email: "swarnim@iiitb.asc",
    name: "Prof. Swarnim Chavan",
    number: null,
    about: "",
    links: [],
  },
];

export const PROJECTS = [
  {
    _id: "jit_appeaser",
    pname: "JIT Appeaser",
    prof_uname: "ash",
    desc: "Pleasure entropy estimation for the JIT.",
    max_students: 2,
    token_dist: {},
  },
  {
    _id: "data_dependence_graphs",
    pname: "Data Dependence Graphs",
    prof_uname: "smv",
    desc: "Implement formatting guidelines for the project.",
    max_students: 3,
    token_dist: {},
  },
  {
    _id: "pokemon_assembly",
    pname: "Pokemon Assembly",
    prof_uname: "swarn",
    desc: "Propagation of Pokemon through different media.",
    max_students: 2,
    token_dist: {},
  },
];

export const STUDENTS = [
  {
    _id: "jp",
    uname: "jp",
    email: "jaypee@student.com",
    name: "Jay Patel",
    about: "",
    links: [],
    final_proj_id: null,
    token_dist: {},
  },
  {
    _id: "od",
    uname: "od",
    email: "od@student.com",
    name: "Om Dwivedi",
    about: "",
    links: [],
    final_proj_id: null,
    token_dist: {},
  },
  {
    _id: "ksh",
    uname: "ksh",
    email: "ksh@student.com",
    name: "Kshitij",
    about: "",
    links: [],
    final_proj_id: null,
    token_dist: {},
  },
  {
    _id: "ar",
    uname: "ar",
    email: "ar@student.com",
    name: "Aryan",
    about: "",
    links: [],
    final_proj_id: null,
    token_dist: {},
  },
  {
    _id: "bn",
    uname: "bn",
    email: "bn@student.com",
    name: "Banipratap Tejpratap Pratap Singh",
    about: "",
    links: [],
    final_proj_id: null,
    token_dist: {},
  },
];

/*
 * PHASE:
 * 0 - phase 0, project filling
 * 1 - phase 1, student token distribution
 * 2 - phase 2, professor token distribution
 * 3 - phase 3, match fixing
 * 4 - phase 4 (if any), admin wrecks havoc
 */

export let PHASE = 1;
