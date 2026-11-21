
(TODO: backend architecture, endpoints for each service and their respective data format wherever applicable)

## Services

### Auth

#### Register a user

`POST /v1/auth/register` · **Public**

Creates a new user account.

##### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `username` | string | Yes | Unique username. Max 64 characters. |
| `password` | string | Yes | 8–72 bytes. |
| `role` | string | Yes | Role to assign to the user, e.g. `admin`. |
| `name` | string | No | **Deprecated.** Ignored by the server. |

##### Example

```bash
curl -X POST http://localhost:8000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
        "username": "odu",
        "password": "meGareebHun",
        "role": "admin"
      }'
```

##### Response `200 OK`

| Field | Type | Description |
|---|---|---|
| `user_id` | string | ID of the newly created user. |

```json
{
  "user_id": "6720f1c2a9b3e4d5f6a7b8c9"
}
```

##### Errors

| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 400 | `INVALID_ARGUMENT` | — | A field fails validation; see `fields`. |
| 409 | `ALREADY_EXISTS` | `USERNAME_TAKEN` | The username is already registered. |
| 500 | `INTERNAL` | — | Unexpected server error. |

#### Log in

`POST /v1/auth/login` · **Public**

Authenticates a user and returns an access token.

##### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `username` | string | Yes | Registered username. |
| `password` | string | Yes | The user's password. |

##### Example

```bash
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
        "username": "odu",
        "password": "meGareebHun"
      }'
```

##### Response `200 OK`

| Field | Type | Description |
|---|---|---|
| `access_token` | string | JWT to send as `Authorization: Bearer <access_token>`. Expires after 15 minutes. |

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

##### Errors

| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 400 | `INVALID_ARGUMENT` | — | `username` or `password` is missing. |
| 401 | `UNAUTHENTICATED` | `INVALID_CREDENTIALS` | Username does not exist or password is wrong. |
| 500 | `INTERNAL` | — | Unexpected server error. |


### Core

The Core service manages professors, students and projects. It has three groups of endpoints:
 
