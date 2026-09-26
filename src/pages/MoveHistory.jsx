import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MagnifyingGlass, ClockCounterClockwise, Funnel } from '@phosphor-icons/react';

export default function MoveHistory() {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchMoves(); }, []);

  async function fetchMoves() {
    setLoading(true);
    const params = {};
    if (search) params.p_reference = search;
    if (statusFilter) params.p_state = statusFilter;
    if (dateFrom) params.p_date_from = dateFrom;
    if (dateTo) params.p_date_to = dateTo;

    const { data, error } = await supabase.rpc('get_move_history', params);

    if (error) {
      // Fallback to direct query
      const { data: fallback } = await supabase
        .from('stock_moves')
        .select('*, operation:operations(reference, type, contact, status), product:products(name, sku), source:locations!stock_moves_source_location_id_fkey(name), dest:locations!stock_moves_dest_location_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(200);
      setMoves((fallback || []).map(m => ({
        move_id: m.id,
        reference: m.operation?.reference,
        operation_type: m.operation?.type,
        contact: m.operation?.contact,
        operation_status: m.operation?.status,
        product_name: m.product?.name,
        sku: m.product?.sku,
        source_location: m.source?.name,
        dest_location: m.dest?.name,
        quantity: m.quantity,
        state: m.state,
        done_at: m.done_at,
        created_at: m.created_at,
      })));
    } else {
      setMoves(data || []);
    }
    setLoading(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchMoves();
  }

  const typeLabels = { receipt: 'Receipt', delivery: 'Delivery', internal: 'Transfer', adjustment: 'Adjustment' };

  const filtered = moves.filter(m =>
    (!search || m.reference?.toLowerCase().includes(search.toLowerCase()) || m.product_name?.toLowerCase().includes(search.toLowerCase()) || m.contact?.toLowerCase().includes(search.toLowerCase()))
  );

  // Group moves by reference
  const grouped = {};
  filtered.forEach(m => {
    if (!grouped[m.reference]) grouped[m.reference] = [];
    grouped[m.reference].push(m);
  });

  return (
    <>
      <div className="app-header">
        <div className="app-header-left">
          <ClockCounterClockwise size={22} weight="duotone" style={{ color: 'var(--accent-primary)' }} />
          <h2>Move History</h2>
        </div>
      </div>
      <div className="app-content">
        <div className="toolbar">
          <div className="toolbar-left">
            <form onSubmit={handleSearch} className="search-input">
              <MagnifyingGlass className="search-icon" size={18} />
              <input placeholder="Search reference, product, contact..." value={search} onChange={e => setSearch(e.target.value)} />
            </form>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)}>
              <Funnel size={14} /> Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">State</label>
                <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="draft">Draft</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">From Date</label>
                <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">To Date</label>
                <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary btn-sm" onClick={fetchMoves}>Apply</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <div className="empty-state-title">No moves found</div>
            <div className="empty-state-text">Stock moves will appear here after operations are created.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Contact</th>
                  <th>Product</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.move_id || i}>
                    <td className="text-mono">{m.reference}</td>
                    <td><span className={`status-badge ${m.operation_type}`} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{typeLabels[m.operation_type] || m.operation_type}</span></td>
                    <td>{m.done_at ? new Date(m.done_at).toLocaleDateString() : new Date(m.created_at).toLocaleDateString()}</td>
                    <td>{m.contact || '—'}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.product_name}</td>
                    <td>{m.source_location}</td>
                    <td>{m.dest_location}</td>
                    <td style={{ fontWeight: 600 }}>{parseFloat(m.quantity)}</td>
                    <td><span className={`status-badge ${m.state}`}>{m.state}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
