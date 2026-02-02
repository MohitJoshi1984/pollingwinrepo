import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { Users, Trophy, Clock, DollarSign, Wallet } from 'lucide-react';
import { authHeaders } from '../../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/dashboard-stats`, { headers: authHeaders() });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Header />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937', marginBottom: '32px' }}>Admin Dashboard</h1>

        {loading ? (
          <div style={{ textAlign: 'center', fontSize: '18px', color: '#6b7280' }}>Loading...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <Users size={32} color="#667eea" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }} data-testid="total-users">{stats.total_users}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Users</div>
              </div>

              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <Trophy size={32} color="#f59e0b" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }} data-testid="total-polls">{stats.total_polls}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Polls</div>
              </div>

              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <Clock size={32} color="#10b981" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }} data-testid="active-polls">{stats.active_polls}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Active Polls</div>
              </div>

              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <DollarSign size={32} color="#ef4444" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>${stats.total_revenue.toFixed(2)}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Revenue</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <Link to="/admin/polls" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s ease', ':hover': { transform: 'translateY(-4px)' } }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>Manage Polls</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Create, edit, and manage all polls</p>
                </div>
              </Link>

              <Link to="/admin/kyc" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>KYC Requests</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>{stats.pending_kyc} pending requests</p>
                </div>
              </Link>

              <Link to="/admin/users" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>User Management</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>View and manage all users</p>
                </div>
              </Link>

              <Link to="/admin/transactions" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>Transactions</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>View all transaction details</p>
                </div>
              </Link>

              <Link to="/admin/withdrawals" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wallet size={20} color="#667eea" />
                    Withdrawals
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>{stats.pending_withdrawals || 0} pending requests</p>
                </div>
              </Link>

              <Link to="/admin/settings" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>Settings</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Manage payment and withdrawal charges</p>
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
