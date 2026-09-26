import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Faders, Plus, CheckCircle, Warning, ArrowRight,
  ArrowsDownUp, Package, Warehouse, MagnifyingGlass
} from '@phosphor-icons/react';

export default function Adjustments() {
  const { isManager } = useAuth();
  const navigate = useNavigate();

  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Single-screen Adjustment Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [currentOnHand, setCurrentOnHand] = useState(0);
  const [countedQty, setCountedQty] = useState('');
  const [reasonNote, setReasonNote] = useState('Routine Physical Cycle Count');
  const [checkingStock, setCheckingStock] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  // When product or location changes, fetch live on-hand quantity
  useEffect(() => {
    if (selectedProductId && selectedLocationId) {
      fetchLiveOnHand(selectedProductId, selectedLocationId);
    } else {
      setCurrentOnHand(0);
    }
  }, [selectedProductId, selectedLocationId]);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [opsRes, prodsRes, locsRes] = await Promise.all([
        supabase
          .from('operations')
          .select('*, source_location:locations!operations_source_location_id_fkey(name), dest_location:locations!operations_dest_location_id_fkey(name), operation_lines(quantity, product:products(name, sku))')
          .eq('type', 'adjustment')
          .order('created_at', { ascending: false }),
        supabase.from('products').select('id, name, sku, uom').order('name'),
        supabase.from('locations').select('*').eq('is_virtual', false).order('name'),
      ]);

      if (opsRes.data) setAdjustments(opsRes.data);
      if (prodsRes.data) {
        setProducts(prodsRes.data);
        if (prodsRes.data.length > 0) setSelectedProductId(prodsRes.data[0].id);
      }
      if (locsRes.data) {
        setLocations(locsRes.data);
        if (locsRes.data.length > 0) setSelectedLocationId(locsRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLiveOnHand(prodId, locId) {
    setCheckingStock(true);
    try {
      const { data } = await supabase
        .from('stock_on_hand')
        .select('on_hand')
        .eq('product_id', prodId)
        .eq('location_id', locId)
        .maybeSingle();

      const qty = Number(data?.on_hand || 0);
      setCurrentOnHand(qty);
      if (countedQty === '') setCountedQty(qty);
    } catch (e) {
      console.error('Failed to get on_hand:', e);
      setCurrentOnHand(0);
    } finally {
      setCheckingStock(false);
    }
  }

  // Calculate live discrepancy
  const counted = parseFloat(countedQty);
  const diff = isNaN(counted) ? 0 : counted - currentOnHand;

  // Commit Adjustment (Creates operation + lines + validates directly)
  async function handleCommitAdjustment(e) {
    e.preventDefault();
    if (!selectedProductId || !selectedLocationId) {
      toast.error('Please select both product and warehouse location');
      return;
    }
    if (isNaN(counted) || counted < 0) {
      toast.error('Please enter a valid counted quantity');
      return;
    }

    if (diff === 0) {
      toast('Counted quantity equals current inventory — no discrepancy to adjust.', { icon: 'ℹ️' });
      return;
    }

    setCommitting(true);
    try {
      const prod = products.find(p => p.id === selectedProductId);
      const adjQty = Math.abs(diff);

      // Create operation via RPC
      const { data: createData, error: createError } = await supabase.rpc('create_operation', {
        p_type: 'adjustment',
        p_lines: [{ product_id: selectedProductId, quantity: adjQty, uom: prod?.uom || 'units' }],
        p_contact: reasonNote || 'Inventory Physical Count',
        p_scheduled_date: new Date().toISOString().split('T')[0],
        p_source_location_id: selectedLocationId,
        p_dest_location_id: null,
      });

      if (createError) throw createError;

      // Validate operation immediately to update ledger
      const { data: valData, error: valError } = await supabase.rpc('validate_operation', {
        p_operation_id: createData.operation_id,
      });

      if (valError) throw valError;

      toast.success(`Stock adjusted! Ledger record ${createData.reference} generated (${diff > 0 ? '+' : ''}${diff})`);
      fetchInitialData();
      fetchLiveOnHand(selectedProductId, selectedLocationId);
    } catch (err) {
      toast.error(err.message || 'Failed to apply adjustment');
    } finally {
      setCommitting(false);
    }
  }

  const filteredAdjustments = adjustments.filter(a =>
    a.reference?.toLowerCase().includes(search.toLowerCase()) ||
    a.contact?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="app-header">
        <div className="app-header-left">
          <Faders size={22} weight="duotone" style={{ color: 'var(--accent-primary)' }} />
          <h2>Stock Adjustments</h2>
        </div>
      </div>

      <div className="app-content">
        {/* Single-Screen Quick Stock Adjustment Panel */}
        <div className="card" style={{ marginBottom: 'var(--space-xl)', borderLeft: '4px solid var(--accent-primary)' }}>
          <div className="card-header" style={{ marginBottom: 'var(--space-md)' }}>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowsDownUp size={20} weight="duotone" style={{ color: 'var(--accent-primary)' }} />
                Single-Screen Stock Adjustment
              </div>
              <div className="card-subtitle">
                Select product & location, record physical count, review calculated discrepancy, and update stock ledger
              </div>
            </div>
          </div>

          <form onSubmit={handleCommitAdjustment}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              {/* Product Selector */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Product SKU</label>
                <select
                  className="form-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              {/* Warehouse / Location Selector */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Location</label>
                <select
                  className="form-select"
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  required
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.short_code})</option>
                  ))}
                </select>
              </div>

              {/* Counted Quantity Input */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Counted Physical Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  step="any"
                  placeholder="Enter physical count..."
                  value={countedQty}
                  onChange={(e) => setCountedQty(e.target.value)}
                  required
                />
              </div>

              {/* Reason / Reference Note */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Reason / Audit Note</label>
                <input
                  className="form-input"
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                  placeholder="e.g. Broken items, routine cycle count..."
                />
              </div>
            </div>

            {/* Live Discrepancy Indicator Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              padding: '16px 20px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              marginBottom: 'var(--space-md)'
            }}>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current In-Stock</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {checkingStock ? '...' : currentOnHand}
                  </div>
                </div>

                <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>→</div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Counted Quantity</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {isNaN(counted) ? 0 : counted}
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Calculated Discrepancy</div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: diff > 0 ? 'var(--color-success)' : diff < 0 ? 'var(--color-danger)' : 'var(--text-muted)'
                  }}>
                    {diff > 0 ? `+${diff} (Surplus Gain)` : diff < 0 ? `${diff} (Inventory Loss)` : '0 (Balanced)'}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={committing || diff === 0}
                style={{ minWidth: '180px' }}
              >
                {committing ? <span className="spinner" /> : <><CheckCircle size={16} /> Commit Adjustment</>}
              </button>
            </div>
          </form>
        </div>

        {/* Adjustments History Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Adjustment History & Ledger</div>
              <div className="card-subtitle">All historical stock reconciliation records</div>
            </div>
            <div className="search-input">
              <MagnifyingGlass className="search-icon" size={16} />
              <input
                placeholder="Search by reference or note..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="loading-page"><div className="spinner" /></div>
          ) : filteredAdjustments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚖️</div>
              <div className="empty-state-title">No adjustments recorded</div>
              <div className="empty-state-text">Use the form above to record your first stock reconciliation.</div>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Audit Reason</th>
                    <th>Adjusted Location</th>
                    <th>Items Adjusted</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdjustments.map(adj => (
                    <tr
                      key={adj.id}
                      onClick={() => navigate(`/adjustments/${adj.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="text-mono" style={{ fontWeight: 600 }}>{adj.reference}</td>
                      <td>{new Date(adj.created_at).toLocaleDateString()}</td>
                      <td>{adj.contact || 'Routine Count'}</td>
                      <td>{adj.source_location?.name || 'Warehouse Stock'}</td>
                      <td>
                        {(adj.operation_lines || []).map(l => `${l.product?.name || 'Item'} (${l.quantity})`).join(', ') || '1 line'}
                      </td>
                      <td>
                        <span className={`status-badge ${adj.status}`}>{adj.status}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem' }}>View <ArrowRight size={13} /></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
