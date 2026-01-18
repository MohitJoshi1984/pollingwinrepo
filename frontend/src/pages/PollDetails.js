import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { Users, Clock, DollarSign, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
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

  useEffect(() => {
    fetchPoll();
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

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const response = await axios.post(
        `${API_URL}/payments/create-order`,
        {
          poll_id: pollId,
          option_index: selectedOption,
          num_votes: numVotes
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Header />
        <div style={{ textAlign: 'center', color: 'white', fontSize: '18px', padding: '60px 20px' }}>Loading...</div>
      </div>
    );
  }

  const gatewayChargePercent = 2;
  const baseAmount = poll.vote_price * numVotes;
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
                {poll.options.map((option, index) => (
                  <div key={index} style={{ marginBottom: '12px', padding: '16px', background: index === poll.winning_option ? '#d1fae5' : '#f3f4f6', borderRadius: '12px', border: index === poll.winning_option ? '2px solid #10b981' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{option.name}</span>
                      {index === poll.winning_option && <CheckCircle size={20} color="#10b981" />}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {option.votes_count} votes • ₹{option.total_amount.toFixed(2)}
                    </div>
                  </div>
                ))}

                {poll.user_vote && (
                  <div style={{ marginTop: '24px', padding: '20px', background: poll.user_vote.result === 'win' ? '#d1fae5' : '#fee2e2', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: poll.user_vote.result === 'win' ? '#10b981' : '#ef4444' }}>
                      {poll.user_vote.result === 'win' ? 'You Won!' : 'You Lost'}
                    </h4>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>
                      Your votes: {poll.user_vote.num_votes} • Amount paid: ₹{poll.user_vote.amount_paid.toFixed(2)}
                      {poll.user_vote.result === 'win' && ` • Winnings: ₹${poll.user_vote.winning_amount.toFixed(2)}`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>Vote for an Option</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {poll.options.map((option, index) => (
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
                        textAlign: 'left'
                      }}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Number of Votes</label>
                  <input
                    type="number"
                    min="1"
                    value={numVotes}
                    onChange={(e) => setNumVotes(Math.max(1, parseInt(e.target.value) || 1))}
                    data-testid="num-votes-input"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
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
                  disabled={processing}
                  data-testid="pay-button"
                  className="gradient-button"
                  style={{ width: '100%', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '18px', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1 }}
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
