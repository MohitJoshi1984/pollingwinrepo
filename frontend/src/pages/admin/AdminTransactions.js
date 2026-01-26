import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Pagination from '../../components/Pagination';
import { DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { authHeaders } from '../../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AdminTransactions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage]);

  const fetchTransactions = async (page) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/transactions?page=${page}&limit=20`, { headers: authHeaders() });
      setData(response.data);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Header />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937', marginBottom: '32px' }}>Transactions</h1>

        {loading ? (
          <div style={{ textAlign: 'center', fontSize: '18px', color: '#6b7280' }}>Loading...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <DollarSign size={32} color="#667eea" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>₹{data.stats.total_vote_amount.toFixed(2)}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Vote Amount</div>
              </div>

              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <TrendingUp size={32} color="#f59e0b" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>₹{data.stats.total_with_gateway.toFixed(2)}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>With Gateway Charges</div>
              </div>

              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <TrendingUp size={32} color="#10b981" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>{data.stats.total_votes}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Votes</div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>Recent Transactions</h2>
              {data.items && data.items.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Type</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Amount</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((transaction) => (
                        <tr key={transaction.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937' }}>
                            <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: transaction.type === 'winning' ? '#d1fae5' : '#dbeafe', color: transaction.type === 'winning' ? '#065f46' : '#1e40af' }}>
                              {transaction.type}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: transaction.type === 'winning' ? '#10b981' : '#ef4444' }}>
                            {transaction.type === 'winning' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937' }}>{transaction.status}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}</td>
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
                <p style={{ fontSize: '14px', color: '#6b7280' }}>No transactions yet</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
