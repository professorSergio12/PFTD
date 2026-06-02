import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <h1>Profile</h1>
      </div>

      <div className="card profile-card">
        <div className="profile-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <dl className="profile-details">
          <dt>Name</dt>
          <dd>{user?.name}</dd>
          <dt>Email</dt>
          <dd>{user?.email}</dd>
          <dt>Role</dt>
          <dd className="capitalize">{user?.role}</dd>
        </dl>
      </div>
    </div>
  );
}