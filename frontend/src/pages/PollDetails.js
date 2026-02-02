import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import ResponsiveImage from '../components/ResponsiveImage';
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

      // Redirect to Coinbase Commerce hosted checkout
      window.location.href = response.data.hosted_url;
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

  const votesCount = parseInt(numVotes) || 0;
  const baseAmount = poll.vote_price * votesCount;
  const gatewayCharge = baseAmount * (gatewayChargePercent / 100);
  const totalAmount = baseAmount + gatewayCharge;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        <div className="gradient-card" style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 70px rgba(0,0,0,0.35)' }}>
          <div style={{ height: '300px', position: 'relative' }}>
            <ResponsiveImage 
              src={poll.image_url} 
              alt={poll.title}
              style={{ width: '100%', height: '100%' }}
              sizes="(max-width: 900px) 100vw, 900px"
            />
            {poll.status === 'active' && (
              <div style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(16, 185, 129, 0.95)', color: 'white', padding: '10px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>LIVE</div>
            )}
            {poll.status === 'result_declared' && (
              <div style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(239, 68, 68, 0.95)', color: 'white', padding: '10px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>RESULT DECLARED</div>
            )}
          </div>

          <div style={{ padding: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1f2937', marginBottom: '12px' }} data-testid="poll-details-title">{poll.title}</h1>
            <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '20px', lineHeight: '1.6' }}>{poll.description}</p>

            {/* Date Info */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              marginBottom: '20px',
              fontSize: '13px',
              color: '#6b7280',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="#667eea" />
                <span>Started: <strong style={{ color: '#374151' }}>{format(new Date(poll.created_at || poll.end_datetime), 'MMM d, yyyy')}</strong></span>
              </div>
              <div style={{ width: '1px', height: '16px', background: '#e5e7eb' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color={poll.status === 'result_declared' ? '#10b981' : '#ef4444'} />
                <span>{poll.status === 'result_declared' ? 'Ended' : 'Ends'}: <strong style={{ color: '#374151' }}>{format(new Date(poll.end_datetime), 'MMM d, yyyy h:mm a')}</strong></span>
              </div>
            </div>

            {/* Modern Stats Cards - Only Total Votes and Per Vote */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginBottom: '32px'
            }}>
              {/* Total Votes */}
              <div style={{ 
                flex: '1',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px 16px',
                borderRadius: '20px',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
              }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <Users size={22} color="white" />
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800' }} data-testid="poll-total-votes">{poll.total_votes || 0}</div>
                <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '4px' }}>Total Votes</div>
              </div>
              
              {/* Per Vote */}
              <div style={{ 
                flex: '1',
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                padding: '20px 16px',
                borderRadius: '20px',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
              }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <IndianRupee size={22} color="white" />
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800' }}>₹{poll.vote_price}</div>
                <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '4px' }}>Per Vote</div>
              </div>
            </div>

            {poll.status === 'result_declared' ? (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>Poll Results</h3>
                
                {/* Simple Result Details */}
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  marginBottom: '24px',
                  border: '1px solid #e2e8f0'
                }} data-testid="result-details">
                  
                  {/* Votes by Each Option */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>Votes by Option</div>
                    {poll.options.map((option, index) => (
                      <div 
                        key={index} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '12px 14px',
                          marginBottom: '8px',
                          background: index === poll.winning_option ? '#dcfce7' : '#ffffff',
                          borderRadius: '10px',
                          border: index === poll.winning_option ? '2px solid #22c55e' : '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {index === poll.winning_option && <CheckCircle size={20} color="#22c55e" />}
                          <div>
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>{option.name}</span>
                            {index === poll.winning_option && (
                              <span style={{ 
                                marginLeft: '10px',
                                background: '#22c55e', 
                                color: 'white', 
                                padding: '3px 10px', 
                                borderRadius: '12px', 
                                fontSize: '11px', 
                                fontWeight: '700',
                                textTransform: 'uppercase'
                              }}>
                                Winner
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '700', color: '#1e293b' }}>{option.votes_count} votes</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>₹{option.total_amount?.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Distribution Explanation */}
                  {poll.result_details && (
                    <div style={{ 
                      background: poll.result_details.winning_option_votes > 0 ? '#eff6ff' : '#fef3c7', 
                      padding: '16px', 
                      borderRadius: '12px',
                      border: poll.result_details.winning_option_votes > 0 ? '1px solid #bfdbfe' : '1px solid #fde68a'
                    }}>
                      {poll.result_details.winning_option_votes > 0 ? (
                        <>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '12px' }}>
                            How winnings are calculated:
                          </div>
                          <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: '1.8' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span>Total amount collected:</span>
                              <span style={{ fontWeight: '600' }}>₹{poll.total_amount_collected?.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span>Winner votes:</span>
                              <span style={{ fontWeight: '600' }}>{poll.result_details.winning_option_votes}</span>
                            </div>
                            <div style={{ 
                              borderTop: '1px dashed #93c5fd', 
                              paddingTop: '10px', 
                              marginTop: '10px',
                              display: 'flex', 
                              justifyContent: 'space-between',
                              fontWeight: '700',
                              color: '#1e40af'
                            }}>
                              <span>Each winning vote gets:</span>
                              <span>₹{poll.result_details.winning_amount_per_vote?.toFixed(2)}</span>
                            </div>
                          </div>
                          <div style={{ 
                            marginTop: '12px', 
                            padding: '10px', 
                            background: '#dbeafe', 
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#1e40af'
                          }}>
                            ₹{poll.total_amount_collected?.toFixed(2)} ÷ {poll.result_details.winning_option_votes} votes = ₹{poll.result_details.winning_amount_per_vote?.toFixed(2)} per vote
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '10px' }}>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
                            No Winners in This Poll
                          </div>
                          <div style={{ fontSize: '13px', color: '#78716c' }}>
                            No one voted for the winning option ({poll.result_details.winning_option_name}).
                          </div>
                          <div style={{ fontSize: '13px', color: '#78716c', marginTop: '4px' }}>
                            Total amount collected: ₹{poll.total_amount_collected?.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User's Results Summary with Calculation */}
                {poll.user_votes && poll.user_votes.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Vote size={20} color="#667eea" />
                      Your Voting Summary
                    </h4>

                    {/* Per-option breakdown with calculation */}
                    {poll.user_votes.map((vote, idx) => {
                      // Calculate winning amount dynamically
                      const calculatedWinningAmount = vote.result === 'win' && poll.result_details 
                        ? vote.num_votes * poll.result_details.winning_amount_per_vote 
                        : 0;
                      
                      return (
                        <div 
                          key={idx}
                          style={{ 
                            padding: '16px', 
                            marginBottom: '10px',
                            background: vote.result === 'win' ? '#d1fae5' : vote.result === 'loss' ? '#fee2e2' : '#fef3c7', 
                            borderRadius: '12px',
                            border: vote.result === 'win' ? '1px solid #86efac' : vote.result === 'loss' ? '1px solid #fecaca' : '1px solid #fde68a'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                                {poll.options[vote.option_index]?.name}
                              </div>
                              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                {vote.num_votes} vote{vote.num_votes > 1 ? 's' : ''}
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
                              {vote.result === 'win' && <><TrendingUp size={16} /> Won ₹{calculatedWinningAmount.toFixed(2)}</>}
                              {vote.result === 'loss' && <><TrendingDown size={16} /> Lost</>}
                              {vote.result === 'pending' && <>Pending</>}
                            </div>
                          </div>
                          
                          {/* Winning Calculation Breakdown */}
                          {vote.result === 'win' && poll.result_details && (
                            <div style={{ 
                              marginTop: '12px', 
                              paddingTop: '12px', 
                              borderTop: '1px dashed #86efac',
                              fontSize: '13px',
                              color: '#065f46'
                            }}>
                              <div style={{ background: 'rgba(255,255,255,0.6)', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ marginBottom: '4px' }}>Your {vote.num_votes} vote{vote.num_votes > 1 ? 's' : ''} × ₹{poll.result_details.winning_amount_per_vote?.toFixed(2)} per vote</div>
                                <div style={{ fontWeight: '700', fontSize: '15px' }}>
                                  = ₹{calculatedWinningAmount.toFixed(2)} won
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>Vote for an Option</h3>

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
                    <span style={{ color: '#6b7280' }}>Gateway Charge ({gatewayChargePercent}%):</span>
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
