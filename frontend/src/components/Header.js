import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, User, Wallet, LogOut, LayoutDashboard } from 'lucide-react';
import { isAuthenticated, removeToken, isAdmin } from '../auth';

export default function Header() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const adminUser = isAdmin();

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <header style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }} data-testid="home-link">
          <Trophy size={32} color="#fbbf24" />
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', margin: 0 }}>The Polling Winner</h1>
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {authenticated ? (
            <>
              {adminUser ? (
                <Link to="/admin/dashboard" data-testid="admin-dashboard-link">
                  <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.2)', color: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.3)', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    <LayoutDashboard size={18} />
                    Admin
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/my-polls" data-testid="my-polls-link">
                    <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.2)', color: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.3)', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                      <Trophy size={18} />
                      My Polls
                    </button>
                  </Link>
                  <Link to="/wallet" data-testid="wallet-link">
                    <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.2)', color: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.3)', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                      <Wallet size={18} />
                      Wallet
                    </button>
                  </Link>
                  <Link to="/profile" data-testid="profile-link">
                    <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.2)', color: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.3)', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                      <User size={18} />
                      Profile
                    </button>
                  </Link>
                </>
              )}
              <button onClick={handleLogout} data-testid="logout-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.95)', color: '#dc2626', padding: '8px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" data-testid="login-link">
                <button style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', padding: '8px 24px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.3)', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  Login
                </button>
              </Link>
              <Link to="/register" data-testid="register-link">
                <button className="gradient-button" style={{ color: 'white', padding: '8px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  Register
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