- [Projects](#projects) under `/v1/core/projects`
- [Professors](#professors) under `/v1/core/professors`
- [Students](#students) under `/v1/core/students`
#### Conventions
 
- Every Core endpoint requires an access token from [Log in](#log-in), sent as `Authorization: Bearer <access_token>`.
- Requests and responses are JSON, with `snake_case` field names.
- The **In** column of each request table says where a field goes: `path` (in the URL), `query` (in the query string) or `body` (in the JSON body). A field that is part of the URL path must not be repeated in the body.
- A string field that is omitted is treated as an empty string.
- Usernames (`prof_username`, `stud_username`) identify professors and students. IDs (`proj_id`, `prof_id`, `stud_id`) are assigned by the server.
##### Errors common to all Core endpoints
 
| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 400 | `INVALID_ARGUMENT` | — | A required field is missing or fails validation; see `fields`. |
| 401 | `UNAUTHENTICATED` | — | The access token is missing, invalid or expired. |
| 500 | `INTERNAL` | — | Unexpected server error. |
 
Only errors specific to an endpoint are listed in its own table below.
 
---
 
### Projects
 
A project belongs to one professor. Its `token_distribution` maps a student's username to the number of tokens that student has placed on the project.
 
#### Create a project
 
`POST /v1/core/projects/{prof_username}`
 
Creates a project owned by the professor named in the URL.
 
##### Request
 
| Field | In | Type | Required | Description |
|---|---|---|---|---|
| `prof_username` | path | string | Yes | Username of the professor who owns the project. |
| `proj_name` | body | string | Yes | Name of the project. |
| `description` | body | string | Yes | Description of the project. |
| `max_occupancy` | body | integer | Yes | Maximum number of students the project accepts. |
| `token_distribution` | body | map<string, integer> | No | Initial tokens per student username. |
| `proj_id` | body | string | No | **Ignored.** The server generates the ID. |
 
##### Example
 
```bash
curl -X POST http://localhost:8000/v1/core/projects/prof_alice \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "proj_name": "Compiler Optimizations",
        "description": "Loop dependence analysis in MLIR.",
        "max_occupancy": 4
      }'
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `proj_id` | string | ID of the newly created project. |
 
```json
{
  "proj_id": "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b"
}
```
 
##### Errors
 
| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 409 | `ALREADY_EXISTS` | — | The project already exists. |
 
#### Get a project
 
`GET /v1/core/projects/{proj_id}`
 
Returns a single project.
 
##### Request
 
| Field | In | Type | Required | Description |
|---|---|---|---|---|
| `proj_id` | path | string | Yes | ID of the project. |
 
##### Example
 
```bash
curl http://localhost:8000/v1/core/projects/3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b \
  -H "Authorization: Bearer $TOKEN"
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `proj_id` | string | ID of the project. |
| `proj_name` | string | Name of the project. |
| `prof_username` | string | Username of the owning professor. |
| `description` | string | Description of the project. |
| `max_occupancy` | integer | Maximum number of students. |
| `token_distribution` | map<string, integer> | Tokens per student username. |
 
```json
{
  "proj_id": "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b",
  "proj_name": "Compiler Optimizations",
  "prof_username": "prof_alice",
  "description": "Loop dependence analysis in MLIR.",
  "max_occupancy": 4,
  "token_distribution": {
    "stud_bob": 5
  }
}
```
 
##### Errors
 
| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 404 | `NOT_FOUND` | — | No project has this ID. |
 
#### List all projects
 
`GET /v1/core/projects`
 
Returns every project. This endpoint takes no parameters.
 
##### Example
 
```bash
curl http://localhost:8000/v1/core/projects \
  -H "Authorization: Bearer $TOKEN"
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `projects` | array | List of projects, each with the fields shown in [Get a project](#get-a-project). |
 
```json
{
  "projects": [
    {
      "proj_id": "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b",
      "proj_name": "Compiler Optimizations",
      "prof_username": "prof_alice",
      "description": "Loop dependence analysis in MLIR.",
      "max_occupancy": 4,
      "token_distribution": {}
    }
  ]
}
```
 
#### List a professor's projects
 
`GET /v1/core/projects/prof/{prof_username}`
 
Returns all projects owned by one professor.
 
##### Request
 
| Field | In | Type | Required | Description |
|---|---|---|---|---|
| `prof_username` | path | string | Yes | Username of the professor. |
 
##### Example
 
```bash
curl http://localhost:8000/v1/core/projects/prof/prof_alice \
  -H "Authorization: Bearer $TOKEN"
```
 
##### Response `200 OK`
 
Same shape as [List all projects](#list-all-projects), filtered to this professor.
 
#### Set a student's token on a project
 
`POST /v1/core/projects/tokens/{proj_id}`
 
Sets the number of tokens a student has on a project, in the project's `token_distribution`. If the student already has tokens on the project, the value is overwritten.
 
##### Request
 
| Field | In | Type | Required | Description |
|---|---|---|---|---|
| `proj_id` | path | string | Yes | ID of the project. |
| `stud_username` | body | string | Yes | Username of the student. |
| `token` | body | integer | Yes | Number of tokens. |
 
##### Example
 
```bash
curl -X POST http://localhost:8000/v1/core/projects/tokens/3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "stud_username": "stud_bob",
        "token": 5
      }'
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `proj_id` | string | ID of the updated project. |
 
```json
{
  "proj_id": "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b"
}
```
 
##### Errors
 
| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 404 | `NOT_FOUND` | — | No project has this ID. |
 
#### Remove a student's token from a project
 
`DELETE /v1/core/projects/tokens/{proj_id}?stud_username={stud_username}`
 
Removes a student's entry from the project's `token_distribution`.
 
##### Request
 
| Field | In | Type | Required | Description |
|---|---|---|---|---|
| `proj_id` | path | string | Yes | ID of the project. |
| `stud_username` | query | string | Yes | Username of the student. |
 
##### Example
 
```bash
curl -X DELETE "http://localhost:8000/v1/core/projects/tokens/3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b?stud_username=stud_bob" \
  -H "Authorization: Bearer $TOKEN"
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `proj_id` | string | ID of the updated project. |
 
```json
{
  "proj_id": "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b"
}
```
 
##### Errors
 
| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 404 | `NOT_FOUND` | — | The project does not exist, or the student has no token on it. |
 
---
 
### Professors
 
#### Create a professor profile
 
`POST /v1/core/professors`
 
Creates a professor profile.
 
##### Request body
 
| Field | Type | Required | Description |
|---|---|---|---|
| `prof_username` | string | Yes | Unique username of the professor. |
| `prof_name` | string | Yes | Full name. |
| `email` | string | Yes | Contact email. |
| `about` | string | No | Short biography. |
| `link` | array of string | No | Links such as a homepage or publications. |
| `prof_id` | string | No | **Ignored.** The server generates the ID. |
 
##### Example
 
```bash
curl -X POST http://localhost:8000/v1/core/professors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "prof_username": "prof_alice",
        "prof_name": "Alice Example",
        "email": "alice@example.edu",
        "about": "Compilers and program analysis.",
        "link": ["https://example.edu/~alice"]
      }'
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `prof_username` | string | Username of the created professor. |
 
```json
{
  "prof_username": "prof_alice"
}
```
 
##### Errors
 
| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 409 | `ALREADY_EXISTS` | — | A professor with this username already exists. |
 
#### Edit a professor profile
 
`POST /v1/core/professors/edit/{prof_username}`
 
Updates a professor profile. Only the fields you send with a non-empty value are changed; all other fields keep their current value. If you send `link`, it replaces the whole list.
 
##### Request
 
| Field | In | Type | Required | Description |
|---|---|---|---|---|
| `prof_username` | path | string | Yes | Username of the professor to edit. |
| `prof_name` | body | string | No | New full name. |
| `email` | body | string | No | New contact email. |
| `about` | body | string | No | New biography. |
| `link` | body | array of string | No | New list of links. |
 
At least one body field must be provided.
 
##### Example
 
```bash
curl -X POST http://localhost:8000/v1/core/professors/edit/prof_alice \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "about": "Compilers, program analysis and MLIR."
      }'
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `prof_username` | string | Username of the edited professor. |
 
```json
{
  "prof_username": "prof_alice"
}
```
 
##### Errors
 
| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 404 | `NOT_FOUND` | — | No professor has this username. |
 
---
 
#### Get a professor
 
`GET /v1/core/professors/{prof_username}`
 
Returns a single professor.
 
##### Request
 
| Field | In | Type | Required | Description |
|---|---|---|---|---|
| `prof_username` | path | string | Yes | Username of the professor. |
 
##### Example
 
```bash
curl http://localhost:8000/v1/core/professors/prof_alice \
  -H "Authorization: Bearer $TOKEN"
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `prof_id` | string | ID of the professor. |
| `prof_username` | string | Username of the professor. |
| `prof_name` | string | Name of the professor. |
| `email` | string | Email address of the professor. |
| `about` | string | Short description of the professor. |
| `link` | array<string> | Links associated with the professor. |
 
```json
{
  "prof_id": "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b",
  "prof_username": "prof_alice",
  "prof_name": "Alice Smith",
  "email": "alice@example.edu",
  "about": "Works on compiler optimizations and loop dependence analysis in MLIR.",
  "link": [
    "https://example.edu/~alice"
  ]
}
```
 
##### Errors
 
| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 404 | `NOT_FOUND` | — | No professor has this username. |
 
#### List all professors
 
`GET /v1/core/professors`
 
Returns every professor. This endpoint takes no parameters.
 
##### Example
 
```bash
curl http://localhost:8000/v1/core/professors \
  -H "Authorization: Bearer $TOKEN"
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `profs` | array | List of professors, each with the fields shown in [Get a professor](#get-a-professor). |
 
```json
{
  "profs": [
    {
      "prof_id": "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b",
      "prof_username": "prof_alice",
      "prof_name": "Alice Smith",
      "email": "alice@example.edu",
      "about": "Works on compiler optimizations and loop dependence analysis in MLIR.",
      "link": [
        "https://example.edu/~alice"
      ]
    }
  ]
}
```

### Students
 
A student's `token_distribution` maps a project ID to the number of tokens the student has placed on that project.
 
#### Create a student profile
 
`POST /v1/core/students`
 
Creates a student profile.
 
##### Request body
 
| Field | Type | Required | Description |
|---|---|---|---|
| `stud_username` | string | Yes | Unique username of the student. |
| `stud_name` | string | Yes | Full name. |
| `email` | string | Yes | Contact email. |
| `about` | string | No | Short biography. |
| `link` | array of string | No | Links such as a portfolio or repository. |
| `final_proj_id` | string | No | ID of the student's finalized project. |
| `token_distribution` | map<string, integer> | No | Initial tokens per project ID. |
| `stud_id` | string | No | **Ignored.** The server generates the ID. |
 
##### Example
 
```bash
curl -X POST http://localhost:8000/v1/core/students \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "stud_username": "stud_bob",
        "stud_name": "Bob Example",
        "email": "bob@example.edu",
        "link": ["https://github.com/bob"]
      }'
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `stud_username` | string | Username of the created student. |
 
```json
{
  "stud_username": "stud_bob"
}
```
 
##### Errors
 
| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 409 | `ALREADY_EXISTS` | — | A student with this username already exists. |
 
#### Edit a student profile
 
`POST /v1/core/students/edit/{stud_username}`
 
Updates a student profile. Only the fields you send with a non-empty value are changed; all other fields keep their current value. If you send `link`, it replaces the whole list.
 
##### Request
 
| Field | In | Type | Required | Description |
|---|---|---|---|---|
| `stud_username` | path | string | Yes | Username of the student to edit. |
| `stud_name` | body | string | No | New full name. |
| `email` | body | string | No | New contact email. |
| `about` | body | string | No | New biography. |
| `link` | body | array of string | No | New list of links. |
 
At least one body field must be provided.
 
##### Example
 
```bash
curl -X POST http://localhost:8000/v1/core/students/edit/stud_bob \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "about": "Final-year student interested in compilers."
      }'
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `stud_username` | string | Username of the edited student. |
 
```json
{
  "stud_username": "stud_bob"
}
```
 
##### Errors
 
| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 404 | `NOT_FOUND` | — | No student has this username. |
 
#### Get a student
 
`GET /v1/core/students/{stud_username}`
 
Returns a single student.
 
##### Request
 
| Field | In | Type | Required | Description |
|---|---|---|---|---|
| `stud_username` | path | string | Yes | Username of the student. |
 
##### Example
 
```bash
curl http://localhost:8000/v1/core/students/stud_bob \
  -H "Authorization: Bearer $TOKEN"
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `stud_id` | string | ID of the student. |
| `stud_username` | string | Username of the student. |
| `stud_name` | string | Name of the student. |
| `email` | string | Email address of the student. |
| `about` | string | Short description of the student. |
| `link` | array<string> | Links associated with the student. |
| `final_proj_id` | string | ID of the student's final project. |
| `token_distribution` | map<string, integer> | Tokens per project ID. |
 
```json
{
  "stud_id": "9a7c1d2e-4b3f-4a68-8e51-0f6b7c8d9e10",
  "stud_username": "stud_bob",
  "stud_name": "Bob Jones",
  "email": "bob@example.edu",
  "about": "Interested in compilers and program analysis.",
  "link": [
    "https://example.edu/~bob"
  ],
  "final_proj_id": "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b",
  "token_distribution": {
    "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b": 5
  }
}
```
 
##### Errors
 
| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 404 | `NOT_FOUND` | — | No student has this username. |
 
#### List all students
 
`GET /v1/core/students`
 
Returns every student. This endpoint takes no parameters.
 
##### Example
 
```bash
curl http://localhost:8000/v1/core/students \
  -H "Authorization: Bearer $TOKEN"
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `students` | array | List of students, each with the fields shown in [Get a student](#get-a-student). |
 
```json
{
  "students": [
    {
      "stud_id": "9a7c1d2e-4b3f-4a68-8e51-0f6b7c8d9e10",
      "stud_username": "stud_bob",
      "stud_name": "Bob Jones",
      "email": "bob@example.edu",
      "about": "Interested in compilers and program analysis.",
      "link": [
        "https://example.edu/~bob"
      ],
      "final_proj_id": "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b",
      "token_distribution": {
        "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b": 5
      }
    }
  ]
}
```

#### Set a project token on a student
 
`POST /v1/core/students/tokens/{stud_username}`
 
Sets the number of tokens a student has on a project, in the student's `token_distribution`. If the student already has tokens on the project, the value is overwritten.
 
##### Request
 
| Field | In | Type | Required | Description |
|---|---|---|---|---|
| `stud_username` | path | string | Yes | Username of the student. |
| `proj_id` | body | string | Yes | ID of the project. |
| `token` | body | integer | Yes | Number of tokens. |
 
##### Example
 
```bash
curl -X POST http://localhost:8000/v1/core/students/tokens/stud_bob \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "proj_id": "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b",
        "token": 5
      }'
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `stud_username` | string | Username of the updated student. |
 
