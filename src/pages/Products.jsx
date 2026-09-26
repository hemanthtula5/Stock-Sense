import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { MagnifyingGlass, Plus, PencilSimple, Trash, X, Check } from '@phosphor-icons/react';

export default function Products() {
  const { isManager } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', category: 'General', uom: 'units', per_unit_weight: 0, reorder_min: 0, reorder_max: 0 });

  useEffect(() => { 
    fetchProducts();
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') {
      setEditingId(null);
      setForm({ name: '', sku: '', category: 'General', uom: 'units', per_unit_weight: 0, reorder_min: 0, reorder_max: 0 });
      setShowModal(true);
    }
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('stock_free_to_use')
      .select('*');
    
    if (error) {
      // Fallback to products table if view fails
      const { data: pdata } = await supabase.from('products').select('*').order('name');
      setProducts(pdata || []);
    } else {
      // Aggregate across locations
      const map = {};
      (data || []).forEach(row => {
        if (!map[row.product_id]) {
          map[row.product_id] = {
            id: row.product_id,
            name: row.product_name,
            sku: row.sku,
            category: row.category,
            uom: row.uom,
            per_unit_weight: row.per_unit_weight,
            reorder_min: row.reorder_min,
            reorder_max: row.reorder_max,
            on_hand: 0,
            free_to_use: 0,
          };
        }
        map[row.product_id].on_hand += Number(row.on_hand || 0);
        map[row.product_id].free_to_use += Number(row.free_to_use || 0);
      });
      setProducts(Object.values(map));
    }
    setLoading(false);
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave(e) {
    e.preventDefault();
    if (editingId) {
      const { error } = await supabase.from('products').update({
        name: form.name, sku: form.sku, category: form.category,
        uom: form.uom, per_unit_weight: form.per_unit_weight,
        reorder_min: form.reorder_min, reorder_max: form.reorder_max,
        updated_at: new Date().toISOString()
      }).eq('id', editingId);
      if (error) toast.error(error.message);
      else toast.success('Product updated');
    } else {
      const { error } = await supabase.from('products').insert([{
        name: form.name, sku: form.sku, category: form.category,
        uom: form.uom, per_unit_weight: form.per_unit_weight,
        reorder_min: form.reorder_min, reorder_max: form.reorder_max,
      }]);
      if (error) toast.error(error.message);
      else toast.success('Product created');
    }
    setShowModal(false);
    setEditingId(null);
    setForm({ name: '', sku: '', category: 'General', uom: 'units', per_unit_weight: 0, reorder_min: 0, reorder_max: 0 });
    fetchProducts();
  }

  function handleEdit(p) {
    setForm({
      name: p.name, sku: p.sku, category: p.category || 'General',
      uom: p.uom || 'units', per_unit_weight: p.per_unit_weight || 0,
      reorder_min: p.reorder_min || 0, reorder_max: p.reorder_max || 0,
    });
    setEditingId(p.id);
    setShowModal(true);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Product deleted'); fetchProducts(); }
  }

  return (
    <>
      <div className="app-header">
        <div className="app-header-left">
          <h2>Stock / Products</h2>
        </div>
      </div>
      <div className="app-content">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-input">
              <MagnifyingGlass className="search-icon" size={18} />
              <input
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="toolbar-right">
            {isManager && (
              <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ name: '', sku: '', category: 'General', uom: 'units', per_unit_weight: 0, reorder_min: 0, reorder_max: 0 }); setShowModal(true); }}>
                <Plus size={16} /> Add Product
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">No products found</div>
            <div className="empty-state-text">Add your first product to get started</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Per Unit Weight</th>
                  <th>On Hand</th>
                  <th>Free to Use</th>
                  <th>UoM</th>
                  {isManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</td>
                    <td className="text-mono">{p.sku}</td>
                    <td>{p.category}</td>
                    <td>{p.per_unit_weight}</td>
                    <td style={{ fontWeight: 600 }}>{p.on_hand ?? '-'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>{p.free_to_use ?? '-'}</td>
                    <td>{p.uom}</td>
                    {isManager && (
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)}>
                            <PencilSimple size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)}>
                            <Trash size={14} />
                          </button>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Product' : 'New Product'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input className="form-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit of Measure</label>
                    <input className="form-input" value={form.uom} onChange={e => setForm({ ...form, uom: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Per Unit Weight</label>
                    <input className="form-input" type="number" step="0.001" value={form.per_unit_weight} onChange={e => setForm({ ...form, per_unit_weight: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reorder Min</label>
                    <input className="form-input" type="number" value={form.reorder_min} onChange={e => setForm({ ...form, reorder_min: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reorder Max</label>
                    <input className="form-input" type="number" value={form.reorder_max} onChange={e => setForm({ ...form, reorder_max: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Check size={16} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
