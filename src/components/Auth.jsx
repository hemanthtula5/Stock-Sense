import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Lock, Envelope, Key, ArrowLeft, CheckCircle, ShieldCheck } from '@phosphor-icons/react';

export default function Auth({ initialView = 'login-email' }) {
  // viewState:
  // - 'login-email' (Main login screen with Password vs OTP tabs)
  // - 'login-otp' (OTP verification for direct OTP login)
  // - 'reset-step1-email' (Step 1: Request reset OTP)
  // - 'reset-step2-otp' (Step 2: Enter 6-digit OTP code)
  // - 'reset-step3-password' (Step 3: Enter new password and redirect to Dashboard)
  const [viewState, setViewState] = useState(
    initialView === 'reset-email' ? 'reset-step1-email' : initialView
  );

  const [authMode, setAuthMode] = useState('password'); // 'password' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const otpInputRef = useRef(null);
  const navigate = useNavigate();

  // Auto-focus OTP input on Step 2
  useEffect(() => {
    if (viewState === 'reset-step2-otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [viewState]);

  // Handle Standard Password Login
  async function handlePasswordLogin(e) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Invalid email or password');
    } else {
      toast.success('Logged in successfully!');
      navigate('/');
    }
  }

  // Handle Send Direct OTP (For OTP Login Mode)
  async function handleSendDirectOtp(e) {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    setLoading(false);

    if (error) {
      if (error.message?.toLowerCase().includes('magic link') || error.message?.toLowerCase().includes('rate limit')) {
        toast.error('Supabase email rate limit reached. Please use Password Login instead.', { duration: 6000 });
        setAuthMode('password');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('OTP code sent to your email!');
      setViewState('login-otp');
    }
  }

  // Handle Verify Direct OTP
  async function handleVerifyDirectOtp(e) {
    e.preventDefault();
    const cleanToken = otpToken.trim();
    if (!cleanToken) {
      toast.error('Please enter the OTP verification code');
      return;
    }

    setLoading(true);
    let { data, error } = await supabase.auth.verifyOtp({
      email,
      token: cleanToken,
      type: 'email'
    });

    if (error) {
      const fallback = await supabase.auth.verifyOtp({
        email,
        token: cleanToken,
        type: 'magiclink'
      });
      if (!fallback.error) {
        data = fallback.data;
        error = null;
      }
    }

    setLoading(false);

    if (error) {
      toast.error(error.message || 'Invalid or expired OTP code');
    } else {
      toast.success('Verified successfully!');
      navigate('/');
    }
  }

  // ========================================================
  // OTP PASSWORD RESET FLOW (3 STEPS STRICT SPEC ALIGNMENT)
  // ========================================================

  // Step 1: Request Password Reset OTP
  async function handleResetStep1Request(e) {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      if (error.message?.toLowerCase().includes('rate limit') || error.message?.toLowerCase().includes('magic link')) {
        toast.error('Email rate limit reached on Supabase. Please use Password Login or register a new user.', { duration: 6000 });
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('6-digit OTP reset code sent to your email!');
      setViewState('reset-step2-otp');
    }
  }

  // Step 2: Verify 6-Digit OTP Token
  async function handleResetStep2VerifyOtp(e) {
    e.preventDefault();
    const cleanToken = otpToken.trim();
    if (!cleanToken || cleanToken.length < 6) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    let verifyError = null;

    // Verify recovery token
    const res1 = await supabase.auth.verifyOtp({
      email,
      token: cleanToken,
      type: 'recovery'
    });

    if (res1.error) {
      const res2 = await supabase.auth.verifyOtp({
        email,
        token: cleanToken,
        type: 'email'
      });
      if (res2.error) {
        verifyError = res1.error;
      }
    }

    setLoading(false);

    if (verifyError) {
      toast.error(verifyError.message || 'Invalid or expired OTP recovery code');
    } else {
      toast.success('OTP code verified! Now set your new password.');
      setViewState('reset-step3-password');
    }
  }

  // Step 3: Set New Password & Immediate Redirect to Dashboard
  async function handleResetStep3SetPassword(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to update password');
    } else {
      toast.success('Password updated successfully! Welcome to StockSense.');
      navigate('/');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📦</div>
          <h1>StockSense</h1>
          <p>
            {viewState === 'login-email' && 'Inventory Management System'}
            {viewState === 'login-otp' && 'Verify OTP Code'}
            {viewState === 'reset-step1-email' && 'Reset Password (Step 1/3)'}
            {viewState === 'reset-step2-otp' && 'Verify 6-Digit OTP (Step 2/3)'}
            {viewState === 'reset-step3-password' && 'Set New Password (Step 3/3)'}
          </p>
        </div>

        {/* =========================================
            VIEW 1: Standard Login Screen
            ========================================= */}
        {viewState === 'login-email' && (
          <>
            {/* Mode Switcher Tabs */}
            <div className="view-toggle" style={{ marginBottom: '20px', display: 'flex', width: '100%' }}>
              <button
                type="button"
                className={`view-toggle-btn ${authMode === 'password' ? 'active' : ''}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}
                onClick={() => setAuthMode('password')}
              >
                Password Login
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${authMode === 'otp' ? 'active' : ''}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}
                onClick={() => setAuthMode('otp')}
              >
                OTP Code Login
              </button>
            </div>

            {authMode === 'password' ? (
              <form className="auth-form" onSubmit={handlePasswordLogin}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.82rem' }}
                    onClick={() => setViewState('reset-step1-email')}
                  >
                    Forgot Password?
                  </button>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <span className="spinner" /> : 'Sign In'}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleSendDirectOtp}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <span className="spinner" /> : 'Send OTP Code'}
                </button>
              </form>
            )}
          </>
        )}

        {/* =========================================
            VIEW 2: Direct OTP Login Code Entry
            ========================================= */}
        {viewState === 'login-otp' && (
          <form className="auth-form" onSubmit={handleVerifyDirectOtp}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>
              We sent a verification code to <strong>{email}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">OTP Verification Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter OTP..."
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value)}
                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 700 }}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Verify & Sign In'}
            </button>
            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.85rem' }}
                onClick={() => setViewState('login-email')}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* =========================================
            OTP RESET STEP 1: Request Email
            ========================================= */}
        {viewState === 'reset-step1-email' && (
          <form className="auth-form" onSubmit={handleResetStep1Request}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Enter your account email to receive a 6-digit OTP code to reset your password.
            </p>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Send 6-Digit Reset OTP'}
            </button>
            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.85rem' }}
                onClick={() => setViewState('login-email')}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* =========================================
            OTP RESET STEP 2: 6-Digit OTP Code with Auto-focus
            ========================================= */}
        {viewState === 'reset-step2-otp' && (
          <form className="auth-form" onSubmit={handleResetStep2VerifyOtp}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <ShieldCheck size={36} weight="duotone" style={{ color: 'var(--accent-primary)', margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Enter the 6-digit OTP recovery code sent to <strong>{email}</strong>
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center' }}>6-Digit OTP Code</label>
              <input
                ref={otpInputRef}
                type="text"
                className="form-input"
                placeholder="123456"
                maxLength={8}
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value.trim())}
                style={{
                  textAlign: 'center',
                  letterSpacing: '6px',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  fontFamily: 'monospace'
                }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Verify Code & Proceed'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '0.85rem' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}
                onClick={handleResetStep1Request}
              >
                Resend OTP Code
              </button>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setViewState('login-email')}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* =========================================
            OTP RESET STEP 3: Set New Password & Direct Dashboard Redirect
            ========================================= */}
        {viewState === 'reset-step3-password' && (
          <form className="auth-form" onSubmit={handleResetStep3SetPassword}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              OTP code verified! Set your new password below. You will be redirected straight to the Inventory Dashboard.
            </p>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Save Password & Go to Dashboard'}
            </button>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          Don't have an account? <Link to="/signup">Create account</Link>
        </div>
      </div>
    </div>
  );
}
