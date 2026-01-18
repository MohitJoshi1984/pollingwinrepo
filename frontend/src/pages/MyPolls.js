import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { authHeaders } from '../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MyPolls() {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPolls();
  }, []);

  const fetchMyPolls = async () => {
    try {
      const response = await axios.get(`${API_URL}/my-polls`, { headers: authHeaders() });
      setVotes(response.data);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', marginBottom: '32px', textAlign: 'center' }}>My Polls</h1>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'white', fontSize: '18px' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} data-testid="my-polls-list">
            {votes.map((vote) => (
              <div key={vote.id} className="gradient-card" style={{ borderRadius: '16px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }} data-testid={`vote-${vote.id}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>{vote.poll?.title}</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                      Voted on: {format(new Date(vote.voted_at), 'MMM d, yyyy h:mm a')}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Your Option:</span>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{vote.poll?.options[vote.option_index]?.name}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Votes:</span>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{vote.num_votes}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Amount Paid:</span>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>₹{vote.amount_paid.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ minWidth: '150px' }}>
                    {vote.result === 'pending' && (
                      <div style={{ background: '#fef3c7', color: '#92400e', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>
                        <Trophy size={18} style={{ marginBottom: '4px', display: 'inline' }} />
                        <div>Result Pending</div>
                      </div>
                    )}
                    {vote.result === 'win' && (
                      <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>
                        <TrendingUp size={18} style={{ marginBottom: '4px', display: 'inline' }} />
                        <div>Won!</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', marginTop: '4px' }}>₹{vote.winning_amount.toFixed(2)}</div>
                      </div>
                    )}
                    {vote.result === 'loss' && (
                      <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>
                        <TrendingDown size={18} style={{ marginBottom: '4px', display: 'inline' }} />
                        <div>Lost</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && votes.length === 0 && (
          <div style={{ textAlign: 'center', color: 'white', fontSize: '18px', padding: '60px 20px' }}>
            <p>You haven't voted on any polls yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
