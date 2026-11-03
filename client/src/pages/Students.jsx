import { useEffect, useState } from "react";
import { students, getCurrentUser } from "@/api";
import { ErrorMessage, Loading } from "@/components/Extras";
import Card from "@/components/Card";
import Popup from "@/components/Popup";
import Button from "@/components/Button";

function StudentDetail({ student }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="heading text-2xl">{student.name}</h2>
        <p className="text-sm text-ink-soft">{student.email}</p>
      </div>

      {student.about && (
        <div>
          <p className="text-sm font-bold">About</p>
          <p className="mt-1">{student.about}</p>
        </div>
      )}

      {student.links && Object.keys(student.links).length > 0 && (
        <div>
          <p className="text-sm font-bold">Links</p>
          <div className="mt-1 flex flex-col gap-1">
            {Object.entries(student.links).map(([label, url]) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline hover:text-ink-soft"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StudentEditor({ student, onSave, onClose }) {
  const [form, setForm] = useState({
    uname: student?.uname ?? "",
    name: student?.name ?? "",
    email: student?.email ?? "",
    about: student?.about ?? "",
    pass: "",
  });

  const [links, setLinks] = useState(
    Object.entries(student?.links ?? {}).map(([label, url]) => ({
      label,
      url,
    })),
  );

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateLink(index, field, value) {
    setLinks((current) =>
      current.map((link, i) =>
        i == index ? { ...link, [field]: value } : link,
      ),
    );
  }

  async function submit(e) {
    e.preventDefault();

    const normalizedLinks = {};

    for (const link of links) {
      const label = link.label.trim();
      const url = link.url.trim();

      if (!label && !url) continue;

      if (!label || !url) {
        setError("Every link needs both a label and a URL.");
        return;
      }

      if (normalizedLinks[label]) {
        setError(`Duplicate link label: ${label}`);
        return;
      }

      normalizedLinks[label] = url;
    }

    if (!student && !form.pass) {
      setError("A password is required for a new student.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await onSave(
        {
          ...form,
          links: normalizedLinks,
        },
        student,
      );

      onClose();
    } catch (err) {
      setError(err.message || "Failed to save student.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-bold">Username</label>
          <input
            value={form.uname}
            onChange={(e) => update("uname", e.target.value)}
            disabled={!!student}
            required
            className="w-full rounded border border-line bg-surface px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold">Name</label>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
            className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-bold">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-bold">About</label>
        <textarea
          value={form.about}
          onChange={(e) => update("about", e.target.value)}
          rows={4}
          className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-bold">
          {student ? "New password (leave blank to keep current)" : "Password"}
        </label>
        <input
          type="password"
          value={form.pass}
          onChange={(e) => update("pass", e.target.value)}
          required={!student}
          className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Links</h3>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setLinks((current) => [...current, { label: "", url: "" }])
            }
          >
            + Add link
          </Button>
        </div>

        {links.map((link, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              value={link.label}
              onChange={(e) => updateLink(index, "label", e.target.value)}
              placeholder="Label"
              className="w-1/3 min-w-0 rounded border border-line bg-surface px-3 py-2 text-sm"
            />
            <input
              value={link.url}
              onChange={(e) => updateLink(index, "url", e.target.value)}
              placeholder="URL"
              className="min-w-0 flex-1 rounded border border-line bg-surface px-3 py-2 text-sm"
            />
            <Button
              type="button"
              variant="danger"
              onClick={() =>
                setLinks((current) => current.filter((_, i) => i !== index))
              }
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

export default function Students() {
  const [studentList, setStudentList] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(undefined);
  const [error, setError] = useState("");

  async function load() {
    const [list, user] = await Promise.all([
      students.getAll(),
      getCurrentUser(),
    ]);

    setStudentList(list);
    setIsAdmin(user?.role?.toLowerCase() == "admin");
    setError("");
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const [list, user] = await Promise.all([
          students.getAll(),
          getCurrentUser(),
        ]);

        if (active) {
          setStudentList(list);
          setIsAdmin(user?.role?.toLowerCase() == "admin");
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load students.");
        }
      }
    }

    initialLoad();

    return () => {
      active = false;
    };
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!studentList) return <Loading />;

  async function saveStudent(data, original) {
    if (original) {
      await students.update(original._id, data);
    } else {
      await students.add(data);
    }

    await load();
  }

  async function deleteStudent(student) {
    if (!window.confirm(`Delete student ${student.name}?`)) return;

    try {
      await students.remove(student._id);
      await load();
    } catch (err) {
      setError(err.message || "Failed to delete student.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading text-3xl">Students</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Browse students registered on the platform.
          </p>
        </div>

        {isAdmin && (
          <Button onClick={() => setEditingStudent(null)}>+ Add student</Button>
        )}
      </div>

      {isAdmin ? (
        <div className="w-full overflow-x-auto border-2 border-ink">
          <table className="w-full min-w-[750px] border-collapse text-left text-sm">
            <thead className="bg-ink text-paper">
              <tr>
                {["Username", "Name", "Email", "Links", "Actions"].map(
                  (heading) => (
                    <th key={heading} className="p-3 font-bold uppercase">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {studentList.map((student) => (
                <tr key={student._id} className="border-t-2 border-ink">
                  <td className="p-3">{student.uname}</td>
                  <td className="p-3">{student.name}</td>
                  <td className="p-3">{student.email}</td>
                  <td className="p-3">
                    {Object.keys(student.links ?? {}).join(", ") || "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setEditingStudent(student)}
                      >
                        Modify
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => deleteStudent(student)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {studentList.length == 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-ink-soft">
                    No students available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : studentList.length == 0 ? (
        <p className="text-sm text-ink-soft">No students available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {studentList.map((student) => (
            <Card
              key={student._id}
              onClick={() => setSelectedStudent(student)}
              className="cursor-pointer space-y-3 hover:bg-butter"
            >
              <div>
                <h3 className="heading text-xl">{student.name}</h3>
                <p className="text-sm text-ink-soft">{student.email}</p>
              </div>

              {student.about && (
                <p className="text-sm line-clamp-3">{student.about}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {selectedStudent && (
        <Popup
          title={selectedStudent.name}
          onClose={() => setSelectedStudent(null)}
        >
          <StudentDetail student={selectedStudent} />
        </Popup>
      )}

      {editingStudent !== undefined && (
        <Popup
          title={
            editingStudent ? `Modify ${editingStudent.name}` : "Add student"
          }
          onClose={() => setEditingStudent(undefined)}
        >
          <StudentEditor
            student={editingStudent}
            onSave={saveStudent}
            onClose={() => setEditingStudent(undefined)}
          />
        </Popup>
      )}
    </div>
  );
}
