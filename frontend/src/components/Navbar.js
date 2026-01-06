import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  const linkClass = (path) =>
    `px-4 py-2 font-medium ${
      pathname === path
        ? "text-white bg-blue-600 rounded"
        : "text-gray-700 hover:text-blue-600"
    }`;

  return (
    <div className="bg-white shadow mb-6">
      <div className="max-w-6xl mx-auto flex gap-4 p-4">
        <Link to="/" className={linkClass("/")}>
          Dashboard
        </Link>

        <Link to="/rules" className={linkClass("/rules")}>
          Rules
        </Link>
      </div>
    </div>
  );
}
