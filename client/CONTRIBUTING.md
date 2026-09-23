# **Contribution Guidelines** for the RnD Fixer frontend repository

## Formatting guidelines

It is necessary to run `prettier` on the project before any commit like this:

```sh
prettier --write .
```

...or:

```sh
npx prettier --write .
```

## Tooling

The following tools are used for building and maintaining the frontend.

- `node`: v22.17.0
- `prettier`: v3.9.8

Do not modify the dependency versions in `package.json` unless strictly
required. The `package-lock.json` file should be kept in sync with
`package.json`.

Ideally the version recommended should be used. For installing packages, prefer
`npm ci` over `npm i`.

## "It works on my machine!"

Run:

```sh
npm run lint
```

It might help find issues that aren't apparent at a glance.

## Commit messages

Commit messages should be written in the following format:

```
<short imperative description>


<longer description (if needed)>
```

The short and long descriptions should be separated by a blank line.

Example:

```
add `waterType`

- Add function `getWaterPower` for water type Pokemon
- Modify the damage heuristics of some other types
```

The following prefixes can also help describe commits better:

- `fix:`: A correction to a previous commit.
- `cleanup:`: A refactor or cleanup following a previous commit.
- `tests:`: For commits related to adding/modifying tests.
- `docs:`: For commits related to adding/modifying documentation.
