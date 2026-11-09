import { useEffect, useState } from "react";
import { getCurrentUser, users, students, profs } from "@/api";
import { ErrorMessage, Loading } from "@/components/Extras";
import Button from "@/components/Button";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({});
  const [password, setPassword] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
          throw new Error("You must be logged in.");
        }

        let currentProfile = null;

        switch (currentUser.role?.toLowerCase()) {
          case "student":
            currentProfile = await students.get(currentUser.uname);
            break;

          case "prof":
            currentProfile = await profs.get(currentUser.uname);
            break;

          case "admin":
            break;

          default:
            throw new Error("Invalid user role.");
        }

        if (!active) return;

        setUser(currentUser);
        setProfile(currentProfile);

        if (currentProfile) {
          setForm({
            name: currentProfile.name || "",
            email: currentProfile.email || "",
            about: currentProfile.about || "",
            number: currentProfile.number || "",
            links: currentProfile.links || [],
          });
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load settings.");
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setSuccess("");
  }

  async function saveProfile(e) {
    e.preventDefault();

    if (!user || !profile) return;

    try {
      setSavingProfile(true);
      setError("");
      setSuccess("");

      const changes = {
        name: form.name.trim(),
        email: form.email.trim(),
        about: form.about.trim(),
        links: form.links,
      };

      if (user.role?.toLowerCase() === "prof") {
        changes.number = form.number.trim();
        await profs.update(user.uname, changes);
      } else {
        await students.update(user.uname, changes);
      }

      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();

    try {
      setSavingPassword(true);
      setError("");
      setSuccess("");

      if (password.current !== user.pass) {
        throw new Error("Current password is incorrect.");
      }

      if (password.next.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      if (password.next !== password.confirm) {
        throw new Error("New passwords do not match.");
      }

      await users.update(user.uname, {
        pass: password.next,
      });

      setUser((current) => ({
        ...current,
        pass: password.next,
      }));

      setPassword({
        current: "",
        next: "",
        confirm: "",
      });

      setSuccess("Password changed successfully.");
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (error && !user) {
    return <ErrorMessage message={error} />;
  }

  if (!user) return <Loading />;

  const role = user.role?.toLowerCase();
  const hasProfile = role === "student" || role === "prof";

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="heading text-3xl">Settings</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Manage your account and personal information.
        </p>
      </div>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </p>
      )}

      {/* Account information */}

      <section className="space-y-4">
        <div>
          <h3 className="heading text-xl">Account</h3>
          <p className="text-sm text-ink-soft">Your login identity.</p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-bold">Username</label>
          <input
            value={user.uname}
            readOnly
            className="w-full rounded border border-line bg-surface px-3 py-2 text-sm opacity-70"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-bold">Role</label>
          <input
            value={
              role === "prof"
                ? "Professor"
                : role.charAt(0).toUpperCase() + role.slice(1)
            }
            readOnly
            className="w-full rounded border border-line bg-surface px-3 py-2 text-sm opacity-70"
          />
        </div>
      </section>

      {/* Personal profile */}

      {hasProfile && (
        <section className="space-y-4">
          <div>
            <h3 className="heading text-xl">Profile</h3>
            <p className="text-sm text-ink-soft">
              Manage the information visible to other users.
            </p>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-bold">Full name</label>
              <input
                value={form.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                required
                className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-bold">Email</label>
              <input
                type="email"
                value={form.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                required
                className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
              />
            </div>

            {role === "prof" && (
              <div className="space-y-1">
                <label className="block text-sm font-bold">
                  Contact number
                </label>
                <input
                  type="tel"
                  value={form.number || ""}
                  onChange={(e) => updateField("number", e.target.value)}
                  className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-bold">About</label>
              <textarea
                value={form.about || ""}
                onChange={(e) => updateField("about", e.target.value)}
                rows={4}
                className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
                placeholder="Tell others a little about yourself..."
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-bold">Links</label>
              {form.links?.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => {
                      const links = [...form.links];
                      links[index] = e.target.value;
                      updateField("links", links);
                    }}
                    className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      updateField(
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
                onClick={() =>
                  updateField("links", [...(form.links || []), ""])
                }
              >
                + Add link
              </Button>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Password */}

      <section className="space-y-4">
        <div>
          <h3 className="heading text-xl">Security</h3>
          <p className="text-sm text-ink-soft">Change your account password.</p>
        </div>

        <form onSubmit={changePassword} className="space-y-4">
          {[
            ["current", "Current password"],
            ["next", "New password"],
            ["confirm", "Confirm new password"],
          ].map(([field, label]) => (
            <div key={field} className="space-y-1">
              <label className="block text-sm font-bold">{label}</label>
              <input
                type="password"
                value={password[field]}
                onChange={(e) =>
                  setPassword((current) => ({
                    ...current,
                    [field]: e.target.value,
                  }))
                }
                required
                minLength={field === "current" ? undefined : 8}
                autoComplete={
                  field === "current" ? "current-password" : "new-password"
                }
                className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
              />
            </div>
          ))}

          <div className="flex justify-end">
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Changing..." : "Change password"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
