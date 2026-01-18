import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authHeaders } from '../../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AdminKYC() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/kyc-requests`, { headers: authHeaders() });
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
      fetchRequests();
    } catch (error) {
      toast.error('Failed to approve KYC');
    }
  };

  const handleReject = async (kycId) => {
    try {
      await axios.post(`${API_URL}/admin/kyc/${kycId}/reject`, {}, { headers: authHeaders() });
      toast.success('KYC rejected');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to reject KYC');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Header />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937', marginBottom: '32px' }}>KYC Requests</h1>

        {loading ? (
          <div style={{ textAlign: 'center', fontSize: '18px', color: '#6b7280' }}>Loading...</div>
        ) : requests.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '60px 24px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>No pending KYC requests</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} data-testid="kyc-requests-list">
            {requests.map((request) => (
              <div key={request.id} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} data-testid={`kyc-request-${request.id}`}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{request.user?.name || 'Unknown'}</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>{request.user?.email}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>PAN Card</label>
                    <div style={{ fontSize: '14px', color: '#1f2937' }}>{request.pan_card}</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Name on PAN</label>
                    <div style={{ fontSize: '14px', color: '#1f2937' }}>{request.pan_name}</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Aadhar Card</label>
                    <div style={{ fontSize: '14px', color: '#1f2937' }}>{request.aadhar_card}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleApprove(request.id)}
                    data-testid={`approve-kyc-${request.id}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#10b981', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    data-testid={`reject-kyc-${request.id}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#ef4444', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
