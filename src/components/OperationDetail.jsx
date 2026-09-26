import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CheckCircle, Printer, XCircle, Plus, Trash,
  CaretRight, Package, Warehouse, Calendar, User, Check,
  HandPointing, BoxArrowDown, WarningCircle
} from '@phosphor-icons/react';

const STATUS_STEPS = ['draft', 'waiting', 'ready', 'done'];

export default function OperationDetail({ type, title, listPath }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const isNew = id === 'new';

  const [operation, setOperation] = useState(null);
  const [lines, setLines] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [stepActionLoading, setStepActionLoading] = useState(false);

  // Form state for new operations
  const [contact, setContact] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [sourceLocId, setSourceLocId] = useState('');
  const [destLocId, setDestLocId] = useState('');
  const [newLines, setNewLines] = useState([{ product_id: '', quantity: 1, uom: 'units' }]);

  useEffect(() => {
    fetchLookups();
    if (!isNew) fetchOperation();
  }, [id]);

  async function fetchLookups() {
    const [{ data: prods }, { data: locs }] = await Promise.all([
      supabase.from('products').select('id, name, sku, uom').order('name'),
      supabase.from('locations').select('*').order('name'),
    ]);
    setProducts(prods || []);
    setLocations(locs || []);

    const realLocs = (locs || []).filter(l => !l.is_virtual);
    const virtualLocs = locs || [];

    if (isNew) {
      if (type === 'receipt') {
        const vendorLoc = virtualLocs.find(l => l.short_code === 'VIRT/VENDORS') || virtualLocs.find(l => l.name?.toLowerCase().includes('vendor'));
        setSourceLocId(vendorLoc?.id || '');
        setDestLocId(realLocs[0]?.id || '');
      } else if (type === 'delivery') {
        const custLoc = virtualLocs.find(l => l.short_code === 'VIRT/CUSTOMERS') || virtualLocs.find(l => l.name?.toLowerCase().includes('customer'));
        setSourceLocId(realLocs[0]?.id || '');
        setDestLocId(custLoc?.id || '');
      } else if (type === 'adjustment') {
        const adjLoc = virtualLocs.find(l => l.short_code === 'VIRT/ADJUST') || virtualLocs.find(l => l.name?.toLowerCase().includes('adjust'));
        setSourceLocId(adjLoc?.id || '');
        setDestLocId(realLocs[0]?.id || '');
      } else if (type === 'internal') {
        if (realLocs.length >= 2) {
          setSourceLocId(realLocs[0].id);
          setDestLocId(realLocs[1].id);
        } else if (realLocs.length === 1) {
          setSourceLocId(realLocs[0].id);
          setDestLocId(realLocs[0].id);
        }
      }
    }
  }

  async function fetchOperation() {
    setLoading(true);
    const [{ data: op }, { data: opLines }] = await Promise.all([
      supabase.from('operations')
        .select('*, source_location:locations!operations_source_location_id_fkey(id, name), dest_location:locations!operations_dest_location_id_fkey(id, name)')
        .eq('id', id).maybeSingle(),
      supabase.from('operation_lines')
        .select('*, product:products(name, sku, category)')
        .eq('operation_id', id),
    ]);
    setOperation(op);
    setLines(opLines || []);
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    const validLines = newLines.filter(l => l.product_id && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error('Please add at least one product line with quantity');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.rpc('create_operation', {
      p_type: type,
      p_lines: validLines,
      p_contact: contact || (type === 'receipt' ? 'Vendor' : type === 'delivery' ? 'Customer' : 'Internal Transfer'),
      p_scheduled_date: scheduledDate,
      p_source_location_id: sourceLocId || null,
      p_dest_location_id: destLocId || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${title} ${data.reference} created!`);
      navigate(`${listPath}/${data.operation_id}`);
    }
  }

  // Delivery 3-step action: Step 1: Pick Items (Draft -> Waiting)
  async function handlePickItems() {
    setStepActionLoading(true);
    const { error } = await supabase.from('operations')
      .update({ status: 'waiting', updated_at: new Date().toISOString() })
      .eq('id', operation.id);
    setStepActionLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Items marked as Picked from inventory!');
      fetchOperation();
    }
  }

  // Delivery 3-step action: Step 2: Pack Items (Waiting -> Ready)
  async function handlePackItems() {
    setStepActionLoading(true);
    const { error } = await supabase.from('operations')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', operation.id);
    setStepActionLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Items Packed and marked Ready for dispatch!');
      fetchOperation();
    }
  }

  // Final Step 3: Validate (Decreases/increases stock via ledger RPC)
  async function handleValidate() {
    setValidating(true);
    const { data, error } = await supabase.rpc('validate_operation', {
      p_operation_id: operation.id,
    });
    setValidating(false);
    if (error) {
      toast.error(error.message);
    } else if (data.success === false) {
      if (data.details) {
        const msgs = data.details.map(d => `${d.product}: need ${d.required}, have ${d.available}`);
        toast.error(`Insufficient stock to validate delivery:\n${msgs.join('\n')}`, { duration: 7000 });
      } else {
        toast.error(data.error);
      }
    } else {
      toast.success(`${operation.reference} validated! Stock Ledger updated.`);
      fetchOperation();
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this operation?')) return;
    const { data, error } = await supabase.rpc('cancel_operation', {
      p_operation_id: operation.id,
    });
    if (error) toast.error(error.message);
    else if (data.success === false) toast.error(data.error);
    else { toast.success('Operation cancelled'); fetchOperation(); }
  }

  function handlePrint() {
    window.print();
  }

  function addLine() {
    setNewLines([...newLines, { product_id: '', quantity: 1, uom: 'units' }]);
  }

  function updateLine(index, field, value) {
    const updated = [...newLines];
    updated[index][field] = value;
    if (field === 'product_id') {
      const prod = products.find(p => p.id === value);
      if (prod) updated[index].uom = prod.uom || 'units';
    }
    setNewLines(updated);
  }

  function removeLine(index) {
    setNewLines(newLines.filter((_, i) => i !== index));
  }

  const realLocations = locations.filter(l => !l.is_virtual);
  const showSourcePicker = type === 'delivery' || type === 'internal';
  const showDestPicker = type === 'receipt' || type === 'internal' || type === 'adjustment';

  if (loading) {
    return (
      <div className="app-content">
        <div className="loading-page"><div className="spinner" /></div>
      </div>
    );
  }

  // ==========================================
  // CREATE NEW OPERATION FORM (Clean Alignment)
  // ==========================================
  if (isNew) {
    return (
      <div className="app-content">
        <form onSubmit={handleCreate}>
          <div className="detail-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-md)' }}>
            <div className="detail-header-left">
              <button type="button" className="back-btn" onClick={() => navigate(listPath)}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
                  New {type === 'receipt' ? 'Incoming Receipt' : type === 'delivery' ? 'Outgoing Delivery Order' : title}
                </h2>
                <span className="status-badge draft" style={{ marginTop: '4px' }}>Draft Creation</span>
              </div>
            </div>
            <div className="btn-group">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(listPath)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : <><CheckCircle size={16} /> Create {title}</>}
              </button>
            </div>
          </div>

          {/* Form Meta Fields: Grid with Perfect Alignment */}
          <div className="card" style={{ marginBottom: 'var(--space-lg)', marginTop: 'var(--space-md)' }}>
            <div className="card-header" style={{ marginBottom: 'var(--space-md)' }}>
              <div className="card-title">Document Information</div>
              <div className="card-subtitle">Specify contact party, warehouse destination, and scheduled dates</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
              {/* Partner/Supplier/Contact */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  {type === 'receipt' ? 'Supplier / Vendor Name *' : type === 'delivery' ? 'Customer / Destination Contact *' : 'Contact / Partner'}
                </label>
                <input
                  className="form-input"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder={type === 'receipt' ? 'e.g. Acme Supplier Ltd.' : type === 'delivery' ? 'e.g. Retail Store #4' : 'Optional notes...'}
                  required={type === 'receipt' || type === 'delivery'}
                />
              </div>

              {/* Scheduled Date */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Scheduled Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  required
                />
              </div>

              {/* Source Location */}
              {showSourcePicker && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Source Location *</label>
                  <select
                    className="form-select"
                    value={sourceLocId}
                    onChange={e => setSourceLocId(e.target.value)}
                    required
                  >
                    <option value="">Select source location...</option>
                    {realLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.short_code})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Destination Location */}
              {showDestPicker && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    {type === 'receipt' ? 'Destination Warehouse / Stock Location *' : 'Destination Location *'}
                  </label>
                  <select
                    className="form-select"
                    value={destLocId}
                    onChange={e => setDestLocId(e.target.value)}
                    required
                  >
                    <option value="">Select destination location...</option>
                    {realLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.short_code})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Product Lines Card (Perfect Alignment) */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Product Items & Quantities</div>
                <div className="card-subtitle">List the SKU products and quantities received / moved</div>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
                <Plus size={14} /> Add Product Line
              </button>
            </div>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>Product Item</th>
                    <th style={{ width: '25%' }}>Quantity</th>
                    <th style={{ width: '20%' }}>Unit of Measure (UoM)</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {newLines.map((line, i) => (
                    <tr key={i}>
                      <td>
                        <select
                          className="form-select"
                          value={line.product_id}
                          onChange={e => updateLine(i, 'product_id', e.target.value)}
                          required
                        >
                          <option value="">Select product SKU...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          value={line.quantity}
                          onChange={e => updateLine(i, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0.001"
                          step="any"
                          required
                        />
                      </td>
                      <td>
                        <input
                          className="form-input"
                          value={line.uom}
                          onChange={e => updateLine(i, 'uom', e.target.value)}
                          placeholder="units"
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {newLines.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => removeLine(i)}
                            title="Remove line"
                          >
                            <Trash size={15} style={{ color: 'var(--color-danger)' }} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // EXISTING OPERATION DETAIL VIEW
  // ==========================================
  if (!operation) {
    return (
      <div className="app-content">
        <div className="empty-state">
          <div className="empty-state-title">Operation Not Found</div>
          <button className="btn btn-secondary" onClick={() => navigate(listPath)}>Back to List</button>
        </div>
      </div>
    );
  }

  const isDone = operation.status === 'done';
  const isCancelled = operation.status === 'cancelled';
  const canModify = !isDone && !isCancelled;

  return (
    <div className="app-content">
      {/* Header and Stepped UI Validation Banner */}
      <div className="detail-header">
        <div className="detail-header-left">
          <button className="back-btn" onClick={() => navigate(listPath)}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{operation.reference}</h2>
              <span className={`status-badge ${operation.status}`}>
                {operation.status === 'cancelled' ? 'Canceled' : operation.status}
              </span>
            </div>

            {/* Stepped UI Validation Banner */}
            <div className="status-flow" style={{ marginTop: '10px' }}>
              {STATUS_STEPS.map((step, idx) => {
                const currentIdx = STATUS_STEPS.indexOf(operation.status);
                const isStepActive = operation.status === step;
                const isStepCompleted = currentIdx > idx;

                return (
                  <span key={step} style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={`status-step ${isStepActive ? 'active' : isStepCompleted ? 'completed' : ''}`}>
                      {isStepCompleted && <Check size={12} weight="bold" style={{ marginRight: '4px' }} />}
                      {step.toUpperCase()}
                    </span>
                    {idx < STATUS_STEPS.length - 1 && (
                      <span className="flow-arrow" style={{ margin: '0 6px' }}><CaretRight size={12} /></span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="btn-group">
          {/* Delivery Interactive 3-Step Toolbar: [Pick Items] -> [Pack Items] -> [Validate] */}
          {type === 'delivery' && canModify && (
            <>
              {operation.status === 'draft' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePickItems}
                  disabled={stepActionLoading}
                  title="Step 1: Pick items from warehouse shelves"
                >
                  <HandPointing size={16} /> 1. Pick Items
                </button>
              )}
              {operation.status === 'waiting' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePackItems}
                  disabled={stepActionLoading}
                  title="Step 2: Pack items and mark ready for dispatch"
                >
                  <BoxArrowDown size={16} /> 2. Pack Items
                </button>
              )}
              {/* Step 3: Validate (active on ready or draft/waiting) */}
              <button
                type="button"
                className="btn btn-success"
                onClick={handleValidate}
                disabled={validating}
                title="Step 3: Validate delivery and reduce stock in ledger"
              >
                {validating ? <span className="spinner" /> : <><CheckCircle size={16} /> 3. Validate Delivery</>}
              </button>
            </>
          )}

          {/* Standard Primary "Validate" Button for Receipts, Transfers, Adjustments */}
          {type !== 'delivery' && canModify && (
            <button
              type="button"
              className="btn btn-success"
              onClick={handleValidate}
              disabled={validating}
            >
              {validating ? <span className="spinner" /> : <><CheckCircle size={16} /> Validate Operation</>}
            </button>
          )}

          {/* Print Receipt / Order Document */}
          <button type="button" className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print {type === 'receipt' ? 'Receipt' : 'Order'}
          </button>

          {/* Cancel */}
          {canModify && (
            <button type="button" className="btn btn-danger" onClick={handleCancel}>
              <XCircle size={16} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Screen Card: Document Details Grid with Perfect Organization */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card-header" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-title">
            {type === 'receipt' ? 'Receipt Voucher Details' : `${title} Information`}
          </div>
          <div className="card-subtitle">Audit reference, partners, and location movement</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
          <div className="detail-info-item">
            <div className="detail-info-label">
              {type === 'receipt' ? 'Supplier / Vendor' : type === 'delivery' ? 'Customer / Recipient' : 'Contact / Partner'}
            </div>
            <div className="detail-info-value" style={{ fontWeight: 600 }}>{operation.contact || '—'}</div>
          </div>

          <div className="detail-info-item">
            <div className="detail-info-label">Source Location</div>
            <div className="detail-info-value">{operation.source_location?.name || 'Vendors (External)'}</div>
          </div>

          <div className="detail-info-item">
            <div className="detail-info-label">Destination Location</div>
            <div className="detail-info-value">{operation.dest_location?.name || 'Warehouse Stock'}</div>
          </div>

          <div className="detail-info-item">
            <div className="detail-info-label">Scheduled Date</div>
            <div className="detail-info-value">{operation.scheduled_date || '—'}</div>
          </div>

          <div className="detail-info-item">
            <div className="detail-info-label">Created Date</div>
            <div className="detail-info-value">{new Date(operation.created_at).toLocaleDateString()}</div>
          </div>

          <div className="detail-info-item">
            <div className="detail-info-label">Document Status</div>
            <div className="detail-info-value">
              <span className={`status-badge ${operation.status}`}>
                {operation.status === 'cancelled' ? 'Canceled' : operation.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Lines Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              {type === 'receipt' ? 'Received Products' : 'Product Line Items'}
            </div>
            <div className="card-subtitle">{lines.length} product line(s) recorded</div>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Product Name</th>
                <th style={{ width: '25%' }}>SKU Code</th>
                <th style={{ width: '20%' }}>Quantity</th>
                <th style={{ width: '15%' }}>UoM</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(line => (
                <tr key={line.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {line.product?.name || 'Product Item'}
                  </td>
                  <td className="text-mono">{line.product?.sku || '—'}</td>
                  <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>{parseFloat(line.quantity)}</td>
                  <td>{line.uom || 'units'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          PRINTABLE VOUCHER / RECEIPT (Visible only when printing)
          ========================================================= */}
      <div className="printable-receipt-document" style={{ display: 'none' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>StockSense Inventory Management</h1>
          <h2 style={{ fontSize: '18px', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>
            {type === 'receipt' ? 'Goods Received Note (GRN) / Receipt' : `${title} Voucher`}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Document Reference: <strong>{operation.reference}</strong></p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '13px' }}>
          <div>
            <p><strong>Supplier / Partner:</strong> {operation.contact || 'N/A'}</p>
            <p><strong>Source:</strong> {operation.source_location?.name || 'Vendors'}</p>
            <p><strong>Destination:</strong> {operation.dest_location?.name || 'Warehouse Stock'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p><strong>Date:</strong> {new Date(operation.created_at).toLocaleDateString()}</p>
            <p><strong>Scheduled:</strong> {operation.scheduled_date || 'N/A'}</p>
            <p><strong>Status:</strong> {operation.status.toUpperCase()}</p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>Item #</th>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>Product</th>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>SKU</th>
              <th style={{ textAlign: 'right', padding: '8px 4px' }}>Quantity</th>
              <th style={{ textAlign: 'right', padding: '8px 4px' }}>UoM</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={line.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px 4px' }}>{i + 1}</td>
                <td style={{ padding: '8px 4px' }}>{line.product?.name}</td>
                <td style={{ padding: '8px 4px' }}>{line.product?.sku}</td>
                <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 'bold' }}>{parseFloat(line.quantity)}</td>
                <td style={{ textAlign: 'right', padding: '8px 4px' }}>{line.uom}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', paddingTop: '20px' }}>
          <div style={{ width: '220px', borderTop: '1px solid #000', textAlign: 'center', fontSize: '12px', paddingTop: '6px' }}>
            Received By (Sign / Date)
          </div>
          <div style={{ width: '220px', borderTop: '1px solid #000', textAlign: 'center', fontSize: '12px', paddingTop: '6px' }}>
            Warehouse Storekeeper Approval
          </div>
        </div>
      </div>
    </div>
  );
}
