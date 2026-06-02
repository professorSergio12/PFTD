import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>404</h1>
      <p>That page doesn&apos;t exist.</p>
      <Link to="/" className="btn btn-primary">
        Go home
      </Link>
    </div>
  );
}