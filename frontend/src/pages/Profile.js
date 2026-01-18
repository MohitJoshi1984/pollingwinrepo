import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { User, CreditCard, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authHeaders } from '../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [kycData, setKycData] = useState({ pan_card: '', pan_name: '', aadhar_card: '' });
  const [submittingKyc, setSubmittingKyc] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`, { headers: authHeaders() });
      setProfile(response.data);
      setName(response.data.name);
      setUpiId(response.data.upi_id || '');
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/profile?name=${name}&upi_id=${upiId}`, {}, { headers: authHeaders() });
      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitKyc = async (e) => {
    e.preventDefault();
    setSubmittingKyc(true);
    try {
      await axios.post(`${API_URL}/kyc/submit`, kycData, { headers: authHeaders() });
      toast.success('KYC submitted successfully');
      fetchProfile();
    } catch (error) {
      toast.error('Failed to submit KYC');
    } finally {
      setSubmittingKyc(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Header />
        <div style={{ textAlign: 'center', color: 'white', fontSize: '18px', padding: '60px 20px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', marginBottom: '32px', textAlign: 'center' }}>My Profile</h1>

        <div className="gradient-card" style={{ borderRadius: '20px', padding: '32px', marginBottom: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <User size={24} color="#667eea" />
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Personal Information</h2>
          </div>

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', background: '#f9fafb', color: '#6b7280' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="profile-name"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Phone</label>
              <input
                type="tel"
                value={profile.phone}
                disabled
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', background: '#f9fafb', color: '#6b7280' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>UPI ID (for withdrawals)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                data-testid="profile-upi"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              data-testid="update-profile-button"
              className="gradient-button"
              style={{ width: '100%', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? 0.7 : 1 }}
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        <div className="gradient-card" style={{ borderRadius: '20px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <FileText size={24} color="#667eea" />
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>KYC Verification</h2>
          </div>

          <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', background: profile.kyc_status === 'approved' ? '#d1fae5' : profile.kyc_status === 'pending' ? '#fef3c7' : '#fee2e2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {profile.kyc_status === 'approved' && <CheckCircle size={20} color="#10b981" />}
              {profile.kyc_status === 'pending' && <Clock size={20} color="#f59e0b" />}
              {profile.kyc_status === 'not_submitted' && <XCircle size={20} color="#6b7280" />}
              {profile.kyc_status === 'rejected' && <XCircle size={20} color="#ef4444" />}
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                Status: {profile.kyc_status === 'not_submitted' ? 'Not Submitted' : profile.kyc_status.charAt(0).toUpperCase() + profile.kyc_status.slice(1)}
              </span>
            </div>
          </div>

          {profile.kyc_status === 'not_submitted' || profile.kyc_status === 'rejected' ? (
            <form onSubmit={handleSubmitKyc} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>PAN Card Number</label>
                <input
                  type="text"
                  required
                  value={kycData.pan_card}
                  onChange={(e) => setKycData({ ...kycData, pan_card: e.target.value.toUpperCase() })}
                  placeholder="ABCDE1234F"
                  data-testid="kyc-pan"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Name on PAN Card</label>
                <input
                  type="text"
                  required
                  value={kycData.pan_name}
                  onChange={(e) => setKycData({ ...kycData, pan_name: e.target.value })}
                  data-testid="kyc-pan-name"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Aadhar Card Number</label>
                <input
                  type="text"
                  required
                  value={kycData.aadhar_card}
                  onChange={(e) => setKycData({ ...kycData, aadhar_card: e.target.value })}
                  placeholder="1234 5678 9012"
                  data-testid="kyc-aadhar"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingKyc}
                data-testid="submit-kyc-button"
                className="gradient-button"
                style={{ width: '100%', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: submittingKyc ? 'not-allowed' : 'pointer', opacity: submittingKyc ? 0.7 : 1 }}
              >
                {submittingKyc ? 'Submitting...' : 'Submit KYC'}
              </button>
            </form>
          ) : (
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                {profile.kyc_status === 'pending' && 'Your KYC is under review. You will be notified once approved.'}
                {profile.kyc_status === 'approved' && 'Your KYC is verified. You can now withdraw funds.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
