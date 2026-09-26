import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowDown, ArrowUp, Package, WarningCircle, Cube,
  ArrowsLeftRight, TrendDown, MagnifyingGlass, Funnel,
  Clock, CheckCircle, XCircle, Faders, ArrowRight
} from '@phosphor-icons/react';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [operations, setOperations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Filter State
  const [filterDocType, setFilterDocType] = useState('ALL'); // ALL | receipt | delivery | internal | adjustment
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | draft | waiting | ready | done | cancelled
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [statsRes, opsRes, locsRes, prodsRes] = await Promise.all([
        supabase.rpc('get_dashboard_stats'),
        supabase
          .from('operations')
          .select('*, source_location:locations!operations_source_location_id_fkey(id, name), dest_location:locations!operations_dest_location_id_fkey(id, name), operation_lines(product:products(category))')
          .order('created_at', { ascending: false }),
        supabase.from('locations').select('*').order('name'),
        supabase.from('products').select('category'),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (opsRes.data) setOperations(opsRes.data);
      if (locsRes.data) setLocations(locsRes.data.filter(l => !l.is_virtual));

      // Extract unique categories
      const cats = Array.from(new Set((prodsRes.data || []).map(p => p.category).filter(Boolean)));
      setCategories(cats);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filter operations dynamically
  const filteredOperations = operations.filter(op => {
    // Document Type filter
    if (filterDocType !== 'ALL' && op.type !== filterDocType) return false;

    // Status filter
    if (filterStatus !== 'ALL' && op.status !== filterStatus) return false;

    // Location filter (matches source or destination)
    if (filterLocation !== 'ALL') {
      const matchesSource = op.source_location?.name?.toLowerCase().includes(filterLocation.toLowerCase()) || op.source_location_id === filterLocation;
      const matchesDest = op.dest_location?.name?.toLowerCase().includes(filterLocation.toLowerCase()) || op.dest_location_id === filterLocation;
      if (!matchesSource && !matchesDest) return false;
    }

    // Category filter
    if (filterCategory !== 'ALL') {
      const lines = op.operation_lines || [];
      const hasCategory = lines.some(l => l.product?.category === filterCategory);
      if (!hasCategory) return false;
    }

    // Search query (reference or contact)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = op.reference?.toLowerCase().includes(q);
      const matchContact = op.contact?.toLowerCase().includes(q);
      if (!matchRef && !matchContact) return false;
    }

    return true;
  });

  const s = stats || {};

  // Map operation type to detail URL path
  function getDetailUrl(op) {
    switch (op.type) {
      case 'receipt': return `/receipts/${op.id}`;
      case 'delivery': return `/deliveries/${op.id}`;
      case 'internal': return `/transfers/${op.id}`;
      case 'adjustment': return `/adjustments/${op.id}`;
      default: return `/receipts/${op.id}`;
    }
  }

  return (
    <>
      <div className="app-header">
        <div className="app-header-left">
          <h2>Dashboard</h2>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{profile?.full_name || 'Staff User'}</strong>
        </div>
      </div>

      <div className="app-content">
        {/* Top Operational Summary Cards (Clickable into List Views per wireframe) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <div
            className="summary-card"
            onClick={() => navigate('/receipts')}
            title="Click to view Receipts list"
          >
            <div className="summary-card-icon receipt">
              <ArrowDown size={24} weight="bold" />
            </div>
            <div className="summary-card-title">Receipts Summary</div>
            <div className="summary-card-value">
              {s.receipt_summary?.lots || 0} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>lots</span>
            </div>
            <div className="summary-card-meta">
              {s.receipt_summary?.operations || 0} operations total · Click to view
            </div>
          </div>

          <div
            className="summary-card"
            onClick={() => navigate('/deliveries')}
            title="Click to view Deliveries list"
          >
            <div className="summary-card-icon delivery">
              <ArrowUp size={24} weight="bold" />
            </div>
            <div className="summary-card-title">Deliveries Summary</div>
            <div className="summary-card-value">
              {s.delivery_summary?.lots || 0} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>lots</span>
            </div>
            <div className="summary-card-meta">
              {s.delivery_summary?.operations || 0} operations total · Click to view
            </div>
          </div>
        </div>

        {/* 5 Distinct Live KPI Cards aligned strictly to specification */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginBottom: 'var(--space-xl)' }}>
          {/* KPI 1: Total Products in Stock */}
          <div className="kpi-card">
            <div className="kpi-label">Total Products in Stock</div>
            <div className="kpi-value info">
              <Cube size={26} weight="duotone" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {s.total_products_in_stock || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Active SKU lines
            </span>
          </div>

          {/* KPI 2: Low Stock / Out of Stock Items (Amber/Red Badge) */}
          <div className="kpi-card" style={{ borderColor: (s.low_stock_items > 0 || s.out_of_stock_items > 0) ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)' }}>
            <div className="kpi-label">Low Stock / Out of Stock</div>
            <div className="kpi-value danger">
              <WarningCircle size={26} weight="duotone" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {(s.low_stock_items || 0) + (s.out_of_stock_items || 0)}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <span className="status-badge waiting" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                {s.low_stock_items || 0} Low
              </span>
              <span className="status-badge cancelled" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                {s.out_of_stock_items || 0} Out
              </span>
            </div>
          </div>

          {/* KPI 3: Pending Receipts */}
          <div className="kpi-card">
            <div className="kpi-label">Pending Receipts</div>
            <div className="kpi-value success">
              <ArrowDown size={26} weight="duotone" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {s.pending_receipts?.count || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '4px', display: 'block' }}>
              {s.pending_receipts?.total_lots || 0} incoming lots scheduled
            </span>
          </div>

          {/* KPI 4: Pending Deliveries */}
          <div className="kpi-card">
            <div className="kpi-label">Pending Deliveries</div>
            <div className="kpi-value info">
              <ArrowUp size={26} weight="duotone" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {s.pending_deliveries?.count || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-info)', marginTop: '4px', display: 'block' }}>
              {s.pending_deliveries?.total_lots || 0} outgoing lots pending
            </span>
          </div>

          {/* KPI 5: Internal Transfers Scheduled */}
          <div className="kpi-card">
            <div className="kpi-label">Internal Transfers</div>
            <div className="kpi-value" style={{ color: 'var(--accent-primary)' }}>
              <ArrowsLeftRight size={26} weight="duotone" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {s.scheduled_transfers || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Relocations scheduled
            </span>
          </div>
        </div>

        {/* Dynamic Filter Toolbar Screen */}
        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card-header" style={{ marginBottom: 'var(--space-md)' }}>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Funnel size={18} weight="duotone" style={{ color: 'var(--accent-primary)' }} />
                Dynamic Operations Filter
              </div>
              <div className="card-subtitle">
                Filter documents by type, status, warehouse location, and product category
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setFilterDocType('ALL');
                setFilterStatus('ALL');
                setFilterLocation('ALL');
                setFilterCategory('ALL');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          </div>

          {/* Combined Filters Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            {/* By Document Type */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Document Type</label>
              <select
                className="form-select"
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value)}
              >
                <option value="ALL">All Document Types</option>
                <option value="receipt">Receipts (Incoming)</option>
                <option value="delivery">Delivery Orders (Outgoing)</option>
                <option value="internal">Internal Transfers</option>
                <option value="adjustment">Stock Adjustments</option>
              </select>
            </div>

            {/* By Status */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="waiting">Waiting</option>
                <option value="ready">Ready</option>
                <option value="done">Done</option>
                <option value="cancelled">Canceled</option>
              </select>
            </div>

            {/* By Warehouse / Location */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Warehouse / Location</label>
              <select
                className="form-select"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                <option value="ALL">All Locations</option>
                <option value="Main Warehouse">Main Warehouse</option>
                <option value="Production Floor">Production Floor</option>
                <option value="Rack A">Rack A</option>
                <option value="Rack B">Rack B</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* By Product Category */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Product Category</label>
              <select
                className="form-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="General">General</option>
                <option value="Electronics">Electronics</option>
                <option value="Raw Materials">Raw Materials</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-input" style={{ maxWidth: '100%' }}>
            <MagnifyingGlass className="search-icon" size={18} />
            <input
              placeholder="Search operations by reference (e.g. WH/IN/0001) or contact / partner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Live Filtered Operations Data Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Live Inventory Operations</div>
              <div className="card-subtitle">
                Showing {filteredOperations.length} of {operations.length} document(s)
              </div>
            </div>
          </div>

          {filteredOperations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No matching operations</div>
              <div className="empty-state-text">
                Try adjusting the document type, status, or location filters above.
              </div>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Contact / Partner</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOperations.map(op => (
                    <tr
                      key={op.id}
                      onClick={() => navigate(getDetailUrl(op))}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="text-mono" style={{ fontWeight: 600 }}>{op.reference}</td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontSize: '0.82rem', fontWeight: 500 }}>
                          {op.type}
                        </span>
                      </td>
                      <td>{op.contact || '—'}</td>
                      <td>{op.source_location?.name || '—'}</td>
                      <td>{op.dest_location?.name || '—'}</td>
                      <td>{op.scheduled_date || new Date(op.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${op.status}`}>
                          {op.status === 'cancelled' ? 'Canceled' : op.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          View <ArrowRight size={14} />
                        </span>
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
