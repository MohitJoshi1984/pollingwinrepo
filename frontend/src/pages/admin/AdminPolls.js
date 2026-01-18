import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import { Plus, Edit, Trash2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { authHeaders } from '../../auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AdminPolls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPoll, setEditingPoll] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    options: ['', ''],
    vote_price: '',
    end_datetime: ''
  });

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await axios.get(`${API_URL}/polls`);
      setPolls(response.data);
    } catch (error) {
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
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
      fetchPolls();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    try {
      await axios.delete(`${API_URL}/admin/polls/${pollId}`, { headers: authHeaders() });
      toast.success('Poll deleted successfully');
      fetchPolls();
    } catch (error) {
      toast.error('Failed to delete poll');
    }
  };

  const handleSetResult = async (pollId, winningOptionIndex) => {
    if (!window.confirm(`Set option ${winningOptionIndex + 1} as winner?`)) return;
    try {
      await axios.post(`${API_URL}/admin/polls/${pollId}/set-result?winning_option_index=${winningOptionIndex}`, {}, { headers: authHeaders() });
      toast.success('Result declared successfully');
      fetchPolls();
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

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Header />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
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
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Description</label>
                <textarea
                  required
                  data-testid="poll-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', minHeight: '100px' }}
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
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Vote Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    data-testid="poll-vote-price"
                    value={formData.vote_price}
                    onChange={(e) => setFormData({ ...formData, vote_price: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
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
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>{poll.title}</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>{poll.description}</p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
                      <span>Price: ₹{poll.vote_price}</span>
                      <span>Total Votes: {poll.total_votes || 0}</span>
                      <span style={{ padding: '4px 12px', borderRadius: '8px', background: poll.status === 'active' ? '#d1fae5' : '#fee2e2', color: poll.status === 'active' ? '#065f46' : '#991b1b', fontWeight: '600' }}>
                        {poll.status}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
