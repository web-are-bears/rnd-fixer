import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { profs, getCurrentUser } from "@/api";
import { ErrorMessage, Loading } from "@/components/Extras";
import Card from "@/components/Card";
import Popup from "@/components/Popup";
import Button from "@/components/Button";

function ProfEditor({ prof, onSave, onClose }) {
  const [form, setForm] = useState({
    uname: prof?.uname ?? "",
    name: prof?.name ?? "",
    email: prof?.email ?? "",
    number: prof?.number ?? "",
    about: prof?.about ?? "",
    pass: "",
  });

  const [links, setLinks] = useState(
    Object.entries(prof?.links ?? {}).map(([label, url]) => ({
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
        i === index ? { ...link, [field]: value } : link,
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

    if (!prof && !form.pass) {
      setError("A password is required for a new professor.");
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
        prof,
      );

      onClose();
    } catch (err) {
      setError(err.message || "Failed to save professor.");
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    ["name", "Name"],
    ["email", "Email"],
    ["number", "Phone number"],
    ["about", "About"],
  ];

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-bold">Username</label>
          <input
            value={form.uname}
            onChange={(e) => update("uname", e.target.value)}
            disabled={!!prof}
            required
            className="w-full rounded border border-line bg-surface px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>

        {fields.map(([key, label]) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-bold">{label}</label>
            <input
              value={form[key]}
              onChange={(e) => update(key, e.target.value)}
              className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-sm font-bold">
          {prof ? "New password (leave blank to keep current)" : "Password"}
        </label>
        <input
          type="password"
          value={form.pass}
          onChange={(e) => update("pass", e.target.value)}
          required={!prof}
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

export default function Profs() {
  const [profList, setProfList] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingProf, setEditingProf] = useState(undefined);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [list, user] = await Promise.all([
        profs.getAll(),
        getCurrentUser(),
      ]);

      setProfList(list);
      setIsAdmin(user?.role === "admin");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load professors.");
    }
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const [list, user] = await Promise.all([
          profs.getAll(),
          getCurrentUser(),
        ]);

        if (active) {
          setProfList(list);
          setIsAdmin(user?.role === "admin");
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to load professors.");
      }
    }

    initialLoad();

    return () => {
      active = false;
    };
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!profList) return <Loading />;

  async function saveProf(data, original) {
    if (original) {
      await profs.update(original.uname, data);
    } else {
      await profs.add(data);
    }

    await load();
  }

  async function deleteProf(prof) {
    if (!window.confirm(`Delete professor ${prof.name}?`)) return;

    await profs.remove(prof.uname);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading text-3xl">Professors</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Browse professors and explore their projects.
          </p>
        </div>

        {isAdmin && (
          <Button onClick={() => setEditingProf(null)}>+ Add professor</Button>
        )}
      </div>

      {isAdmin ? (
        <div className="w-full overflow-x-auto border-2 border-ink">
          <table className="w-full min-w-[750px] border-collapse text-left text-sm">
            <thead className="bg-ink text-paper">
              <tr>
                {[
                  "Username",
                  "Name",
                  "Email",
                  "Number",
                  "Links",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="p-3 font-bold uppercase">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {profList.map((prof) => (
                <tr key={prof.uname} className="border-t-2 border-ink">
                  <td className="p-3">{prof.uname}</td>
                  <td className="p-3">{prof.name}</td>
                  <td className="p-3">{prof.email}</td>
                  <td className="p-3">{prof.number || "—"}</td>
                  <td className="p-3">
                    {Object.keys(prof.links ?? {}).join(", ") || "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setEditingProf(prof)}
                      >
                        Modify
                      </Button>
                      <Button variant="danger" onClick={() => deleteProf(prof)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {profList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-ink-soft">
                    No professors available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : profList.length === 0 ? (
        <p className="text-sm text-ink-soft">No professors available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {profList.map((prof) => (
            <Card key={prof.uname} className="space-y-3">
              <div>
                <h3 className="heading text-xl">{prof.name}</h3>
                <p className="text-sm text-ink-soft">{prof.email}</p>
              </div>

              {prof.about && <p className="text-sm">{prof.about}</p>}

              {prof.links && Object.entries(prof.links).length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {Object.entries(prof.links).map(([label, url]) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-bold underline hover:text-ink-soft"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              )}

              <Link
                to={`/projects?prof=${encodeURIComponent(prof.uname)}`}
                className="inline-block text-sm font-bold underline hover:text-ink-soft"
              >
                View projects
              </Link>
            </Card>
          ))}
        </div>
      )}

      {editingProf !== undefined && (
        <Popup
          title={editingProf ? `Modify ${editingProf.name}` : "Add professor"}
          onClose={() => setEditingProf(undefined)}
        >
          <ProfEditor
            prof={editingProf}
            onClose={() => setEditingProf(undefined)}
            onSave={saveProf}
          />
        </Popup>
      )}
    </div>
  );
}
