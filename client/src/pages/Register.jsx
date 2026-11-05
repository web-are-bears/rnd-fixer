import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { users, students, profs, admins } from "@/api";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { ErrorMessage, Loading } from "@/components/Extras";

export default function Register() {
  const { uname } = useParams();
  const nav = useNavigate();

  const [account, setAccount] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    number: "",
    about: "",
    pass: "",
    confirmPass: "",
  });
  const [links, setLinks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const user = await users.get(uname);

        const collections = {
          student: students,
          prof: profs,
          admin: admins,
        };

        const collection = collections[user.role?.toLowerCase()];

        if (!collection) {
          throw new Error("Unsupported account role.");
        }

        try {
          await collection.get(uname);
          throw new Error("This account has already been registered.");
        } catch (err) {
          if (err.message === "This account has already been registered.") {
            throw err;
          }
          if (err.message !== `Record not found: ${uname}`) {
            throw err;
          }
        }

        if (active) setAccount(user);
      } catch (err) {
        if (active) setError(err.message || "Unable to load registration.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, []);

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
    setError("");

    if (!form.pass) {
      setError("Please choose a password.");
      return;
    }

    if (form.pass !== form.confirmPass) {
      setError("Passwords do not match.");
      return;
    }

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

    const role = account.role.toLowerCase();

    const profile = {
      uname,
      name: form.name.trim(),
      email: form.email.trim(),
      about: form.about.trim(),
      links: normalizedLinks,
    };

    if (role === "prof") {
      profile.number = form.number.trim() || null;
    }

    if (role === "student") {
      profile.final_proj_id = null;
      profile.token_dist = {};
    }

    try {
      setSaving(true);

      const collections = {
        student: students,
        prof: profs,
        admin: admins,
      };

      await collections[role].add(profile);
      await users.update(uname, { pass: form.pass });

      nav("/login", {
        replace: true,
        state: { message: "Registration complete. You can now sign in." },
      });
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;
  if (error && !account) return <ErrorMessage message={error} />;
  if (!account) return <ErrorMessage message="Invalid registration link." />;

  const role = account.role.toLowerCase();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-sm font-semibold tracking-[0.2em] text-ink-soft">
          R&D FIXER
        </p>
        <h1 className="heading mt-2 text-3xl">Complete your registration.</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Registering as <strong>{uname}</strong> ({role}).
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-5 border-2 border-ink bg-surface p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold">Username</label>
            <Input value={uname} disabled />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold">Name</label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold">Email</label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
        </div>

        {role === "prof" && (
          <div>
            <label className="mb-1 block text-sm font-bold">Phone number</label>
            <Input
              value={form.number}
              onChange={(e) => update("number", e.target.value)}
            />
          </div>
        )}

        {role !== "admin" && (
          <div>
            <label className="mb-1 block text-sm font-bold">About</label>
            <textarea
              value={form.about}
              onChange={(e) => update("about", e.target.value)}
              rows={4}
              className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
            />
          </div>
        )}

        {role !== "admin" && (
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
                <Input
                  value={link.label}
                  onChange={(e) => updateLink(index, "label", e.target.value)}
                  placeholder="Label"
                />
                <Input
                  value={link.url}
                  onChange={(e) => updateLink(index, "url", e.target.value)}
                  placeholder="URL"
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
        )}

        <div className="border-t border-line pt-4">
          <h3 className="mb-3 font-bold">Set your password</h3>

          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Password"
              value={form.pass}
              onChange={(e) => update("pass", e.target.value)}
              required
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="Confirm password"
              value={form.confirmPass}
              onChange={(e) => update("confirmPass", e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm font-bold text-red-700" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="danger"
          className="w-full py-3"
          disabled={saving}
        >
          {saving ? "Registering..." : "Complete registration"}
        </Button>

        <p className="text-center text-sm text-ink-soft">
          Already registered?{" "}
          <Link to="/login" className="underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
