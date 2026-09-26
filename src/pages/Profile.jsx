import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { User, Key } from '@phosphor-icons/react';

export default function Profile() {
  const { profile, user, updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success('Password updated!'); setNewPassword(''); }
  }

  return (
    <>
      <div className="app-header">
        <div className="app-header-left"><h2>My Profile</h2></div>
      </div>
      <div className="app-content">
        <div style={{ maxWidth: 600 }}>
          <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div className="sidebar-user-avatar" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>
                  {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                </div>
                <div>
                  <div className="card-title">{profile?.full_name || 'User'}</div>
                  <div className="card-subtitle">{user?.email}</div>
                </div>
              </div>
            </div>
            <div className="detail-info-grid" style={{ marginBottom: 0 }}>
              <div className="detail-info-item">
                <div className="detail-info-label">Role</div>
                <div className="detail-info-value" style={{ textTransform: 'capitalize' }}>{profile?.role?.replace('_', ' ')}</div>
              </div>
              <div className="detail-info-item">
                <div className="detail-info-label">Joined</div>
                <div className="detail-info-value">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title"><Key size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Change Password</div>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" placeholder="Enter new password..." value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
