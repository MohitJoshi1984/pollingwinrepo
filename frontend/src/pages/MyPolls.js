import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { Trophy, TrendingUp, TrendingDown, ChevronRight, Vote } from 'lucide-react';
import { format } from 'date-fns';
import { authHeaders } from '../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MyPolls() {
  const [pollGroups, setPollGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyPolls();
  }, []);

  const fetchMyPolls = async () => {
    try {
      const response = await axios.get(`${API_URL}/my-polls`, { headers: authHeaders() });
      setPollGroups(response.data);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultBadge = (result, winningAmount) => {
    if (result === 'pending') {
      return (
        <div style={{ background: '#fef3c7', color: '#92400e', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Trophy size={16} />
          <span>Pending</span>
        </div>
      );
    }
    if (result === 'win') {
      return (
        <div style={{ background: '#d1fae5', color: '#065f46', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={16} />
          <span>Won ₹{winningAmount.toFixed(2)}</span>
        </div>
      );
    }
    if (result === 'loss') {
      return (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <TrendingDown size={16} />
          <span>Lost</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', marginBottom: '32px', textAlign: 'center' }}>My Polls</h1>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'white', fontSize: '18px' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} data-testid="my-polls-list">
            {pollGroups.map((group) => (
              <div 
                key={group.poll_id} 
                className="gradient-card" 
                style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 15px 50px rgba(0,0,0,0.25)' }} 
                data-testid={`poll-group-${group.poll_id}`}
              >
                {/* Poll Header with Image */}
                <div style={{ 
                  background: `linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9)), url(${group.poll?.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  padding: '24px',
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>{group.poll?.title}</h3>
                      <p style={{ fontSize: '13px', opacity: 0.9 }}>
                        First voted: {format(new Date(group.first_voted_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {group.overall_result === 'pending' && (
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '12px' }}>
                          <div style={{ fontSize: '12px', opacity: 0.9 }}>Status</div>
                          <div style={{ fontSize: '16px', fontWeight: '700' }}>Result Pending</div>
                        </div>
                      )}
                      {group.overall_result === 'win' && (
                        <div style={{ background: 'rgba(16, 185, 129, 0.3)', padding: '10px 20px', borderRadius: '12px' }}>
                          <div style={{ fontSize: '12px', opacity: 0.9 }}>Total Winnings</div>
                          <div style={{ fontSize: '20px', fontWeight: '700' }}>₹{group.total_winning_amount.toFixed(2)}</div>
                        </div>
                      )}
                      {group.overall_result === 'loss' && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.3)', padding: '10px 20px', borderRadius: '12px' }}>
                          <div style={{ fontSize: '12px', opacity: 0.9 }}>Status</div>
                          <div style={{ fontSize: '16px', fontWeight: '700' }}>Lost</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vote Details */}
                <div style={{ padding: '24px' }}>
                  {/* Summary Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#667eea' }}>{group.total_votes}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Votes</div>
                    </div>
                    <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>₹{group.total_amount_paid.toFixed(2)}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Amount Paid</div>
                    </div>
                    <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#764ba2' }}>{group.votes.length}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Options Voted</div>
                    </div>
                  </div>

                  {/* Individual Option Votes */}
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Vote size={18} color="#667eea" />
                    Your Votes by Option
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {group.votes.map((vote, index) => (
                      <div 
                        key={vote.id || index}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '16px',
                          background: vote.result === 'win' ? '#f0fdf4' : vote.result === 'loss' ? '#fef2f2' : '#fafafa',
                          borderRadius: '12px',
                          border: vote.result === 'win' ? '1px solid #86efac' : vote.result === 'loss' ? '1px solid #fecaca' : '1px solid #e5e7eb',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                        data-testid={`vote-option-${vote.option_index}`}
                      >
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                            {vote.option_name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            {vote.num_votes} vote{vote.num_votes > 1 ? 's' : ''} • ₹{vote.amount_paid.toFixed(2)} paid
                          </div>
                        </div>
                        <div>
                          {getResultBadge(vote.result, vote.winning_amount)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View Poll Button */}
                  <button
                    onClick={() => navigate(`/poll/${group.poll_id}`)}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    data-testid={`view-poll-${group.poll_id}`}
                  >
                    View Poll Details
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && pollGroups.length === 0 && (
          <div className="gradient-card" style={{ textAlign: 'center', padding: '60px 40px', borderRadius: '20px' }}>
            <Vote size={48} color="#667eea" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>No Votes Yet</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>You haven't voted on any polls yet. Start voting to see your polls here!</p>
            <button
              onClick={() => navigate('/')}
              className="gradient-button"
              style={{ color: 'white', padding: '14px 32px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
            >
              Browse Polls
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
