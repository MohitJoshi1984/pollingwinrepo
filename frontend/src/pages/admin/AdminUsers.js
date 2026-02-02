import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Pagination from '../../components/Pagination';
import { Users, Edit, X, Save, Wallet, Phone, Mail, User, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { authHeaders } from '../../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    upi_id: '',
    cash_wallet: '',
    kyc_status: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const fetchUsers = async (page) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/users?page=${page}&limit=20`, { headers: authHeaders() });
      setUsers(response.data.items);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      upi_id: user.upi_id || '',
      cash_wallet: user.cash_wallet?.toString() || '0',
      kyc_status: user.kyc_status || 'not_submitted'
    });
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
    setEditForm({
      name: '',
      phone: '',
      upi_id: '',
      cash_wallet: '',
      kyc_status: ''
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      setSaving(true);
      await axios.put(
        `${API_URL}/admin/users/${editingUser.id}`,
        {
          name: editForm.name,
          phone: editForm.phone,
          upi_id: editForm.upi_id || null,
          cash_wallet: parseFloat(editForm.cash_wallet) || 0,
          kyc_status: editForm.kyc_status
        },
        { headers: authHeaders() }
      );
      toast.success('User updated successfully');
      handleCloseEdit();
      fetchUsers(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const getKycBadge = (status) => {
    const styles = {
      approved: { bg: '#d1fae5', color: '#065f46' },
      pending: { bg: '#fef3c7', color: '#92400e' },
      rejected: { bg: '#fee2e2', color: '#991b1b' },
      not_submitted: { bg: '#f3f4f6', color: '#6b7280' }
    };
    const style = styles[status] || styles.not_submitted;
    return (
      <span style={{ 
        padding: '4px 12px', 
        borderRadius: '8px', 
        fontSize: '12px', 
        fontWeight: '600', 
        background: style.bg, 
        color: style.color,
        textTransform: 'capitalize'
      }}>
        {status?.replace('_', ' ')}
      </span>
    );
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
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }} data-testid={`user-row-${user.id}`}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{user.name}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>{user.email}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>{user.phone}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>${user.cash_wallet?.toFixed(2)}</td>
                      <td style={{ padding: '16px' }}>{getKycBadge(user.kyc_status)}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>{format(new Date(user.created_at), 'MMM d, yyyy')}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEditClick(user)}
                          data-testid={`edit-user-${user.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={handleCloseEdit}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
            data-testid="edit-user-modal"
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={24} color="#667eea" />
                Edit User
              </h2>
              <button
                onClick={handleCloseEdit}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px',
                  cursor: 'pointer'
                }}
              >
                <X size={20} color="#6b7280" />
              </button>
            </div>

            {/* User Email (Read-only) */}
            <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#f9fafb', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>
                <Mail size={14} />
                Email (cannot be changed)
              </div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>{editingUser.email}</div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  <User size={14} />
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  data-testid="edit-user-name"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  <Phone size={14} />
                  Phone
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  data-testid="edit-user-phone"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* UPI ID */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  <CreditCard size={14} />
                  UPI ID
                </label>
                <input
                  type="text"
                  value={editForm.upi_id}
                  onChange={(e) => setEditForm({ ...editForm, upi_id: e.target.value })}
                  placeholder="user@upi"
                  data-testid="edit-user-upi"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Cash Wallet */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  <Wallet size={14} />
                  Cash Wallet ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.cash_wallet}
                  onChange={(e) => setEditForm({ ...editForm, cash_wallet: e.target.value })}
                  data-testid="edit-user-wallet"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* KYC Status */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  KYC Status
                </label>
                <select
                  value={editForm.kyc_status}
                  onChange={(e) => setEditForm({ ...editForm, kyc_status: e.target.value })}
                  data-testid="edit-user-kyc"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '15px',
                    outline: 'none',
                    background: 'white',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="not_submitted">Not Submitted</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button
                onClick={handleCloseEdit}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  color: '#374151',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving}
                data-testid="save-user-btn"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
