import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MagnifyingGlass, Plus, List, Columns, ArrowRight } from '@phosphor-icons/react';

const STATUS_ORDER = ['draft', 'waiting', 'ready', 'done', 'cancelled'];

export default function OperationList({ type, title, icon: Icon, createPath, detailPath }) {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const navigate = useNavigate();

  useEffect(() => { fetchOps(); }, [type]);

  async function fetchOps() {
    setLoading(true);
    const { data } = await supabase
      .from('operations')
      .select('*, source_location:locations!operations_source_location_id_fkey(name), dest_location:locations!operations_dest_location_id_fkey(name)')
      .eq('type', type)
      .order('created_at', { ascending: false });
    setOperations(data || []);
    setLoading(false);
  }

  const filtered = operations.filter(op =>
    op.reference?.toLowerCase().includes(search.toLowerCase()) ||
    op.contact?.toLowerCase().includes(search.toLowerCase())
  );

  const kanbanCols = STATUS_ORDER.map(status => ({
    status,
    items: filtered.filter(op => op.status === status),
  }));

  return (
    <>
      <div className="app-header">
        <div className="app-header-left">
          {Icon && <Icon size={22} weight="duotone" style={{ color: 'var(--accent-primary)' }} />}
          <h2>{title}</h2>
        </div>
      </div>
      <div className="app-content">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-input">
              <MagnifyingGlass className="search-icon" size={18} />
              <input placeholder="Search by reference or contact..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="toolbar-right">
            <div className="view-toggle">
              <button className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}><List size={18} /></button>
              <button className={`view-toggle-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}><Columns size={18} /></button>
            </div>
            <button className="btn btn-primary" onClick={() => navigate(createPath)}>
              <Plus size={16} /> New
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : view === 'list' ? (
          filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No operations found</div>
              <div className="empty-state-text">Create your first {title.toLowerCase()} operation.</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Contact</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Scheduled</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(op => (
                    <tr key={op.id} onClick={() => navigate(`${detailPath}/${op.id}`)} style={{ cursor: 'pointer' }}>
                      <td className="text-mono">{op.reference}</td>
                      <td>{new Date(op.created_at).toLocaleDateString()}</td>
                      <td>{op.contact || '—'}</td>
                      <td>{op.source_location?.name || '—'}</td>
                      <td>{op.dest_location?.name || '—'}</td>
                      <td>{op.scheduled_date || '—'}</td>
                      <td><span className={`status-badge ${op.status}`}>{op.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="kanban-board">
            {kanbanCols.map(col => (
              <div className="kanban-column" key={col.status}>
                <div className="kanban-column-header">
                  <span className="kanban-column-title">{col.status}</span>
                  <span className="kanban-column-count">{col.items.length}</span>
                </div>
                {col.items.map(op => (
                  <div className="kanban-card" key={op.id} onClick={() => navigate(`${detailPath}/${op.id}`)}>
                    <div className="kanban-card-ref">{op.reference}</div>
                    <div className="kanban-card-info">
                      {op.contact || 'No contact'} · {op.scheduled_date || 'No date'}
                    </div>
                  </div>
                ))}
                {col.items.length === 0 && (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>Empty</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
