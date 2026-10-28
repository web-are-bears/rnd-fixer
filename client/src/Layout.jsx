import Navbar from "./components/Navbar";

export default function Layout({ children }) {
  return <div className="min-h-screen">
    <Navbar />
    <main className="mx-auto max-w-3xl p-6">{children}</main>
  </div>;
}
