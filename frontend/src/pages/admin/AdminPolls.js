import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Pagination from '../../components/Pagination';
import { Plus, Edit, Trash2, Trophy, Users, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Upload, Image, X } from 'lucide-react';
import { toast } from 'sonner';
import { authHeaders } from '../../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AdminPolls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingPoll, setEditingPoll] = useState(null);
  const [expandedPoll, setExpandedPoll] = useState(null);
  const [pollStats, setPollStats] = useState({});
  const [loadingStats, setLoadingStats] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrls, setImageUrls] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    options: ['', ''],
    vote_price: '',
    end_datetime: ''
  });

  useEffect(() => {
    fetchPolls(currentPage);
  }, [currentPage]);

  const fetchPolls = async (page) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/polls?page=${page}&limit=10`);
      setPolls(response.data.items);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchPollStats = async (pollId) => {
    if (pollStats[pollId]) {
      setExpandedPoll(expandedPoll === pollId ? null : pollId);
      return;
    }

    setLoadingStats({ ...loadingStats, [pollId]: true });
    try {
      const response = await axios.get(`${API_URL}/admin/polls/${pollId}/result-stats`, { headers: authHeaders() });
      setPollStats({ ...pollStats, [pollId]: response.data });
      setExpandedPoll(pollId);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to load stats');
    } finally {
      setLoadingStats({ ...loadingStats, [pollId]: false });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPoll) {
        await axios.put(`${API_URL}/admin/polls/${editingPoll.id}`, formData, { headers: authHeaders() });
        toast.success('Poll updated successfully');
      } else {
        await axios.post(`${API_URL}/admin/polls`, formData, { headers: authHeaders() });
        toast.success('Poll created successfully');
      }
      setShowForm(false);
      setEditingPoll(null);
      resetForm();
      fetchPolls(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    try {
      await axios.delete(`${API_URL}/admin/polls/${pollId}`, { headers: authHeaders() });
      toast.success('Poll deleted successfully');
      fetchPolls(currentPage);
    } catch (error) {
      toast.error('Failed to delete poll');
    }
  };

  const handleSetResult = async (pollId, winningOptionIndex) => {
    if (!window.confirm(`Set option ${winningOptionIndex + 1} as winner?`)) return;
    try {
      await axios.post(`${API_URL}/admin/polls/${pollId}/set-result?winning_option_index=${winningOptionIndex}`, {}, { headers: authHeaders() });
      toast.success('Result declared successfully');
      fetchPolls(currentPage);
      // Clear cached stats to reload fresh data
      setPollStats({ ...pollStats, [pollId]: null });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to set result');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      options: ['', ''],
      vote_price: '',
      end_datetime: ''
    });
    setImageUrls(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPEG, PNG, WebP, or GIF');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await axios.post(`${API_URL}/admin/upload-image`, formDataUpload, {
        headers: {
          ...authHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setImageUrls(response.data.urls);
        // Set the default URL (large) as the image_url
        const fullUrl = process.env.REACT_APP_BACKEND_URL + response.data.default_url;
        setFormData({ ...formData, image_url: fullUrl });
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (poll) => {
    setEditingPoll(poll);
    setFormData({
      title: poll.title,
      description: poll.description,
      image_url: poll.image_url,
      options: poll.options.map(opt => opt.name),
      vote_price: poll.vote_price,
      end_datetime: poll.end_datetime
    });
    setShowForm(true);
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const removeOption = (index) => {
    if (formData.options.length <= 2) {
      toast.error('At least 2 options required');
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const renderResultStats = (pollId) => {
    const stats = pollStats[pollId];
    if (!stats) return null;

    return (
      <div style={{ marginTop: '20px', background: '#f9fafb', borderRadius: '12px', padding: '20px' }}>
        <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={20} color="#f59e0b" />
          Poll Result Statistics
        </h4>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#d1fae5', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <TrendingUp size={24} color="#065f46" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#065f46' }}>{stats.total_winners}</div>
            <div style={{ fontSize: '12px', color: '#065f46' }}>Winners</div>
          </div>
          <div style={{ background: '#fee2e2', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <TrendingDown size={24} color="#991b1b" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>{stats.total_losers}</div>
            <div style={{ fontSize: '12px', color: '#991b1b' }}>Losers</div>
          </div>
          <div style={{ background: '#dbeafe', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af' }}>₹{stats.total_winning_amount_distributed.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#1e40af' }}>Amount Distributed</div>
          </div>
          <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>₹{stats.total_losing_amount_collected.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#92400e' }}>From Losers</div>
          </div>
        </div>

        {/* Option-wise Stats */}
        <div style={{ marginBottom: '24px' }}>
          <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Option-wise Breakdown</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.option_stats.map((opt) => (
              <div 
                key={opt.index} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px 16px', 
                  background: opt.is_winner ? '#d1fae5' : 'white', 
                  borderRadius: '8px',
                  border: opt.is_winner ? '2px solid #10b981' : '1px solid #e5e7eb'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {opt.is_winner && <Trophy size={16} color="#10b981" />}
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>{opt.name}</span>
                  {opt.is_winner && <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>WINNER</span>}
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
                  <span>{opt.votes_count} votes</span>
                  <span>₹{opt.total_amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Winners List */}
        {stats.winners.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#065f46', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} />
              Winners ({stats.winners.length})
            </h5>
            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d1fae5' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#d1fae5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#065f46' }}>User</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#065f46' }}>Option</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#065f46' }}>Votes</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#065f46' }}>Paid</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#065f46' }}>Won</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.winners.map((winner, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{winner.user_name}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{winner.user_email}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#374151' }}>{winner.option_name}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#374151', textAlign: 'right' }}>{winner.num_votes}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#374151', textAlign: 'right' }}>₹{winner.amount_paid.toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '13px', fontWeight: '700', color: '#10b981', textAlign: 'right' }}>+₹{winner.winning_amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Losers List */}
        {stats.losers.length > 0 && (
          <div>
            <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#991b1b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingDown size={16} />
              Losers ({stats.losers.length})
            </h5>
            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #fee2e2' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fee2e2' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#991b1b' }}>User</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#991b1b' }}>Option</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#991b1b' }}>Votes</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#991b1b' }}>Lost Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.losers.map((loser, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{loser.user_name}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{loser.user_email}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#374151' }}>{loser.option_name}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#374151', textAlign: 'right' }}>{loser.num_votes}</td>
                      <td style={{ padding: '12px', fontSize: '13px', fontWeight: '700', color: '#ef4444', textAlign: 'right' }}>-₹{loser.amount_paid.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Header />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937' }}>Manage Polls</h1>
          <button
            onClick={() => { resetForm(); setShowForm(true); setEditingPoll(null); }}
            data-testid="create-poll-button"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#667eea', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            <Plus size={18} />
            Create Poll
          </button>
        </div>

        {showForm && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>
              {editingPoll ? 'Edit Poll' : 'Create New Poll'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Title</label>
                <input
                  type="text"
                  required
                  data-testid="poll-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Description</label>
                <textarea
                  required
                  data-testid="poll-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', minHeight: '100px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Image URL</label>
                <input
                  type="url"
                  required
                  data-testid="poll-image-url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Options</label>
                {formData.options.map((option, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      required
                      data-testid={`poll-option-${index}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...formData.options];
                        newOptions[index] = e.target.value;
                        setFormData({ ...formData, options: newOptions });
                      }}
                      placeholder={`Option ${index + 1}`}
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  data-testid="add-option-button"
                  style={{ marginTop: '8px', padding: '8px 16px', background: '#f3f4f6', color: '#374151', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                >
                  + Add Option
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Vote Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    data-testid="poll-vote-price"
                    value={formData.vote_price}
                    onChange={(e) => setFormData({ ...formData, vote_price: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>End Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    data-testid="poll-end-datetime"
                    value={formData.end_datetime}
                    onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingPoll(null); }}
                  style={{ padding: '12px 24px', background: '#f3f4f6', color: '#374151', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-poll-button"
                  style={{ padding: '12px 24px', background: '#667eea', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                >
                  {editingPoll ? 'Update Poll' : 'Create Poll'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', fontSize: '18px', color: '#6b7280' }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }} data-testid="admin-polls-list">
            {polls.map((poll) => (
              <div key={poll.id} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>{poll.title}</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>{poll.description}</p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6b7280', flexWrap: 'wrap' }}>
                      <span>Price: ₹{poll.vote_price}</span>
                      <span>Total Votes: {poll.total_votes || 0}</span>
                      <span style={{ padding: '4px 12px', borderRadius: '8px', background: poll.status === 'active' ? '#d1fae5' : '#fee2e2', color: poll.status === 'active' ? '#065f46' : '#991b1b', fontWeight: '600' }}>
                        {poll.status === 'result_declared' ? 'Result Declared' : poll.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(poll)}
                      data-testid={`edit-poll-${poll.id}`}
                      style={{ padding: '8px', background: '#dbeafe', color: '#1e40af', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(poll.id)}
                      data-testid={`delete-poll-${poll.id}`}
                      style={{ padding: '8px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Set Result Section - Only for active polls with votes */}
                {poll.status === 'active' && poll.total_votes > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Set Result:</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {poll.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleSetResult(poll.id, index)}
                          data-testid={`set-result-${poll.id}-${index}`}
                          style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                        >
                          {option.name} ({option.votes_count} votes)
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Stats Button - Only for declared results */}
                {poll.status === 'result_declared' && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                    <button
                      onClick={() => fetchPollStats(poll.id)}
                      data-testid={`view-stats-${poll.id}`}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '12px 20px', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                        color: 'white', 
                        borderRadius: '10px', 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontSize: '14px', 
                        fontWeight: '600',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      {loadingStats[poll.id] ? 'Loading...' : (
                        <>
                          <Trophy size={18} />
                          {expandedPoll === poll.id ? 'Hide Result Statistics' : 'View Result Statistics'}
                          {expandedPoll === poll.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </>
                      )}
                    </button>

                    {/* Result Stats Panel */}
                    {expandedPoll === poll.id && renderResultStats(poll.id)}
                  </div>
                )}
              </div>
            ))}
            
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
