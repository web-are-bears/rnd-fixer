import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/test/api";
import Input from "@/components/Input";
import Button from "@/components/Button";
import iitbImage from "@/assets/iitb.jpg";

export default function Login() {
  const nav = useNavigate();
  const [uname, setUname] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      await login(uname, pwd);
      nav("/");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-butter">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${iitbImage})` }}
      />

      <div className="absolute inset-0 bg-black/50 lg:hidden" />

      <div
        className="absolute inset-y-0 right-0 hidden w-[55%] lg:block"
        style={{
          filter: "drop-shadow(-12px 0 64px rgba(0, 0, 0, 0.3))",
        }}
      >
        <div
          className="h-full w-full bg-white"
          style={{
            // TODO(s-mv): maybe find a better polygon/curve?
            clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        />
      </div>

      <div
        className={
          "relative z-10 mx-auto flex min-h-screen w-full max-w-md " +
          "items-center justify-center px-6 py-12 lg:ml-auto lg:mr-0 " +
          "lg:max-w-none lg:w-[55%]"
        }
      >
        <div
          className={
            "w-full max-w-md space-y-8 rounded-sm bg-white/90 p-6 shadow-xl " +
            "backdrop-blur-sm sm:p-8 lg:translate-x-2 lg:rounded-none " +
            "lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none"
          }
        >
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-ink-soft">
              IIT BOMBAY
            </p>
            <h1 className="heading mt-3 text-5xl font-bold text-ink">
              R&D Fixer
            </h1>
          </div>

          <form
            onSubmit={submit}
            className={
              "space-y-5 rounded-sm border-2 border-black/5 bg-white p-8" +
              " shadow-[0_12px_40px_rgba(0,0,0,0.1)]"
            }
          >
            <h2 className="heading text-2xl">Sign in.</h2>

            <div className="space-y-4">
              <Input
                placeholder="Username"
                value={uname}
                onChange={(e) => setUname(e.target.value)}
                autoComplete="username"
              />

              <Input
                type="password"
                placeholder="Password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {err && (
              <p className="text-sm font-bold text-red-700" role="alert">
                {err}
              </p>
            )}

            <Button variant="danger" className="w-full py-3" type="submit">
              Sign in
            </Button>

            <p className="text-center text-xs text-ink-soft">
              Happy research-maxxing (?)
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
