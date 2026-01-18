import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import { Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { authHeaders } from '../../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`, { headers: authHeaders() });
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Header />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <Users size={32} color="#1f2937" />
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937' }}>User Management</h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', fontSize: '18px', color: '#6b7280' }}>Loading...</div>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Name</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Email</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Phone</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Cash Wallet</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>KYC Status</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }} data-testid={`user-row-${user.id}`}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>{user.name}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>{user.email}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>{user.phone}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>₹{user.cash_wallet.toFixed(2)}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: user.kyc_status === 'approved' ? '#d1fae5' : user.kyc_status === 'pending' ? '#fef3c7' : '#fee2e2', color: user.kyc_status === 'approved' ? '#065f46' : user.kyc_status === 'pending' ? '#92400e' : '#991b1b' }}>
                          {user.kyc_status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>{format(new Date(user.created_at), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
