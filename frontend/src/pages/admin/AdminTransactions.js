import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Pagination from '../../components/Pagination';
import { DollarSign, TrendingUp, Edit, X, Save, User, CreditCard, FileText, Vote, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { authHeaders } from '../../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AdminTransactions() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    cf_order_id: '',
    payment_status: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const fetchData = async (page) => {
    try {
      setLoading(true);
      // Fetch orders and stats in parallel
      const [ordersRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/orders?page=${page}&limit=15`, { headers: authHeaders() }),
        axios.get(`${API_URL}/admin/transactions?page=1&limit=1`, { headers: authHeaders() })
      ]);
      setOrders(ordersRes.data.items);
      setTotalPages(ordersRes.data.pages);
      setStats(statsRes.data.stats);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleEditClick = (order) => {
    setEditingOrder(order);
    setEditForm({
      cf_order_id: order.cf_order_id || '',
      payment_status: order.payment_status || 'pending'
    });
  };

  const handleCloseEdit = () => {
    setEditingOrder(null);
    setEditForm({ cf_order_id: '', payment_status: '' });
  };

  const handleSaveOrder = async () => {
    if (!editingOrder) return;
    
    try {
      setSaving(true);
      await axios.put(
        `${API_URL}/admin/orders/${editingOrder.id}`,
        {
          cf_order_id: editForm.cf_order_id || null,
          payment_status: editForm.payment_status
        },
        { headers: authHeaders() }
      );
      toast.success('Order updated successfully');
      handleCloseEdit();
      fetchData(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      success: { bg: '#d1fae5', color: '#065f46' },
      pending: { bg: '#fef3c7', color: '#92400e' },
      failed: { bg: '#fee2e2', color: '#991b1b' }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{ 
        padding: '4px 12px', 
        borderRadius: '8px', 
        fontSize: '12px', 
        fontWeight: '600', 
        background: style.bg, 
        color: style.color,
        textTransform: 'uppercase'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Header />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937', marginBottom: '32px' }}>Transactions & Orders</h1>

        {loading ? (
          <div style={{ textAlign: 'center', fontSize: '18px', color: '#6b7280' }}>Loading...</div>
        ) : (
          <>
            {/* Stats Cards */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                <div style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <DollarSign size={24} color="#667eea" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937' }}>₹{stats.total_vote_amount?.toFixed(2) || '0.00'}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Vote Amount</div>
                </div>

                <div style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <IndianRupee size={24} color="#ef4444" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937' }}>₹{((stats.total_with_gateway || 0) - (stats.total_vote_amount || 0)).toFixed(2)}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Gateway Charges</div>
                </div>

                <div style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <TrendingUp size={24} color="#f59e0b" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937' }}>₹{stats.total_with_gateway?.toFixed(2) || '0.00'}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>With Gateway Charges</div>
                </div>

                <div style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <Vote size={24} color="#10b981" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937' }}>{stats.total_votes || 0}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Votes</div>
                </div>
              </div>
            )}

            {/* Orders Table */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>Payment Orders</h2>
              {orders.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Order ID</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Cashfree ID</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>User</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Poll</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Votes</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Amount</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Date</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }} data-testid={`order-row-${order.id}`}>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1f2937', fontFamily: 'monospace' }}>
                            {order.id?.substring(0, 18)}...
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>
                            {order.cf_order_id || '-'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>{order.user?.name || 'Unknown'}</div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>{order.user?.email}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1f2937', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.poll?.title || 'Unknown Poll'}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1f2937', fontWeight: '600' }}>
                            {order.num_votes}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: '13px', color: '#1f2937', fontWeight: '600' }}>₹{order.base_amount?.toFixed(2)}</div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>With charges: ₹{order.total_amount?.toFixed(2)}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {getStatusBadge(order.payment_status)}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '12px', color: '#6b7280' }}>
                            {format(new Date(order.created_at), 'MMM d, yyyy')}
                            <br />
                            {format(new Date(order.created_at), 'h:mm a')}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleEditClick(order)}
                              data-testid={`edit-order-${order.id}`}
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
              ) : (
                <p style={{ fontSize: '14px', color: '#6b7280' }}>No orders yet</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
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
            data-testid="edit-order-modal"
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={24} color="#667eea" />
                Edit Order
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

            {/* Order Info (Read-only) */}
            <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Order ID</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', fontFamily: 'monospace' }}>{editingOrder.id}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>User</div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{editingOrder.user?.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{editingOrder.user?.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Poll</div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{editingOrder.poll?.title}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Votes</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{editingOrder.num_votes}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Base Amount</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>₹{editingOrder.base_amount?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Amount</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>₹{editingOrder.total_amount?.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Cashfree Order ID */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  <FileText size={14} />
                  Cashfree Order ID
                </label>
                <input
                  type="text"
                  value={editForm.cf_order_id}
                  onChange={(e) => setEditForm({ ...editForm, cf_order_id: e.target.value })}
                  placeholder="cf_xxxxx"
                  data-testid="edit-order-cf-id"
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

              {/* Payment Status */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Payment Status
                </label>
                <select
                  value={editForm.payment_status}
                  onChange={(e) => setEditForm({ ...editForm, payment_status: e.target.value })}
                  data-testid="edit-order-status"
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
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
                <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '8px' }}>
                  ⚠️ Changing status to "Success" will add votes to the poll if not already processed.
                </p>
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
                onClick={handleSaveOrder}
                disabled={saving}
                data-testid="save-order-btn"
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
