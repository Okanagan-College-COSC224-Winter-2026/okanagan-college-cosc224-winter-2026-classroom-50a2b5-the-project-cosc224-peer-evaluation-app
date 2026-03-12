import { useState } from 'react';
import { adminCreateUser, adminUpdateUser, AdminUserPayload } from '../util/api';
import type { AdminUser } from '../hooks/useAdminUsers';
import './UserFormModal.css';

interface Props {
  user?: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}

export default function UserFormModal({ user, onClose, onSaved }: Props) {
  const editing = !!user;
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'student',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!editing && !form.password) return 'Password is required for new users';
    if (form.password && form.password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload: AdminUserPayload = { ...form };
      if (!payload.password) delete payload.password;

      const res = editing
        ? await adminUpdateUser(user!.id, payload)
        : await adminCreateUser(payload);

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const d = await res.json();
        setError(d.msg || d.error || 'An error occurred');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{editing ? 'Edit User' : 'Create New User'}</h2>

        {error && <div className="modal-error">{error}</div>}

        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="user@example.com"
          />
        </div>

        <div className="form-group">
          <label>{editing ? 'Password (leave blank to keep)' : 'Password'}</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={editing ? '(unchanged)' : 'Min 6 characters'}
          />
        </div>

        <div className="form-group">
          <label>Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Create User'}
          </button>
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
