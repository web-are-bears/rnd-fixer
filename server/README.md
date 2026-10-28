
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


## Build Instructions

### Prerequisites

- Docker with Docker Compose v2 (`docker compose version`). Live reload (`docker compose watch`) needs Compose 2.23 or later.
- The JWT key pair and MongoDB credentials. Request them from [@ashu3103](https://github.com/ashu3103).

### Add the secrets

Make sure you have retrieved all three files listed below:

- `pubblic.pem`
- `private.pem`
- `mongo_credentials.txt`

Place these files at these exact paths:

- `public.pem` and `private.pem` inside `./server/shared/jwtauth/keys/`
- `mongo_credentials.txt` inside `./server/shared/mongo/keys/`

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