import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authHeaders } from '../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (orderId) {
      verifyPayment();
    } else {
      setStatus('error');
      setMessage('Order ID not found');
    }
  }, [orderId]);

  const verifyPayment = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/payments/verify?order_id=${orderId}`,
        {},
        { headers: authHeaders() }
      );

      if (response.data.status === 'success') {
        setStatus('success');
        setMessage(response.data.message);
      } else {
        setStatus('pending');
        setMessage(response.data.message);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to verify payment');
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 24px' }}>
        <div className="gradient-card" style={{ borderRadius: '24px', padding: '60px 40px', textAlign: 'center', boxShadow: '0 25px 70px rgba(0,0,0,0.35)' }}>
          {status === 'loading' && (
            <div>
              <Loader2 size={64} color="#667eea" style={{ margin: '0 auto 24px', animation: 'spin 1s linear infinite' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>Verifying Payment</h2>
              <p style={{ fontSize: '16px', color: '#6b7280' }}>Please wait while we verify your payment...</p>
            </div>
          )}

          {status === 'success' && (
            <div data-testid="payment-success">
              <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 24px' }} />
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', marginBottom: '12px' }}>Payment Successful!</h2>
              <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>{message}</p>
              <button
                onClick={() => navigate('/my-polls')}
                className="gradient-button"
                data-testid="go-to-my-polls"
                style={{ color: 'white', padding: '14px 32px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
              >
                View My Polls
              </button>
            </div>
          )}

          {status === 'error' && (
            <div data-testid="payment-error">
              <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 24px' }} />
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444', marginBottom: '12px' }}>Payment Failed</h2>
              <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>{message}</p>
              <button
                onClick={() => navigate('/')}
                className="gradient-button"
                style={{ color: 'white', padding: '14px 32px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
              >
                Go to Home
              </button>
            </div>
          )}

          {status === 'pending' && (
            <div>
              <Loader2 size={64} color="#f59e0b" style={{ margin: '0 auto 24px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b', marginBottom: '12px' }}>Payment Pending</h2>
              <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>{message}</p>
              <button
                onClick={() => navigate('/')}
                className="gradient-button"
                style={{ color: 'white', padding: '14px 32px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
              >
                Go to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
