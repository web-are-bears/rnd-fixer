import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";
import { isLoggedIn, logout } from "./api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function Layout({ children }) {
  const nav = useNavigate();
  return (
    <div className="min-h-screen">
      <nav className="nav">
        <Link to="/">Dashboard</Link>
        <button
          className="btn btn--light ml-auto"
          onClick={async () => {
            await logout();
            nav("/login");
          }}
        >
          Logout
        </button>
      </nav>
      <main className="mx-auto max-w-3xl p-6">{children}</main>
    </div>
  );
}

function Protected({ children }) {
  return isLoggedIn() ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
