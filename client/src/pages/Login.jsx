import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";

export default function Login() {
  const nav = useNavigate();
  const [uname, setUname] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(uname, pwd);
      nav("/");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="panel w-full max-w-sm space-y-4">
        <h2 className="heading text-3xl">Login</h2>
        <input
          className="input"
          placeholder="Username"
          value={uname}
          onChange={(e) => setUname(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <button className="btn w-full py-2">Sign in</button>
        {err && <p className="text-sm font-bold text-red-700">{err}</p>}
      </form>
    </div>
  );
}
