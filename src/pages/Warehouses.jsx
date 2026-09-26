import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, PencilSimple, Trash, X, Check, MapPin } from '@phosphor-icons/react';

export default function Warehouses() {
  const { isManager } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWhModal, setShowWhModal] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [whForm, setWhForm] = useState({ name: '', short_code: '', address: '' });
  const [locForm, setLocForm] = useState({ name: '', short_code: '', warehouse_id: '' });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: wh }, { data: loc }] = await Promise.all([
      supabase.from('warehouses').select('*').order('name'),
      supabase.from('locations').select('*').eq('is_virtual', false).order('name'),
    ]);
    setWarehouses(wh || []);
    setLocations(loc || []);
    setLoading(false);
  }

  async function saveWarehouse(e) {
    e.preventDefault();
    if (editingId) {
      const { error } = await supabase.from('warehouses').update({ ...whForm, updated_at: new Date().toISOString() }).eq('id', editingId);
      if (error) toast.error(error.message);
      else toast.success('Warehouse updated');
    } else {
      const { error } = await supabase.from('warehouses').insert([whForm]);
      if (error) toast.error(error.message);
      else toast.success('Warehouse created');
    }
    setShowWhModal(false);
    setEditingId(null);
    setWhForm({ name: '', short_code: '', address: '' });
    fetchAll();
  }

  async function saveLocation(e) {
    e.preventDefault();
    if (editingId) {
      const { error } = await supabase.from('locations').update({ ...locForm, updated_at: new Date().toISOString() }).eq('id', editingId);
      if (error) toast.error(error.message);
      else toast.success('Location updated');
    } else {
      const { error } = await supabase.from('locations').insert([{ ...locForm, is_virtual: false }]);
      if (error) toast.error(error.message);
      else toast.success('Location created');
    }
    setShowLocModal(false);
    setEditingId(null);
    setLocForm({ name: '', short_code: '', warehouse_id: '' });
    fetchAll();
  }

  async function deleteWarehouse(id) {
    if (!confirm('Delete this warehouse?')) return;
    const { error } = await supabase.from('warehouses').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Deleted'); fetchAll(); }
  }

  async function deleteLocation(id) {
    if (!confirm('Delete this location?')) return;
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Deleted'); fetchAll(); }
  }

  if (loading) return <><div className="app-header"><div className="app-header-left"><h2>Warehouses & Locations</h2></div></div><div className="app-content"><div className="loading-page"><div className="spinner" /></div></div></>;

  return (
    <>
      <div className="app-header">
        <div className="app-header-left"><h2>Warehouses & Locations</h2></div>
      </div>
      <div className="app-content">
        {/* WAREHOUSES */}
        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Warehouses</div>
              <div className="card-subtitle">Manage your warehouse facilities</div>
            </div>
            {isManager && (
              <button className="btn btn-primary btn-sm" onClick={() => { setEditingId(null); setWhForm({ name: '', short_code: '', address: '' }); setShowWhModal(true); }}>
                <Plus size={14} /> Add Warehouse
              </button>
            )}
          </div>
          {warehouses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏭</div>
              <div className="empty-state-title">No warehouses yet</div>
              <div className="empty-state-text">Create your first warehouse to start managing stock locations.</div>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr><th>Name</th><th>Short Code</th><th>Address</th><th>Locations</th>{isManager && <th>Actions</th>}</tr></thead>
                <tbody>
                  {warehouses.map(wh => (
                    <tr key={wh.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{wh.name}</td>
                      <td className="text-mono">{wh.short_code}</td>
                      <td>{wh.address || '—'}</td>
                      <td>{locations.filter(l => l.warehouse_id === wh.id).length}</td>
                      {isManager && (
                        <td>
                          <div className="btn-group">
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(wh.id); setWhForm({ name: wh.name, short_code: wh.short_code, address: wh.address || '' }); setShowWhModal(true); }}><PencilSimple size={14} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => deleteWarehouse(wh.id)}><Trash size={14} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* LOCATIONS */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Locations</div>
              <div className="card-subtitle">Stock storage locations within warehouses</div>
            </div>
            {isManager && (
              <button className="btn btn-primary btn-sm" onClick={() => { setEditingId(null); setLocForm({ name: '', short_code: '', warehouse_id: warehouses[0]?.id || '' }); setShowLocModal(true); }}>
                <Plus size={14} /> Add Location
              </button>
            )}
          </div>
          {locations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><MapPin size={48} /></div>
              <div className="empty-state-title">No locations yet</div>
              <div className="empty-state-text">Create storage locations inside your warehouses.</div>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr><th>Name</th><th>Short Code</th><th>Warehouse</th>{isManager && <th>Actions</th>}</tr></thead>
                <tbody>
                  {locations.map(loc => (
                    <tr key={loc.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{loc.name}</td>
                      <td className="text-mono">{loc.short_code}</td>
                      <td>{warehouses.find(w => w.id === loc.warehouse_id)?.name || '—'}</td>
                      {isManager && (
                        <td>
                          <div className="btn-group">
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(loc.id); setLocForm({ name: loc.name, short_code: loc.short_code, warehouse_id: loc.warehouse_id || '' }); setShowLocModal(true); }}><PencilSimple size={14} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => deleteLocation(loc.id)}><Trash size={14} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Warehouse Modal */}
      {showWhModal && (
        <div className="modal-overlay" onClick={() => setShowWhModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Warehouse' : 'New Warehouse'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowWhModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={saveWarehouse}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={whForm.name} onChange={e => setWhForm({ ...whForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Short Code</label>
                  <input className="form-input" value={whForm.short_code} onChange={e => setWhForm({ ...whForm, short_code: e.target.value })} required placeholder="WH-01" />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-textarea" value={whForm.address} onChange={e => setWhForm({ ...whForm, address: e.target.value })} placeholder="Full address..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowWhModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Check size={16} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocModal && (
        <div className="modal-overlay" onClick={() => setShowLocModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Location' : 'New Location'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowLocModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={saveLocation}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={locForm.name} onChange={e => setLocForm({ ...locForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Short Code</label>
                  <input className="form-input" value={locForm.short_code} onChange={e => setLocForm({ ...locForm, short_code: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Warehouse</label>
                  <select className="form-select" value={locForm.warehouse_id} onChange={e => setLocForm({ ...locForm, warehouse_id: e.target.value })} required>
                    <option value="">Select warehouse...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLocModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Check size={16} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
