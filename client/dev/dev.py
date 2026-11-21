from flask import Flask, request, jsonify, g
from flask_cors import CORS
import sqlite3
import json
import secrets
from pathlib import Path

app = Flask(__name__)
CORS(
    app,
    origins=["http://localhost:5173", "http://localhost:3000"],
    supports_credentials=True,
)

# name subject to change?
DB = Path(__file__).with_name("pikachu.db")


# same old
def dbget():
    if "db" not in g:
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


# TODO(s-mv) handle error argument
@app.teardown_appcontext
def db_close(_):
    if "db" in g:
        g.db.close()


"""
disclaimer:
    much of the SQL queries were verified/rewritten by AI
    formatting of SQL code is done by AI
    I really didn't want to waste time on this!
    also, the schema is bad for SQL, but this is for dirty prototyping anyway
"""


def init():
    db = dbget()

    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            uname TEXT PRIMARY KEY, pass TEXT NOT NULL, role TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS admins (
            uname TEXT PRIMARY KEY REFERENCES users(uname) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS profs (
            uname TEXT PRIMARY KEY REFERENCES users(uname) ON DELETE CASCADE,
            email TEXT, name TEXT, number TEXT, about TEXT,
            links TEXT DEFAULT '[]'
        );

        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT, pname TEXT,
            prof_uname TEXT REFERENCES profs(uname),
            description TEXT, max_students INTEGER,
            token_dist TEXT DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS students (
            uname TEXT PRIMARY KEY REFERENCES users(uname) ON DELETE CASCADE,
            email TEXT, name TEXT, about TEXT,
            links TEXT DEFAULT '[]',
            final_proj_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
            token_dist TEXT DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            uname TEXT REFERENCES users(uname) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY, value TEXT
        );

        INSERT OR IGNORE INTO settings VALUES ('phase', '1');
    """)


def bootstrap_admin():
    with app.app_context():
        init()
        db = dbget()

        if db.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
            db.execute(
                "INSERT INTO users VALUES (?, ?, ?)", ("admin", "admin", "admin")
            )
            db.execute("INSERT INTO admins VALUES (?)", ("admin",))
            db.commit()


def parse_row(row):
    if row is None:
        return None

    data = dict(row)

    for field in ("links", "token_dist"):
        if field in data and data[field]:
            data[field] = json.loads(data[field])

    if "id" in data:
        data["_id"] = data.pop("id")

    if "description" in data:
        data["desc"] = data.pop("description")

    data.pop("pass", None)
    return data


def records(query, args=()):
    return [parse_row(row) for row in dbget().execute(query, args)]


def record(query, args=()) -> dict | None:
    row = dbget().execute(query, args).fetchone()
    return parse_row(row)


# auth related code here


@app.post("/api/auth/login")
def login():
    data = request.get_json() or {}
    db = dbget()

    user = db.execute(
        "SELECT * FROM users WHERE uname = ? AND pass = ?",
        (data["uname"], data["pwd"]),
    ).fetchone()

    if user is None:
        return jsonify({"error": "Invalid username or password"}), 401

    token = secrets.token_urlsafe(32)
    db.execute("INSERT INTO sessions VALUES (?, ?)", (token, user["uname"]))
    db.commit()

    response = jsonify({"user": parse_row(user)})
    response.set_cookie(
        "pikachu", token, httponly=True, max_age=14 * 24 * 60 * 60, samesite="Lax"
    )
    return response


@app.post("/api/auth/logout")
def logout():
    token = request.cookies.get("pikachu")
    dbget().execute("DELETE FROM sessions WHERE token = ?", (token,))
    dbget().commit()

    response = jsonify({"success": True})
    response.delete_cookie("pikachu")
    return response


@app.get("/api/auth/me")
def me():
    token = request.cookies.get("pikachu")

    user = record(
        """
        SELECT users.*
        FROM users JOIN sessions ON users.uname = sessions.uname
        WHERE sessions.token = ?
        """,
        (token,),
    )

    return jsonify(user)


# crud related APIs


def crud_make(resource, table, key, role=None):
    base = f"/api/{resource}"

    def get_all():
        return jsonify(records(f"SELECT * FROM {table}"))

    def get_one(value):
        result = record(f"SELECT * FROM {table} WHERE {key} = ?", (value,))

        return (
            (jsonify({"error": f"Record not found: {value}"}), 404)
            if result is None
            else jsonify(result)
        )

    def add():
        data = request.get_json() or {}
        db = dbget()

        if table == "users":
            db.execute(
                "INSERT INTO users VALUES (?, ?, ?)",
                (data["uname"], data["pass"], data["role"]),
            )

        elif table == "admins":
            db.execute("INSERT INTO admins VALUES (?)", (data["uname"],))

        elif table in ("profs", "students"):
            user = db.execute(
                "SELECT role FROM users WHERE uname = ?", (data["uname"],)
            ).fetchone()

            if user is None or user["role"] != role:
                return jsonify({"error": "Invalid user"}), 400

            fields = {
                "profs": ["email", "name", "number", "about", "links"],
                "students": [
                    "email",
                    "name",
                    "about",
                    "links",
                    "final_proj_id",
                    "token_dist",
                ],
            }[table]

            values = [data.get(field) for field in fields]

            for i, field in enumerate(fields):
                if field in ("links", "token_dist"):
                    values[i] = json.dumps(
                        values[i] or ([] if field == "links" else {})
                    )

            columns = ["uname"] + fields
            db.execute(
                f"INSERT INTO {table} ({','.join(columns)}) "
                f"VALUES ({','.join('?' for _ in columns)})",
                [data["uname"]] + values,
            )

        elif table == "projects":
            db.execute(
                """
                INSERT INTO projects
                (pname, prof_uname, description, max_students, token_dist)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    data.get("pname"),
                    data.get("prof_uname"),
                    data.get("desc", data.get("description", "")),
                    data.get("max_students"),
                    json.dumps(
                        data.get("token_dist")
                        if data.get("token_dist") is not None
                        else {}
                    ),
                ),
            )

        db.commit()
        key = "id" if table == "projects" else "uname"
        value = (
            db.execute("SELECT last_insert_rowid()").fetchone()[0]
            if key == "id"
            else data["uname"]
        )
        return jsonify(record(f"SELECT * FROM {table} WHERE {key} = ?", (value,))), 201

    def update(value):
        data = request.get_json() or {}

        fields = {
            "users": ["pass", "role"],
            "admins": [],
            "profs": ["email", "name", "number", "about", "links"],
            "students": [
                "email",
                "name",
                "about",
                "links",
                "final_proj_id",
                "token_dist",
            ],
            "projects": [
                "pname",
                "prof_uname",
                "desc",
                "description",
                "max_students",
                "token_dist",
            ],
        }[table]

        updates = {}
        for field in fields:
            if field in data:
                name = "description" if field == "desc" else field
                updates[name] = data[field]

        for field in ("links", "token_dist"):
            if field in updates:
                updates[field] = json.dumps(updates[field])

        if updates:
            db = dbget()
            db.execute(
                f"UPDATE {table} SET "
                + ", ".join(f"{field} = ?" for field in updates)
                + f" WHERE {key} = ?",
                list(updates.values()) + [value],
            )
            db.commit()

        return jsonify(record(f"SELECT * FROM {table} WHERE {key} = ?", (value,)))

    def delete(value):
        db = dbget()
        db.execute(f"DELETE FROM {table} WHERE {key} = ?", (value,))
        db.commit()
        return jsonify({"success": True})

    app.add_url_rule(base, resource + "_all", get_all, methods=["GET"])
    app.add_url_rule(base, resource + "_add", add, methods=["POST"])
    app.add_url_rule(base + "/<value>", resource + "_get", get_one, methods=["GET"])
    app.add_url_rule(base + "/<value>", resource + "_update", update, methods=["PUT"])
    app.add_url_rule(
        base + "/<value>", resource + "_delete", delete, methods=["DELETE"]
    )


