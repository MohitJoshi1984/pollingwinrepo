import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { Users, Clock, DollarSign, TrendingUp, TrendingDown, CheckCircle, Vote } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { authHeaders } from '../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function PollDetails() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(0);
  const [numVotes, setNumVotes] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [gatewayChargePercent, setGatewayChargePercent] = useState(2);

  useEffect(() => {
    fetchPoll();
    fetchSettings();
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      const response = await axios.get(`${API_URL}/polls/${pollId}`, { headers: authHeaders() });
      setPoll(response.data);
    } catch (error) {
      toast.error('Failed to load poll');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/public`);
      setGatewayChargePercent(response.data.payment_gateway_charge_percent);
    } catch (error) {
      console.error('Failed to fetch settings, using default');
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const response = await axios.post(
        `${API_URL}/payments/create-order`,
        {
          poll_id: pollId,
          option_index: selectedOption,
          num_votes: parseInt(numVotes) || 1
        },
        { headers: authHeaders() }
      );

      const cashfree = window.Cashfree({ mode: 'sandbox' });
      await cashfree.checkout({
        paymentSessionId: response.data.payment_session_id,
        redirectTarget: '_self'
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
      setProcessing(false);
    }
  };

  // Get user's vote for a specific option
  const getUserVoteForOption = (optionIndex) => {
    if (!poll?.user_votes) return null;
    return poll.user_votes.find(v => v.option_index === optionIndex);
  };

  // Check if user has any winning vote
  const hasWinningVote = () => {
    return poll?.user_votes?.some(v => v.result === 'win');
  };

  // Check if user has any losing vote
  const hasLosingVote = () => {
    return poll?.user_votes?.some(v => v.result === 'loss');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Header />
        <div style={{ textAlign: 'center', color: 'white', fontSize: '18px', padding: '60px 20px' }}>Loading...</div>
      </div>
    );
  }

  const gatewayChargePercent = 2;
  const votesCount = parseInt(numVotes) || 0;
  const baseAmount = poll.vote_price * votesCount;
  const gatewayCharge = baseAmount * (gatewayChargePercent / 100);
  const totalAmount = baseAmount + gatewayCharge;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        <div className="gradient-card" style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 70px rgba(0,0,0,0.35)' }}>
          <div style={{ height: '300px', backgroundImage: `url(${poll.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
            {poll.status === 'active' && (
              <div style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(16, 185, 129, 0.95)', color: 'white', padding: '10px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>LIVE</div>
            )}
            {poll.status === 'result_declared' && (
              <div style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(239, 68, 68, 0.95)', color: 'white', padding: '10px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>RESULT DECLARED</div>
            )}
          </div>

          <div style={{ padding: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937', marginBottom: '16px' }} data-testid="poll-details-title">{poll.title}</h1>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>{poll.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px' }}>
                <Users size={24} color="#667eea" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }} data-testid="poll-total-votes">{poll.total_votes || 0}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Votes</div>
              </div>
              <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px' }}>
                <DollarSign size={24} color="#f59e0b" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>₹{poll.vote_price}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Per Vote</div>
              </div>
              <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px' }}>
                <Clock size={24} color="#ef4444" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>{format(new Date(poll.end_datetime), 'MMM d, h:mm a')}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>End Date</div>
              </div>
            </div>

            {poll.status === 'result_declared' ? (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>Poll Results</h3>
                {poll.options.map((option, index) => {
                  const userVote = getUserVoteForOption(index);
                  return (
                    <div key={index} style={{ 
                      marginBottom: '12px', 
                      padding: '16px', 
                      background: index === poll.winning_option ? '#d1fae5' : '#f3f4f6', 
                      borderRadius: '12px', 
                      border: index === poll.winning_option ? '2px solid #10b981' : userVote ? '2px solid #667eea' : 'none' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{option.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {userVote && (
                            <span style={{ background: '#667eea', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                              Your {userVote.num_votes} vote{userVote.num_votes > 1 ? 's' : ''}
                            </span>
                          )}
                          {index === poll.winning_option && <CheckCircle size={20} color="#10b981" />}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {option.votes_count} votes • ₹{option.total_amount.toFixed(2)}
                      </div>
                    </div>
                  );
                })}

                {/* User's Results Summary */}
                {poll.user_votes && poll.user_votes.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Vote size={20} color="#667eea" />
                      Your Voting Summary
                    </h4>
                    
                    {/* Summary Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#667eea' }}>{poll.user_total_votes}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Total Votes</div>
                      </div>
                      <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>₹{poll.user_total_paid?.toFixed(2)}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Amount Paid</div>
                      </div>
                      {hasWinningVote() && (
                        <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>₹{poll.user_total_winnings?.toFixed(2)}</div>
                          <div style={{ fontSize: '11px', color: '#065f46' }}>Winnings</div>
                        </div>
                      )}
                    </div>

                    {/* Per-option breakdown */}
                    {poll.user_votes.map((vote, idx) => (
                      <div 
                        key={idx}
                        style={{ 
                          padding: '16px', 
                          marginBottom: '10px',
                          background: vote.result === 'win' ? '#d1fae5' : vote.result === 'loss' ? '#fee2e2' : '#fef3c7', 
                          borderRadius: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                            {poll.options[vote.option_index]?.name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            {vote.num_votes} vote{vote.num_votes > 1 ? 's' : ''} • ₹{vote.amount_paid.toFixed(2)} paid
                          </div>
                        </div>
                        <div style={{ 
                          padding: '8px 16px', 
                          borderRadius: '8px', 
                          fontSize: '14px', 
                          fontWeight: '600',
                          background: vote.result === 'win' ? '#10b981' : vote.result === 'loss' ? '#ef4444' : '#f59e0b',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {vote.result === 'win' && <><TrendingUp size={16} /> Won ₹{vote.winning_amount.toFixed(2)}</>}
                          {vote.result === 'loss' && <><TrendingDown size={16} /> Lost</>}
                          {vote.result === 'pending' && <>Pending</>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>Vote for an Option</h3>
                
                {/* Show existing votes if any */}
                {poll.user_votes && poll.user_votes.length > 0 && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#eef2ff', borderRadius: '12px', border: '1px solid #c7d2fe' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#4338ca', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Vote size={16} />
                      Your Current Votes
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {poll.user_votes.map((vote, idx) => (
                        <div key={idx} style={{ background: 'white', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', color: '#4338ca', fontWeight: '500' }}>
                          {poll.options[vote.option_index]?.name}: {vote.num_votes} vote{vote.num_votes > 1 ? 's' : ''}
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '13px', color: '#6b7280' }}>
                      Total: {poll.user_total_votes} votes • ₹{poll.user_total_paid?.toFixed(2)} paid
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {poll.options.map((option, index) => {
                    const userVote = getUserVoteForOption(index);
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedOption(index)}
                        data-testid={`option-${index}`}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          border: selectedOption === index ? '2px solid #667eea' : '1px solid #e5e7eb',
                          background: selectedOption === index ? '#eef2ff' : '#ffffff',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937',
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>{option.name}</span>
                        {userVote && (
                          <span style={{ background: '#667eea', color: 'white', padding: '4px 10px', borderRadius: '10px', fontSize: '12px' }}>
                            {userVote.num_votes} voted
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Number of Votes</label>
                  <input
                    type="number"
                    min="1"
                    value={numVotes}
                    onChange={(e) => setNumVotes(e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                    onBlur={(e) => setNumVotes(Math.max(1, parseInt(e.target.value) || 1))}
                    data-testid="num-votes-input"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>Base Amount:</span>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>₹{baseAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>Gateway Charge (2%):</span>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>₹{gatewayCharge.toFixed(2)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>Total Amount:</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#667eea' }} data-testid="total-amount">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={processing || votesCount < 1}
                  data-testid="pay-button"
                  className="gradient-button"
                  style={{ width: '100%', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '18px', fontWeight: '600', cursor: (processing || votesCount < 1) ? 'not-allowed' : 'pointer', opacity: (processing || votesCount < 1) ? 0.7 : 1 }}
                >
                  {processing ? 'Processing...' : `Pay ₹${totalAmount.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
