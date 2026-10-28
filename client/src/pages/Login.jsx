import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../test/api";
import Input from "../components/Input";
import Button from "../components/Button";

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
        <Input
          placeholder="(username)"
          value={uname}
          onChange={(e) => {
            setUname(e.target.value);
          }}
        />
        <Input
          type="password"
          placeholder="(password)"
          value={pwd}
          onChange={(e) => {
            setPwd(e.target.value);
          }}
        />
        <Button className="w-full py-2" type="submit">
          Sign in
        </Button>
        {err && <p className="text-sm font-bold text-red-700">{err}</p>}
      </form>
    </div>
  );
}
