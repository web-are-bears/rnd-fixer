# RnD-Fixer

Made for CS699.

**NOTE:** DO NOT push presentation.pdf to the repository, if present at the
repository root.

PS: for a quick demo just run `npm run dev` in `client` and `python dev.py` in
`dev`.

## Contributions

Contributions were dvidied in this manner:

- Ashutosh (26m2107) - backend work (mostly) - refer to
  [docs/contributions/26m2107.txt](docs/contributions/26m2107.txt) for logs.
- Swarnim (26m2105) - work on the algorithm and .proto files - refer to
  [docs/contributions/26m2105.txt](docs/contributions/26m2105.txt) for logs.
- Shreerang (26m2121) - frontend work (mostly) - refer to
  [docs/contributions/26m2121.txt](docs/contributions/26m2121.txt) for logs.

## Code organization of the R&D Fixer prototype

### Client side

Everything for the web app lives in `client/`.

Base level:

- `index.html`: the single HTML page Vite serves. React mounts into it.
- `vite.config.js`: Vite and Tailwind setup.
- `eslint.config.js`: lint rules.
- `prettier.confing.js`: formatting rules.

Main source files:

- `main.jsx`: entry point. Mounts the React app.
- `App.jsx`: the route definitions, which decide which page shows for which URL.
- `Layout.jsx`: the shared page shell (navbar plus content area) that wraps
  every page.
- `api.js`: the API layer. It routes to either one of two backends: a prototype
  Flask backend, and the gRPC one written in Golang.
- `styles/index.css`: global styles and the Tailwind import. The styles loosely
  correspond to the component library.

Component library:

- `Button.jsx`, `Input.jsx`, `Card.jsx`: common things supposed to be reused
  everywhere.
- `Navbar.jsx`: the top navigation bar.
- `Popup.jsx`: the dialog box that appears in dashboards (add project, allocate
  tokens and so on).
- `EdiTable.jsx`: an editable table that has terrible nesting.
- `Extras.jsx`: small helpers that didn't really need their own separate file...

Pages:

- `Login.jsx`, `Register.jsx`: sign-in and account registration through magic
  link.
- `Dashboard.jsx`: the landing page after login. It picks the right dashboard
  for your role.
- `dashboard/StudentDashboard.jsx`: shows the current phase and the student's
  token allocation.
- `dashboard/ProfDashboard.jsx`: shows a professor's projects and lets them
  allocate tokens to interested students.
- `dashboard/AdminDashboard.jsx`: manages users, switches phases and runs
  matchfix.
- `Profs.jsx`, `Students.jsx`, `Projects.jsx`: browse professors, students and
  projects.
- `Users.jsx`: admin view for managing user accounts.
- `Settings.jsx`: profile and account settings.

Testing:

For the ease of testing, a local backend is stored in `client/dev`. Its purpose
is strictly for ease of testing and perhaps for quickly seeing the functionality
of the project. It is functionally equivalent to the Golang backend, but lacks
modularity and ease of modification.

- `test/api.js`: the API layer for the real (gRPC/Go) backend.
- `dev.py`: a Flask server that handles a .

If anything is missed out, it is possibly not that relevant!

### AI use on the client slide

Bug fixing was a major use case but uses of AI have been disclosed in comments
wherever possible!

### Server side

<!-- TODO: fill this up -->

## Building and Running

This section explains the build instructions and also the

### Frontend

Run the following to two commands separately to get the app running.

```
cd client/dev
python dev.py
```

And:

```
cd client
npm run dev
```

For specific build and run instructions, see
[`client/README.md`](client/README.md).

The test server comes up on `http://127.0.0.1:4321`. The first run creates
`pikachu.db` and makes an admin account for you:

- username: `admin`
- password: `admin`

### Client tech stack

We have used the following technologies in the client: Vite, React, Tailwind,
Flask, SQLite.

## gRPC version

The app can be deployed by setting up a MongoDB Atlas instance and using the Go
backend. Refer to [`server/README.md`](server/README.md) for more details
(subject to change).

<!-- TODO: fill this up -->

## Thank you

Thanks for checking out RnD-Fixer. If something breaks, open an issue and we
might take a look. :)
