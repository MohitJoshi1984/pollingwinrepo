import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, User, Wallet, LogOut, LayoutDashboard, Vote } from 'lucide-react';
import { isAuthenticated, removeToken, isAdmin } from '../auth';

export default function Header() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const adminUser = isAdmin();

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  // Common button style for nav items
  const navButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    padding: '10px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    minWidth: '44px',
    height: '44px'
  };

  return (
    <header style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo - Icon only on mobile, full on desktop */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }} data-testid="home-link">
          <Trophy size={28} color="#fbbf24" />
          <h1 className="header-title" style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: 0 }}>The Polling Winner</h1>
        </Link>
        
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {authenticated ? (
            <>
              {adminUser ? (
                <Link to="/admin/dashboard" data-testid="admin-dashboard-link" title="Admin Dashboard">
                  <button style={navButtonStyle}>
                    <LayoutDashboard size={20} />
                    <span className="nav-text">Admin</span>
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/my-polls" data-testid="my-polls-link" title="My Polls">
                    <button style={navButtonStyle}>
                      <Trophy size={20} />
                      <span className="nav-text">My Polls</span>
                    </button>
                  </Link>
                  <Link to="/wallet" data-testid="wallet-link" title="Wallet">
                    <button style={navButtonStyle}>
                      <Wallet size={20} />
                      <span className="nav-text">Wallet</span>
                    </button>
                  </Link>
                  <Link to="/profile" data-testid="profile-link" title="Profile">
                    <button style={navButtonStyle}>
                      <User size={20} />
                      <span className="nav-text">Profile</span>
                    </button>
                  </Link>
                </>
              )}
              <button 
                onClick={handleLogout} 
                data-testid="logout-button" 
                title="Logout"
                style={{ 
                  ...navButtonStyle, 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  color: '#dc2626',
                  border: 'none'
                }}
              >
                <LogOut size={20} />
                <span className="nav-text">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" data-testid="login-link">
                <button style={{ ...navButtonStyle, padding: '10px 20px' }}>
                  <span>Login</span>
                </button>
              </Link>
              <Link to="/register" data-testid="register-link">
                <button className="gradient-button" style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'white', height: '44px' }}>
                  Register
                </button>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* CSS for responsive text hiding */}
      <style>{`
        .nav-text {
          display: none;
        }
        .header-title {
          display: none;
        }
        
        @media (min-width: 768px) {
          .nav-text {
            display: inline;
          }
          .header-title {
            display: block;
          }
        }
      `}</style>
    </header>
  );
}
