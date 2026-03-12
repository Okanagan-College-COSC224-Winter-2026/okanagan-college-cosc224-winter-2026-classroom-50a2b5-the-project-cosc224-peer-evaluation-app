import { useState } from 'react';
import { useAdminUsers } from '../hooks/useAdminUsers';
import type { AdminUser } from '../hooks/useAdminUsers';
import UserFormModal from '../components/UserFormModal';
import './AdminUsersPage.css';

export default function AdminUsersPage() {
  const {
    users,
    total,
    pages,
    page,
    setPage,
    setRole,
    setSearch,
    loading,
    error,
    deactivate,
    reactivate,
    reload,
  } = useAdminUsers();

  const [modal, setModal] = useState<AdminUser | 'create' | null>(null);

  return (
    <div className="admin-users-page">
      <div className="admin-header">
        <h1>User Management</h1>
        <button className="btn-primary" onClick={() => setModal('create')}>
          + New User
        </button>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by name or email..."
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="search-input"
        />
        <select
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="role-filter"
        >
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading && <div className="admin-loading">Loading...</div>}
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={!u.is_active ? 'row-inactive' : ''}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-badge role-${u.role}`}>{u.role}</span>
                </td>
                <td>
                  <span className={`status-chip ${u.is_active ? 'status-active' : 'status-inactive'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="btn-sm" onClick={() => setModal(u)}>
                    Edit
                  </button>
                  {u.is_active ? (
                    <button className="btn-sm btn-danger" onClick={() => deactivate(u.id)}>
                      Deactivate
                    </button>
                  ) : (
                    <button className="btn-sm btn-success" onClick={() => reactivate(u.id)}>
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="no-data">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <span className="total-count">{total} user{total !== 1 ? 's' : ''} total</span>
        <div className="page-controls">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </button>
          <span>
            Page {page} of {pages || 1}
          </span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>

      {modal && (
        <UserFormModal
          user={modal === 'create' ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}