```json
{
  "stud_username": "stud_bob"
}
```
 
##### Errors
 
| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 404 | `NOT_FOUND` | — | No student has this username. |
 
#### Remove a project token from a student
 
`DELETE /v1/core/students/tokens/{stud_username}?proj_id={proj_id}`
 
Removes a project's entry from the student's `token_distribution`.
 
##### Request
 
| Field | In | Type | Required | Description |
|---|---|---|---|---|
| `stud_username` | path | string | Yes | Username of the student. |
| `proj_id` | query | string | Yes | ID of the project. |
 
##### Example
 
```bash
curl -X DELETE "http://localhost:8000/v1/core/students/tokens/stud_bob?proj_id=3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b" \
  -H "Authorization: Bearer $TOKEN"
```
 
##### Response `200 OK`
 
| Field | Type | Description |
|---|---|---|
| `stud_username` | string | Username of the updated student. |
 
```json
{
  "stud_username": "stud_bob"
}
```
 
##### Errors
 
| HTTP | `code` | `reason` | When |
|---|---|---|---|
| 404 | `NOT_FOUND` | — | The student does not exist, or has no token on that project. |


## Build Instructions

### Prerequisites

- Docker with Docker Compose v2 (`docker compose version`). Live reload (`docker compose watch`) needs Compose 2.23 or later.
- The JWT key pair and MongoDB credentials. Request them from [@ashu3103](https://github.com/ashu3103).
- Make sure your device is not connected to institute's network or a network behind a firewall that blocks mongodb atlas ports.

### Add the secrets

Make sure you have retrieved all three files listed below:

- `public.pem`
- `private.pem`
- `mongo_credentials.txt`

Place these files at these exact paths:

- `public.pem` and `private.pem` inside `./server/shared/jwtauth/keys/`
- `credentials.txt` inside `./server/shared/mongo/keys/`

> Warning: Never commit these files, make sure the directories they reside in are listed in .gitignore

### Build and Start

```
cd server/
docker compose up --build
```

This starts gateway at port `:8000`, to verify whether the gateway is up, execute the following curl command:

```
curl -i http://localhost:8000/health
```

To stop and prune the containers:

```
docker compose down
```

### Development

Rebuild and restart services automatically when source files change:

```bash
docker compose watch
```