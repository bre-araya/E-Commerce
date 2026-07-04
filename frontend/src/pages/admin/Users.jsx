import { useEffect, useMemo, useState } from 'react';
import api from '../../utils/axios';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { FiPlus, FiUser, FiTrash2 } from 'react-icons/fi';

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const canCreateAdmin = useMemo(() => true, []); // backend enforces permission on role=admin creation

  const fetchUsers = async (p = page) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/users?page=${p}&limit=${limit}`);
      setUsers(data.users);
      setTotalPages(data.pages || 1);
      setPage(data.page || p);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email and password are required');
      return;
    }

    setCreating(true);
    try {
      await api.post('/admin/users', form);
      toast.success('User created');
      setForm({ name: '', email: '', password: '', role: 'user' });
      fetchUsers(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const updateRole = async (id, role) => {
    setUpdatingId(id);
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      toast.success(`Role updated to ${role}`);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role } : u)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const statusesBar = (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">Manage accounts and roles</p>
      </div>

      <div className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </div>
    </div>
  );

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {statusesBar}

      {/* Create user */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiPlus /> Create user
        </h2>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              className="input-field"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              type="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              className="input-field"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••"
              type="password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select
              className="input-field"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              disabled={!canCreateAdmin && form.role === 'admin'}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Backend enforces admin permissions.</p>
          </div>

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button type="submit" disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <FiUser />
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>

      {/* Users list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['User', 'Email', 'Role', 'Verified', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar || 'https://via.placeholder.com/40'}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{u._id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <select
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={u.role}
                      disabled={updatingId === u._id}
                      onChange={(e) => updateRole(u._id, e.target.value)}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {u.isVerified ? 'Verified' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {/* Optional: future delete endpoint */}
                    <button
                      type="button"
                      disabled
                      className="opacity-40 cursor-not-allowed text-red-600 hover:text-red-700"
                      title="Not implemented"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-16 text-gray-400">No users found</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-5">
        <button
          className="btn-secondary"
          disabled={page <= 1}
          onClick={() => fetchUsers(page - 1)}
        >
          Previous
        </button>
        <button
          className="btn-secondary"
          disabled={page >= totalPages}
          onClick={() => fetchUsers(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

