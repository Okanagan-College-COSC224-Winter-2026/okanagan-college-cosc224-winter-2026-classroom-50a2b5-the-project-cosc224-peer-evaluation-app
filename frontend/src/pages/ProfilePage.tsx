import { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../util/api';
import AvatarInitials from '../components/AvatarInitials';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({first_name:'',last_name:''});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(()=>{
    getUserProfile()
      .then(r=>r.json())
      .then(data=>{ setProfile(data);
        setForm({first_name:data.first_name,last_name:data.last_name}); })
      .finally(()=>setLoading(false));
  }, []);

  const save = async () => {
    if (!form.first_name || !form.last_name) {
      setError('Name fields cannot be empty'); return;
    }
    setSaving(true); setError(''); setSuccess(false);
    try {
      const res = await updateUserProfile(form);
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated); setEditing(false); setSuccess(true);
      } else {
        const d = await res.json();
        setError(d.error || 'Update failed');
      }
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  if (loading) return <p>Loading...</p>;
  if (!profile) return null;

  return (
    <div className='page-container'>
      <h1>My Profile</h1>
      {success && <p className='success-msg'>Profile updated!</p>}
      {error && <p className='error-msg'>{error}</p>}
      <div className='profile-card'>
        <AvatarInitials
          firstName={profile.first_name}
          lastName={profile.last_name}
          userId={profile.id}
          size={72}
        />
        {!editing ? (<>
          <p><strong>Name:</strong> {profile.first_name} {profile.last_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
          <p><strong>Member since:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
          <button onClick={()=>setEditing(true)}>Edit Name</button>
        </>) : (<>
          <input value={form.first_name} placeholder='First name'
            onChange={e=>setForm({...form,first_name:e.target.value})}/>
          <input value={form.last_name} placeholder='Last name'
            onChange={e=>setForm({...form,last_name:e.target.value})}/>
          <button onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={()=>setEditing(false)}>Cancel</button>
        </>)}
      </div>
    </div>
  );
}
