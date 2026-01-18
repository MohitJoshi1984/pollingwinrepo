import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, User, Wallet, LogOut, LayoutDashboard, Vote, Home } from 'lucide-react';
import { isAuthenticated, removeToken, isAdmin } from '../auth';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isAuthenticated();
  const adminUser = isAdmin();

  const handleLogout = () => {
    removeToken();
    navigate('/');
  };

  // Check if current path matches
  const isActive = (path) => location.pathname === path;

  // Common button style for nav items
  const getNavButtonStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: isActive(path) ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.2)',
    color: isActive(path) ? '#667eea' : 'white',
    padding: '10px',
    borderRadius: '12px',
    border: isActive(path) ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.3)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    minWidth: '44px',
    height: '44px',
    boxShadow: isActive(path) ? '0 4px 12px rgba(251, 191, 36, 0.4)' : 'none'
  });

  return (
    <header style={{ background: adminUser ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo - Different for admin and user */}
        {adminUser ? (
          <Link to="/admin/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }} data-testid="admin-home-link">
            <Home size={28} color="#fbbf24" />
            <h1 className="header-title" style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: 0 }}>Admin Panel</h1>
          </Link>
        ) : (
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }} data-testid="home-link">
            <Trophy size={28} color="#fbbf24" />
            <h1 className="header-title" style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: 0 }}>The Polling Winner</h1>
          </Link>
        )}
        
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {authenticated ? (
            <>
              {adminUser ? (
                <Link to="/admin/dashboard" data-testid="admin-dashboard-link" title="Admin Dashboard">
                  <button style={getNavButtonStyle('/admin/dashboard')}>
                    <LayoutDashboard size={20} />
                    <span className="nav-text">Dashboard</span>
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/my-polls" data-testid="my-polls-link" title="My Polls">
                    <button style={getNavButtonStyle('/my-polls')}>
                      <Vote size={20} />
                      <span className="nav-text">My Polls</span>
                    </button>
                  </Link>
                  <Link to="/wallet" data-testid="wallet-link" title="Wallet">
                    <button style={getNavButtonStyle('/wallet')}>
                      <Wallet size={20} />
                      <span className="nav-text">Wallet</span>
                    </button>
                  </Link>
                  <Link to="/profile" data-testid="profile-link" title="Profile">
                    <button style={getNavButtonStyle('/profile')}>
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.95)', 
                  color: '#dc2626',
                  padding: '10px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '44px',
                  height: '44px'
                }}
              >
                <LogOut size={20} />
                <span className="nav-text">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" data-testid="login-link">
                <button style={{ ...getNavButtonStyle('/login'), padding: '10px 20px' }}>
                  <span>Login</span>
                </button>
              </Link>
              <Link to="/register" data-testid="register-link">
                <button 
                  style={{ 
                    padding: '10px 20px', 
                    borderRadius: '12px', 
                    border: isActive('/register') ? '2px solid #fbbf24' : 'none', 
                    cursor: 'pointer', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'white', 
                    height: '44px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: isActive('/register') ? '0 4px 12px rgba(251, 191, 36, 0.4)' : 'none'
                  }}
                >
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
