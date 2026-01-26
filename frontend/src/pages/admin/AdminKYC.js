import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import { CheckCircle, XCircle, Clock, User, Phone, Mail, CreditCard, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { authHeaders } from '../../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AdminKYC() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab]);

  const fetchRequests = async (status) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/kyc-requests?status=${status}`, { headers: authHeaders() });
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to load KYC requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (kycId) => {
    try {
      await axios.post(`${API_URL}/admin/kyc/${kycId}/approve`, {}, { headers: authHeaders() });
      toast.success('KYC approved successfully');
      fetchRequests(activeTab);
    } catch (error) {
      toast.error('Failed to approve KYC');
    }
  };

  const handleReject = async (kycId) => {
    try {
      await axios.post(`${API_URL}/admin/kyc/${kycId}/reject`, {}, { headers: authHeaders() });
      toast.success('KYC rejected');
      fetchRequests(activeTab);
    } catch (error) {
      toast.error('Failed to reject KYC');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#92400e', icon: Clock },
      approved: { bg: '#d1fae5', color: '#065f46', icon: CheckCircle },
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
    { id: 'approved', label: 'Approved', color: '#10b981' },
    { id: 'rejected', label: 'Rejected', color: '#ef4444' },
    { id: 'all', label: 'All Requests', color: '#6b7280' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Header />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937', marginBottom: '24px' }}>KYC Requests</h1>

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
              onClick={() => setActiveTab(tab.id)}
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
        ) : requests.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '60px 24px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>No {activeTab === 'all' ? '' : activeTab} KYC requests found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="kyc-requests-list">
            {requests.map((request) => (
              <div 
                key={request.id} 
                style={{ 
                  background: 'white', 
                  borderRadius: '16px', 
                  padding: '24px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: request.status === 'approved' ? '2px solid #d1fae5' : 
                          request.status === 'rejected' ? '2px solid #fee2e2' : '2px solid #fef3c7'
                }} 
                data-testid={`kyc-request-${request.id}`}
              >
                {/* Header with User Info and Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={18} color="#667eea" />
                      {request.user?.name || 'Unknown User'}
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} />
                        {request.user?.email}
                      </span>
                      {request.user?.phone && (
                        <span style={{ fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} />
                          {request.user?.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                {/* KYC Details */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '16px', 
                  marginBottom: '16px',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '12px'
                }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                      <CreditCard size={14} />
                      PAN Card Number
                    </label>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937', fontFamily: 'monospace' }}>{request.pan_card}</div>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                      <FileText size={14} />
                      Name on PAN
                    </label>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>{request.pan_name}</div>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                      <CreditCard size={14} />
                      Aadhar Card Number
                    </label>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937', fontFamily: 'monospace' }}>{request.aadhar_card}</div>
                  </div>
                </div>

                {/* Timestamps */}
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '13px', color: '#6b7280' }}>
                  <span>
                    <strong>Submitted:</strong> {request.submitted_at ? format(new Date(request.submitted_at), 'MMM d, yyyy h:mm a') : 'N/A'}
                  </span>
                  {request.reviewed_at && (
                    <span>
                      <strong>Reviewed:</strong> {format(new Date(request.reviewed_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  )}
                </div>

                {/* Action Buttons - Only for pending requests */}
                {request.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => handleApprove(request.id)}
                      data-testid={`approve-kyc-${request.id}`}
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        padding: '12px', 
                        background: '#10b981', 
                        color: 'white', 
                        borderRadius: '12px', 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontSize: '14px', 
                        fontWeight: '600' 
                      }}
                    >
                      <CheckCircle size={18} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      data-testid={`reject-kyc-${request.id}`}
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        padding: '12px', 
                        background: '#ef4444', 
                        color: 'white', 
                        borderRadius: '12px', 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontSize: '14px', 
                        fontWeight: '600' 
                      }}
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
