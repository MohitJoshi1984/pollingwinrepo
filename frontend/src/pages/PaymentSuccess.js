import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { CheckCircle, XCircle, Loader2, RefreshCw, Bitcoin } from 'lucide-react';
import { authHeaders } from '../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const MAX_AUTO_RETRIES = 10;
const RETRY_DELAY_MS = 5000;

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isManualRetrying, setIsManualRetrying] = useState(false);
  const orderId = searchParams.get('order_id');
  const retryTimeoutRef = useRef(null);

  const verifyPayment = useCallback(async (isAutoRetry = false) => {
    if (!isAutoRetry) {
      setIsManualRetrying(true);
    }
    
    try {
      const response = await axios.post(
        `${API_URL}/payments/verify?order_id=${orderId}`,
        {},
        { headers: authHeaders() }
      );

      if (response.data.status === 'success') {
        setStatus('success');
        setMessage(response.data.message);
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      } else if (response.data.status === 'failed') {
        setStatus('error');
        setMessage(response.data.message);
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      } else {
        setStatus('pending');
        setMessage(response.data.message || 'Waiting for blockchain confirmation...');
        
        // Auto-retry if we haven't exceeded max retries
        if (isAutoRetry && retryCount < MAX_AUTO_RETRIES) {
          setRetryCount(prev => prev + 1);
          retryTimeoutRef.current = setTimeout(() => {
            verifyPayment(true);
          }, RETRY_DELAY_MS);
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to verify payment. Please check your connection and try again.');
    } finally {
      setIsManualRetrying(false);
    }
  }, [orderId, retryCount]);

  useEffect(() => {
    if (orderId) {
      verifyPayment(true);
    } else {
      setStatus('error');
      setMessage('Order ID not found');
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleManualRetry = () => {
    setRetryCount(0);
    setStatus('loading');
    verifyPayment(false);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 24px' }}>
        <div className="gradient-card" style={{ borderRadius: '24px', padding: '60px 40px', textAlign: 'center', boxShadow: '0 25px 70px rgba(0,0,0,0.35)' }}>
          {status === 'loading' && (
            <div data-testid="payment-loading">
              <Loader2 size={64} color="#667eea" style={{ margin: '0 auto 24px', animation: 'spin 1s linear infinite' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>Verifying Crypto Payment</h2>
              <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>Please wait while we verify your blockchain payment...</p>
              {retryCount > 0 && (
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                  Verification attempt {retryCount + 1} of {MAX_AUTO_RETRIES + 1}
                </p>
              )}
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
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444', marginBottom: '12px' }}>Payment Verification Failed</h2>
              <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>{message}</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleManualRetry}
                  disabled={isManualRetrying}
                  data-testid="retry-verification"
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#f3f4f6', 
                    color: '#374151', 
                    padding: '14px 24px', 
                    borderRadius: '12px', 
                    border: '1px solid #e5e7eb', 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    cursor: isManualRetrying ? 'not-allowed' : 'pointer',
                    opacity: isManualRetrying ? 0.7 : 1
                  }}
                >
                  <RefreshCw size={18} style={{ animation: isManualRetrying ? 'spin 1s linear infinite' : 'none' }} />
                  {isManualRetrying ? 'Retrying...' : 'Retry Verification'}
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="gradient-button"
                  style={{ color: 'white', padding: '14px 24px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Go to Home
                </button>
              </div>
            </div>
          )}

          {status === 'pending' && (
            <div data-testid="payment-pending">
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #f7931a 0%, #f59e0b 100%)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <Bitcoin size={32} color="white" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b', marginBottom: '12px' }}>Awaiting Blockchain Confirmation</h2>
              <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>{message}</p>
              
              <div style={{ 
                background: '#fef3c7', 
                padding: '16px', 
                borderRadius: '12px', 
                marginBottom: '24px',
                border: '1px solid #fde68a'
              }}>
                <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
                  Crypto payments require blockchain confirmations which may take a few minutes. Your payment is being processed.
                </p>
              </div>
              
              {retryCount >= MAX_AUTO_RETRIES ? (
                <div>
                  <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>
                    Blockchain confirmations can take 5-15 minutes depending on network congestion. You can check back later.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleManualRetry}
                      disabled={isManualRetrying}
                      data-testid="retry-pending-verification"
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#fef3c7', 
                        color: '#92400e', 
                        padding: '14px 24px', 
                        borderRadius: '12px', 
                        border: '1px solid #fde68a', 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        cursor: isManualRetrying ? 'not-allowed' : 'pointer',
                        opacity: isManualRetrying ? 0.7 : 1
                      }}
                    >
                      <RefreshCw size={18} style={{ animation: isManualRetrying ? 'spin 1s linear infinite' : 'none' }} />
                      {isManualRetrying ? 'Checking...' : 'Check Again'}
                    </button>
                    <button
                      onClick={() => navigate('/my-polls')}
                      className="gradient-button"
                      style={{ color: 'white', padding: '14px 24px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      View My Polls
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      style={{ 
                        background: '#f3f4f6', 
                        color: '#374151', 
                        padding: '14px 24px', 
                        borderRadius: '12px', 
                        border: '1px solid #e5e7eb', 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        cursor: 'pointer' 
                      }}
                    >
                      Go to Home
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                  Checking blockchain status... ({retryCount + 1}/{MAX_AUTO_RETRIES + 1})
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
