# RnD-Fixer

Made for CS699.

**NOTE:** DO NOT push presentation.pdf to the repository, if present at the
repository root.

## Contributions

<!-- TODO: fill this up -->

## Building and running the R&D Fixer prototype

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
