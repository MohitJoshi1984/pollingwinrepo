import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpRight, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { authHeaders } from '../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Wallet() {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await axios.get(`${API_URL}/wallet`, { headers: authHeaders() });
      setWalletData(response.data);
    } catch (error) {
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setRequesting(true);
    try {
      const response = await axios.post(
        `${API_URL}/withdrawal/request`,
        { amount: parseFloat(withdrawAmount) },
        { headers: authHeaders() }
      );
      toast.success(`Withdrawal request submitted. Net amount: ₹${response.data.net_amount.toFixed(2)}`);
      setWithdrawAmount('');
      fetchWallet();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Withdrawal failed');
    } finally {
      setRequesting(false);
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
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', marginBottom: '24px', textAlign: 'center' }}>My Wallet</h1>

        <div className="gradient-card" style={{ borderRadius: '20px', padding: '24px', marginBottom: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <WalletIcon size={28} color="#ffffff" />
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>Cash Wallet Balance</h2>
          </div>
          <div style={{ fontSize: '40px', fontWeight: '800', color: '#ffffff' }} data-testid="wallet-balance">₹{walletData.balance.toFixed(2)}</div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <div className="gradient-card" style={{ borderRadius: '16px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowDownToLine size={20} color="#667eea" />
              Withdraw Funds
            </h3>
            <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Amount to Withdraw</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={walletData.balance}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  data-testid="withdraw-amount"
                  placeholder="Enter amount"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#6b7280' }}>
                <p style={{ margin: '0 0 4px 0' }}>• 10% withdrawal charge will be deducted</p>
                <p style={{ margin: 0 }}>• KYC must be approved to withdraw</p>
              </div>
              <button
                type="submit"
                disabled={requesting || walletData.balance <= 0}
                data-testid="withdraw-button"
                className="gradient-button"
                style={{ width: '100%', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: requesting || walletData.balance <= 0 ? 'not-allowed' : 'pointer', opacity: requesting || walletData.balance <= 0 ? 0.5 : 1 }}
              >
                {requesting ? 'Processing...' : 'Request Withdrawal'}
              </button>
            </form>
          </div>
        </div>

        <div className="gradient-card" style={{ borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>Withdrawal Requests</h3>
          {walletData.withdrawals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {walletData.withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>₹{withdrawal.amount.toFixed(2)}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Net: ₹{withdrawal.net_amount.toFixed(2)} • {format(new Date(withdrawal.requested_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', background: withdrawal.status === 'completed' ? '#d1fae5' : '#fef3c7', color: withdrawal.status === 'completed' ? '#065f46' : '#92400e' }}>
                    {withdrawal.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: '#6b7280' }}>No withdrawal requests yet</p>
          )}
        </div>

        <div className="gradient-card" style={{ borderRadius: '16px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>Recent Transactions</h3>
          {walletData.transactions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {walletData.transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {transaction.type === 'vote' && <ArrowUpRight size={20} color="#ef4444" />}
                    {transaction.type === 'winning' && <TrendingUp size={20} color="#10b981" />}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {transaction.type === 'vote' ? 'Vote Payment' : 'Poll Winning'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: transaction.type === 'winning' ? '#10b981' : '#ef4444' }}>
                    {transaction.type === 'winning' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: '#6b7280' }}>No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
