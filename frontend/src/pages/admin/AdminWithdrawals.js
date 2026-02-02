import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Pagination from '../../components/Pagination';
import { Wallet, CheckCircle, XCircle, Clock, Edit, X, Save, User, Phone, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { authHeaders } from '../../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('pending');
  const [editingWithdrawal, setEditingWithdrawal] = useState(null);
  const [editForm, setEditForm] = useState({
    status: '',
    transaction_id: '',
    remarks: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWithdrawals(activeTab, currentPage);
  }, [activeTab, currentPage]);

  const fetchWithdrawals = async (status, page) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/withdrawals?status=${status}&page=${page}&limit=15`, { headers: authHeaders() });
      setWithdrawals(response.data.items);
      setTotalPages(response.data.pages);
      setStats(response.data.stats);
    } catch (error) {
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleEditClick = (withdrawal) => {
    setEditingWithdrawal(withdrawal);
    setEditForm({
      status: withdrawal.status || 'pending',
      transaction_id: withdrawal.transaction_id || '',
      remarks: withdrawal.remarks || ''
    });
  };

  const handleCloseEdit = () => {
    setEditingWithdrawal(null);
    setEditForm({ status: '', transaction_id: '', remarks: '' });
  };

  const handleSaveWithdrawal = async () => {
    if (!editingWithdrawal) return;
    
    try {
      setSaving(true);
      await axios.put(
        `${API_URL}/admin/withdrawals/${editingWithdrawal.id}`,
        {
          status: editForm.status,
          transaction_id: editForm.transaction_id || null,
          remarks: editForm.remarks || null
        },
        { headers: authHeaders() }
      );
      toast.success('Withdrawal updated successfully');
      handleCloseEdit();
      fetchWithdrawals(activeTab, currentPage);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update withdrawal');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#92400e', icon: Clock },
      completed: { bg: '#d1fae5', color: '#065f46', icon: CheckCircle },
      rejected: { bg: '#fee2e2', color: '#991b1b', icon: XCircle }
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    
    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px',
        padding: '6px 12px', 
        borderRadius: '20px', 
        fontSize: '12px', 
        fontWeight: '600',
        background: style.bg,
        color: style.color,
        textTransform: 'uppercase'
      }}>
        <Icon size={14} />
        {status}
      </span>
    );
  };

  const tabs = [
    { id: 'pending', label: 'Pending', color: '#f59e0b' },
    { id: 'completed', label: 'Completed', color: '#10b981' },
    { id: 'rejected', label: 'Rejected', color: '#ef4444' },
    { id: 'all', label: 'All', color: '#6b7280' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Header />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Wallet size={32} color="#1f2937" />
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937' }}>Withdrawal Requests</h1>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <Clock size={24} color="#f59e0b" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937' }}>{stats.total_pending}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Pending Requests</div>
            </div>
            <div style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <DollarSign size={24} color="#ef4444" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937' }}>${stats.pending_amount?.toFixed(2) || '0.00'}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Pending Amount</div>
            </div>
            <div style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <CheckCircle size={24} color="#10b981" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937' }}>{stats.total_completed}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Completed</div>
            </div>
            <div style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <DollarSign size={24} color="#10b981" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937' }}>${stats.completed_amount?.toFixed(2) || '0.00'}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Paid</div>
            </div>
            <div style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <DollarSign size={24} color="#667eea" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937' }}>${stats.charges_collected?.toFixed(2) || '0.00'}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Charges Collected</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          background: 'white',
          padding: '8px',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              data-testid={`tab-${tab.id}`}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                background: activeTab === tab.id ? tab.color : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', fontSize: '18px', color: '#6b7280', padding: '60px' }}>Loading...</div>
        ) : withdrawals.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '60px 24px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>No {activeTab === 'all' ? '' : activeTab} withdrawal requests found</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>User</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>UPI ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Amount</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Net Amount</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Transaction ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Requested</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} style={{ borderBottom: '1px solid #e5e7eb' }} data-testid={`withdrawal-row-${withdrawal.id}`}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>{withdrawal.user?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{withdrawal.user?.email}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1f2937', fontFamily: 'monospace' }}>
                        {withdrawal.upi_id || withdrawal.user?.upi_id || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1f2937', fontWeight: '600' }}>
                        ${withdrawal.amount?.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '13px', color: '#1f2937', fontWeight: '600' }}>${withdrawal.net_amount?.toFixed(2)}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Fee: ${withdrawal.withdrawal_charge?.toFixed(2)}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1f2937', fontFamily: 'monospace' }}>
                        {withdrawal.transaction_id || '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#6b7280' }}>
                        {format(new Date(withdrawal.requested_at), 'MMM d, yyyy')}
                        <br />
                        {format(new Date(withdrawal.requested_at), 'h:mm a')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEditClick(withdrawal)}
                          data-testid={`edit-withdrawal-${withdrawal.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          <Edit size={12} />
                          Process
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

      {/* Edit Withdrawal Modal */}
      {editingWithdrawal && (
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
            data-testid="edit-withdrawal-modal"
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Wallet size={24} color="#667eea" />
                Process Withdrawal
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

            {/* Withdrawal Info (Read-only) */}
            <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} />
                      User
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{editingWithdrawal.user?.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{editingWithdrawal.user?.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CreditCard size={12} />
                      UPI ID
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', fontFamily: 'monospace' }}>
                      {editingWithdrawal.upi_id || editingWithdrawal.user?.upi_id || 'Not provided'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Amount</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>${editingWithdrawal.amount?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Fee (10%)</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>-${editingWithdrawal.withdrawal_charge?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Net Amount</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>${editingWithdrawal.net_amount?.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Status */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  data-testid="edit-withdrawal-status"
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
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Transaction ID */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Transaction ID (Bank/UPI Reference)
                </label>
                <input
                  type="text"
                  value={editForm.transaction_id}
                  onChange={(e) => setEditForm({ ...editForm, transaction_id: e.target.value })}
                  placeholder="Enter transaction reference ID"
                  data-testid="edit-withdrawal-txn-id"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '15px',
                    outline: 'none',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Remarks */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Remarks (Optional)
                </label>
                <textarea
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  placeholder="Add any notes or remarks"
                  data-testid="edit-withdrawal-remarks"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Warning for rejection */}
              {editForm.status === 'rejected' && editingWithdrawal.status === 'pending' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: '#fef3c7', borderRadius: '10px' }}>
                  <AlertCircle size={18} color="#92400e" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
                    Rejecting this request will refund ${editingWithdrawal.amount?.toFixed(2)} back to the user's wallet.
                  </p>
                </div>
              )}
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
                onClick={handleSaveWithdrawal}
                disabled={saving}
                data-testid="save-withdrawal-btn"
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