crud_make("users", "users", "uname")
crud_make("admins", "admins", "uname")
crud_make("profs", "profs", "uname", "prof")
crud_make("students", "students", "uname", "student")
crud_make("projects", "projects", "id")


# Special operations


@app.get("/api/students/by-project/<project_id>")
def students_by_project(project_id):
    return jsonify(
        records("SELECT * FROM students WHERE final_proj_id = ?", (project_id,))
    )


@app.post("/api/students/<uname>/allocate-tokens")
def allocate_tokens(uname):
    data = request.get_json() or {}
    token_dist = data["token_dist"]

    if any(not isinstance(n, int) or n < 0 for n in token_dist.values()):
        return jsonify({"error": "Tokens must be nonnegative integers"}), 400

    if sum(token_dist.values()) > 100:
        return jsonify({"error": "Total tokens cannot exceed 100"}), 400

    db = dbget()
    project_ids = {str(row["id"]) for row in db.execute("SELECT id FROM projects")}

    if not set(token_dist).issubset(project_ids):
        return jsonify({"error": "Unknown project"}), 400

    db.execute(
        "UPDATE students SET token_dist = ? WHERE uname = ?",
        (json.dumps(token_dist), uname),
    )
    db.commit()

    return jsonify(record("SELECT * FROM students WHERE uname = ?", (uname,)))


@app.get("/api/projects/by-prof/<prof_uname>")
def projects_by_prof(prof_uname):
    return jsonify(
        records("SELECT * FROM projects WHERE prof_uname = ?", (prof_uname,))
    )


@app.get("/api/phase")
def get_phase():
    rec = record("SELECT value FROM settings WHERE key = 'phase'")

    if rec is not None:
        return jsonify({"phase": int(rec["value"])})

    return jsonify({"error": "Invalid phase!"}), 400


@app.put("/api/phase")
def set_phase():
    phase = request.get_json() or {}
    phase = phase["phase"]

    if not isinstance(phase, int) or not 0 <= phase <= 4:
        return jsonify({"error": "Phase must be between 0 and 4"}), 400

    db = dbget()
    db.execute("UPDATE settings SET value = ? WHERE key = 'phase'", (str(phase),))
    db.commit()

    return jsonify({"phase": phase})


bootstrap_admin()
app.run(host="127.0.0.1", port=4321, debug=True)
