import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  const linkClass = (path) =>
    `px-4 py-2 rounded-md font-medium transition ${
      pathname === path
        ? "bg-blue-600 text-white shadow"
        : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
    }`;

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold text-blue-600">
          Lead Scoring System
        </h1>

        <nav className="flex gap-2">
          <Link to="/" className={linkClass("/")}>Dashboard</Link>
          <Link to="/rules" className={linkClass("/rules")}>Rules</Link>
        </nav>
      </div>
    </header>
  );
}
