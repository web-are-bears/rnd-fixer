import { useEffect, useState } from "react";
import { getCurrentUser, students, profs } from "@/api";
import { ErrorMessage, Loading } from "@/components/Extras";
import Button from "@/components/Button";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const role = user?.role?.toLowerCase();
  const hasProfile = role === "student" || role === "prof";

  useEffect(() => {
    async function load() {
      try {
        const currentUser = await getCurrentUser();

        if (!currentUser) throw new Error("You must be logged in.");

        setUser(currentUser);

        if (currentUser.role?.toLowerCase() === "admin") return;

        const profile =
          currentUser.role?.toLowerCase() === "prof"
            ? await profs.get(currentUser.uname)
            : await students.get(currentUser.uname);

        setForm({
          name: profile.name || "",
          email: profile.email || "",
          about: profile.about || "",
          number: profile.number || "",
          links: profile.links || [],
        });
      } catch (err) {
        setError(err.message || "Failed to load settings.");
      }
    }

    load();
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccess("");
  }

  async function save(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const changes = {
        name: form.name.trim(),
        email: form.email.trim(),
        about: form.about.trim(),
        links: form.links,
      };

      if (role === "prof") {
        changes.number = form.number.trim();
        await profs.update(user.uname, changes);
      } else {
        await students.update(user.uname, changes);
      }

      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !user) return <ErrorMessage message={error} />;
  if (!user) return <Loading />;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="heading text-3xl">Settings</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Manage your account and personal information.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <section className="space-y-3">
        <h3 className="heading text-xl">Account</h3>

        <div>
          <label className="label">Username</label>
          <input className="input opacity-70" value={user.uname} readOnly />
        </div>

        <div>
          <label className="label">Role</label>
          <input
            className="input opacity-70"
            value={
              role === "prof"
                ? "Professor"
                : role.charAt(0).toUpperCase() + role.slice(1)
            }
            readOnly
          />
        </div>
      </section>

      {hasProfile && (
        <section className="space-y-3">
          <h3 className="heading text-xl">Profile</h3>

          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                value={form.name || ""}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={form.email || ""}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>

            {role === "prof" && (
              <div>
                <label className="label">Contact number</label>
                <input
                  className="input"
                  type="tel"
                  value={form.number || ""}
                  onChange={(e) => update("number", e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="label">About</label>
              <textarea
                className="input"
                rows={4}
                value={form.about || ""}
                onChange={(e) => update("about", e.target.value)}
                placeholder="Tell others a little about yourself..."
              />
            </div>

            <div className="space-y-2">
              <label className="label p-4">Links</label>

              {form.links?.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className="input"
                    type="url"
                    value={link}
                    onChange={(e) => {
                      const links = [...form.links];
                      links[index] = e.target.value;
                      update("links", links);
                    }}
                    placeholder="https://..."
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      update(
                        "links",
                        form.links.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="secondary"
                onClick={() => update("links", [...(form.links || []), ""])}
              >
                + Add link
              </Button>
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="danger" disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
