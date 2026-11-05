import { useEffect, useState } from "react";
import { users, students, profs, admins } from "@/api";
import { ErrorMessage, Loading } from "@/components/Extras";
import Button from "@/components/Button";
import Popup from "@/components/Popup";

function UserEditor({ onSave, onClose }) {
  const [form, setForm] = useState({
    uname: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await onSave({
        uname: form.uname.trim(),
        role: form.role,
      });

      onClose();
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-bold">Username</label>
        <input
          value={form.uname}
          onChange={(e) =>
            setForm((current) => ({ ...current, uname: e.target.value }))
          }
          required
          className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
          placeholder="Username"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-bold">Role</label>
        <select
          value={form.role}
          onChange={(e) =>
            setForm((current) => ({ ...current, role: e.target.value }))
          }
          className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
        >
          <option value="student">Student</option>
          <option value="prof">Professor</option>
          <option value="admin">Admin</option>
        </select>
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
          {saving ? "Creating..." : "Create account"}
        </Button>
      </div>
    </form>
  );
}

export default function Users() {
  const [userList, setUserList] = useState(null);
  const [editingUser, setEditingUser] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function load() {
    try {
      const [list, studentList, profList, adminList] = await Promise.all([
        users.getAll(),
        students.getAll(),
        profs.getAll(),
        admins.getAll(),
      ]);

      const profiles = {
        student: studentList,
        prof: profList,
        admin: adminList,
      };

      setUserList(
        list.map((user) => ({
          ...user,
          registered:
            profiles[user.role?.toLowerCase()]?.some(
              (profile) => profile.uname === user.uname,
            ) ?? false,
        })),
      );

      setError("");
    } catch (err) {
      setError(err.message || "Failed to load accounts.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const [list, studentList, profList, adminList] = await Promise.all([
          users.getAll(),
          students.getAll(),
          profs.getAll(),
          admins.getAll(),
        ]);

        if (active) {
          const profiles = {
            student: studentList,
            prof: profList,
            admin: adminList,
          };

          setUserList(
            list.map((user) => ({
              ...user,
              registered:
                profiles[user.role?.toLowerCase()]?.some(
                  (profile) => profile.uname === user.uname,
                ) ?? false,
            })),
          );
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load accounts.");
        }
      }
    }

    initialLoad();

    return () => {
      active = false;
    };
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!userList) return <Loading />;

  async function createUser(data) {
    await users.add(data);
    await load();
  }

  async function copyRegistrationLink(uname) {
    const url = `${window.location.origin}/register/${encodeURIComponent(uname)}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(uname);
    } catch {
      setError("Failed to copy registration link.");
    }
  }

  function getRoleLabel(role) {
    switch (role?.toLowerCase()) {
      case "student":
        return "Student";
      case "prof":
        return "Professor";
      case "admin":
        return "Admin";
      default:
        return role;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading text-3xl">User Accounts</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Create accounts and manage onboarding.
          </p>
        </div>

        <Button onClick={() => setEditingUser(true)}>+ Create account</Button>
      </div>

      <div className="w-full overflow-x-auto border-2 border-ink">
        <table className="w-full min-w-[750px] border-collapse text-left text-sm">
          <thead className="bg-ink text-paper">
            <tr>
              {["Username", "Role", "Profile", "Registration"].map(
                (heading) => (
                  <th key={heading} className="p-3 font-bold uppercase">
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {userList.map((user) => (
              <tr key={user.uname} className="border-t-2 border-ink">
                <td className="p-3 font-bold">{user.uname}</td>
                <td className="p-3">{getRoleLabel(user.role)}</td>
                <td className="p-3">
                  {user.registered ? (
                    <span className="font-bold text-green-700">Complete</span>
                  ) : (
                    <span className="font-bold text-amber-700">Incomplete</span>
                  )}
                </td>
                <td className="p-3">
                  {user.registered ? (
                    "—"
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => copyRegistrationLink(user.uname)}
                    >
                      {copied === user.uname ? "Copied!" : "Copy link"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}

            {userList.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-ink-soft">
                  No accounts available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <Popup
          title="Create user account"
          onClose={() => setEditingUser(false)}
        >
          <UserEditor
            onSave={createUser}
            onClose={() => setEditingUser(false)}
          />
        </Popup>
      )}
    </div>
  );
}
