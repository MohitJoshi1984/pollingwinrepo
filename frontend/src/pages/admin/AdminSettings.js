import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import { authHeaders } from '../../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({ payment_gateway_charge_percent: '', withdrawal_charge_percent: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/settings`, { headers: authHeaders() });
      setSettings(response.data);
      setFormData({
        payment_gateway_charge_percent: response.data.payment_gateway_charge_percent,
        withdrawal_charge_percent: response.data.withdrawal_charge_percent
      });
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/admin/settings`, formData, { headers: authHeaders() });
      toast.success('Settings updated successfully');
      fetchSettings();
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
        <Header />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ textAlign: 'center', fontSize: '18px', color: '#6b7280' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Header />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <Settings size={32} color="#1f2937" />
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937' }}>Settings</h1>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>Charge Settings</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Payment Gateway Charge (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                data-testid="gateway-charge"
                value={formData.payment_gateway_charge_percent}
                onChange={(e) => setFormData({ ...formData, payment_gateway_charge_percent: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
              />
              <p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>This charge will be added to the total amount when users pay for votes.</p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Withdrawal Charge (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                data-testid="withdrawal-charge"
                value={formData.withdrawal_charge_percent}
                onChange={(e) => setFormData({ ...formData, withdrawal_charge_percent: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
              />
              <p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>This charge will be deducted from the withdrawal amount.</p>
            </div>

            <button
              type="submit"
              disabled={updating}
              data-testid="update-settings-button"
              style={{ padding: '14px', background: '#667eea', color: 'white', borderRadius: '12px', border: 'none', cursor: updating ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: '600', opacity: updating ? 0.7 : 1 }}
            >
              {updating ? 'Updating...' : 'Update Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
