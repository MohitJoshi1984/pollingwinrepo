import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Pagination from '../components/Pagination';
import { Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { isAuthenticated, isAdmin } from '../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Home() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPolls(currentPage);
  }, [currentPage]);

  const fetchPolls = async (page) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/polls?page=${page}&limit=9`);
      setPolls(response.data.items);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePollClick = (e, pollId) => {
    // If admin is logged in, redirect to admin dashboard instead
    if (isAuthenticated() && isAdmin()) {
      e.preventDefault();
      navigate('/admin/dashboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>Vote, Win & Earn Real Money</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'white', fontSize: '18px' }}>Loading polls...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }} data-testid="polls-grid">
            {polls.map((poll) => (
              <Link 
                key={poll.id} 
                to={`/poll/${poll.id}`} 
                style={{ textDecoration: 'none' }} 
                data-testid={`poll-card-${poll.id}`}
                onClick={(e) => handlePollClick(e, poll.id)}
              >
                <div className="gradient-card" style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                  <div style={{ height: '200px', backgroundImage: `url(${poll.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    {poll.status === 'active' && (
                      <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(16, 185, 129, 0.95)', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }} data-testid="poll-live-badge">LIVE</div>
                    )}
                    {poll.status === 'result_declared' && (
                      <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(239, 68, 68, 0.95)', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }} data-testid="poll-ended-badge">ENDED</div>
                    )}
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }} data-testid="poll-title">{poll.title}</h3>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={18} color="#667eea" />
                        <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }} data-testid="poll-votes">{poll.total_votes || 0} votes</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={18} color="#f59e0b" />
                        <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }} data-testid="poll-end-date">{format(new Date(poll.end_datetime), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    <button className="gradient-button" data-testid="view-poll-button" style={{ width: '100%', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
                      {poll.status === 'result_declared' ? 'View Result' : 'Vote Now'}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && polls.length > 0 && (
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={handlePageChange} 
          />
        )}

        {!loading && polls.length === 0 && (
          <div style={{ textAlign: 'center', color: 'white', fontSize: '18px', padding: '60px 20px' }}>
            <p>No polls available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
