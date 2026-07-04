import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      } else if (!avatarPreview) {
        formData.append('avatar', '');
      }

      const { data } = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Profile updated');
      logout();
      window.location.href = '/login';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar = useMemo(() => avatarPreview || user?.avatar || '', [avatarPreview, user?.avatar]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-2xl font-semibold text-gray-600">
            {currentAvatar ? (
              <img src={currentAvatar} alt="Profile avatar" className="h-full w-full object-cover" />
            ) : (
              (user?.name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload profile picture</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="block text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100" />
            <p className="mt-2 text-xs text-gray-500">JPG, PNG, or WEBP up to 5MB</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="flex gap-3">
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" className="btn-secondary" onClick={() => { logout(); window.location.href = '/login'; }}>Logout</button>
        </div>
      </form>
    </div>
  );
}
