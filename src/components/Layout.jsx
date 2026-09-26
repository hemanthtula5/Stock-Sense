import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import {
  House, Package, Warehouse, ArrowDown, ArrowUp, ArrowsLeftRight,
  Faders, ClockCounterClockwise, Cube, SignOut, User, CaretDown,
  Stack, Plus, CaretRight
} from '@phosphor-icons/react';

export default function Layout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSection1Menu, setShowSection1Menu] = useState(false);
  const [showSection2Menu, setShowSection2Menu] = useState(false);

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const path = location.pathname;
  const isProductsSection = path.startsWith('/products');
  const isOperationsSection = !isProductsSection && !path.startsWith('/profile');

  // Breadcrumb derivation
  let currentBreadcrumb = 'Dashboard';
  if (path.startsWith('/products')) currentBreadcrumb = 'Products & Stock Availability';
  else if (path.startsWith('/receipts')) currentBreadcrumb = 'Receipts (Incoming)';
  else if (path.startsWith('/deliveries')) currentBreadcrumb = 'Delivery Orders (Outgoing)';
  else if (path.startsWith('/transfers')) currentBreadcrumb = 'Internal Transfers';
  else if (path.startsWith('/adjustments')) currentBreadcrumb = 'Inventory Adjustments';
  else if (path.startsWith('/move-history')) currentBreadcrumb = 'Move History';
  else if (path.startsWith('/warehouses')) currentBreadcrumb = 'Warehouses & Locations';
  else if (path.startsWith('/profile')) currentBreadcrumb = 'My Profile';

  return (
    <div className="app-layout">
      {/* Tier 1: Persistent Left Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><Cube size={22} weight="fill" /></div>
          <div>
            <h1>StockSense</h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', letterSpacing: '0.04em' }}>
              INVENTORY MANAGEMENT
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Core</div>
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><House weight="duotone" /></span>
              Dashboard
            </NavLink>
            <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><Package weight="duotone" /></span>
              Products & Stock
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Operations</div>
            <NavLink to="/receipts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><ArrowDown weight="duotone" /></span>
              Receipts
            </NavLink>
            <NavLink to="/deliveries" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><ArrowUp weight="duotone" /></span>
              Delivery Orders
            </NavLink>
            <NavLink to="/transfers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><ArrowsLeftRight weight="duotone" /></span>
              Internal Transfers
            </NavLink>
            <NavLink to="/adjustments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><Faders weight="duotone" /></span>
              Stock Adjustments
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Ledger & Audits</div>
            <NavLink to="/move-history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><ClockCounterClockwise weight="duotone" /></span>
              Move History
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Configuration</div>
            <NavLink to="/warehouses" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><Warehouse weight="duotone" /></span>
              Warehouses & Locations
            </NavLink>
          </div>
        </nav>

        {/* Profile Menu at bottom-left */}
        <div className="sidebar-footer">
          <div className="profile-dropdown">
            {showProfileMenu && (
              <div className="profile-menu">
                <div
                  className="profile-menu-item"
                  onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                >
                  <User size={16} /> My Profile
                </div>
                <div className="profile-menu-item danger" onClick={handleSignOut}>
                  <SignOut size={16} /> Logout
                </div>
              </div>
            )}
            <div
              className="sidebar-user"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title="Click to toggle profile menu"
            >
              <div className="sidebar-user-avatar">{initials}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{profile?.full_name || 'Staff User'}</div>
                <div className="sidebar-user-role">{profile?.role?.replace('_', ' ') || 'Warehouse Staff'}</div>
              </div>
              <CaretDown size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main">
        {/* Tier 2: Top Navigation Bar / Breadcrumbs */}
        <header className="app-header">
          <div className="app-header-left">
            <div className="breadcrumbs">
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>StockSense</span>
              <span className="separator"><CaretRight size={12} /></span>
              <span style={{ color: isProductsSection ? 'var(--accent-primary-hover)' : 'var(--text-muted)', fontWeight: 500 }}>
                {isProductsSection ? 'Products' : 'Operations'}
              </span>
              <span className="separator"><CaretRight size={12} /></span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentBreadcrumb}</span>
            </div>
          </div>

          <div className="app-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Section 1: Products Quick Switcher */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`btn btn-sm ${isProductsSection ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setShowSection1Menu(!showSection1Menu); setShowSection2Menu(false); }}
              >
                <Package size={15} /> Section 1: Products <CaretDown size={12} />
              </button>
              {showSection1Menu && (
                <div className="profile-menu" style={{ top: '100%', bottom: 'auto', right: 0, left: 'auto', minWidth: '220px', marginTop: '6px' }}>
                  <div className="profile-menu-item" onClick={() => { navigate('/products'); setShowSection1Menu(false); }}>
                    <Package size={15} /> All Products & Stock
                  </div>
                  <div className="profile-menu-item" onClick={() => { navigate('/products?new=true'); setShowSection1Menu(false); }}>
                    <Plus size={15} /> Create Product
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Operations Quick Switcher */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`btn btn-sm ${isOperationsSection ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setShowSection2Menu(!showSection2Menu); setShowSection1Menu(false); }}
              >
                <Stack size={15} /> Section 2: Operations <CaretDown size={12} />
              </button>
              {showSection2Menu && (
                <div className="profile-menu" style={{ top: '100%', bottom: 'auto', right: 0, left: 'auto', minWidth: '220px', marginTop: '6px' }}>
                  <div className="profile-menu-item" onClick={() => { navigate('/'); setShowSection2Menu(false); }}>
                    <House size={15} /> Dashboard & Live KPIs
                  </div>
                  <div className="profile-menu-item" onClick={() => { navigate('/receipts'); setShowSection2Menu(false); }}>
                    <ArrowDown size={15} /> Receipts (Incoming)
                  </div>
                  <div className="profile-menu-item" onClick={() => { navigate('/deliveries'); setShowSection2Menu(false); }}>
                    <ArrowUp size={15} /> Delivery Orders (Outgoing)
                  </div>
                  <div className="profile-menu-item" onClick={() => { navigate('/transfers'); setShowSection2Menu(false); }}>
                    <ArrowsLeftRight size={15} /> Internal Transfers
                  </div>
                  <div className="profile-menu-item" onClick={() => { navigate('/adjustments'); setShowSection2Menu(false); }}>
                    <Faders size={15} /> Inventory Adjustments
                  </div>
                  <div className="profile-menu-item" onClick={() => { navigate('/move-history'); setShowSection2Menu(false); }}>
                    <ClockCounterClockwise size={15} /> Move History
                  </div>
                  <div className="profile-menu-item" onClick={() => { navigate('/warehouses'); setShowSection2Menu(false); }}>
                    <Warehouse size={15} /> Warehouse & Locations
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
