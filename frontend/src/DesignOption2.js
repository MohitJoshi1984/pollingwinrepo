import React from 'react';
import { Trophy, Users, Clock, TrendingUp } from 'lucide-react';

const DesignOption2 = () => {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#ffffff', minHeight: '100vh' }}>
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '20px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Trophy size={32} color="#2563eb" />
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>The Polling Winner</h1>
          </div>
          <button style={{ background: '#2563eb', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Login</button>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 40px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Active Polls</h2>
          <p style={{ fontSize: '16px', color: '#6b7280' }}>Vote on live polls and win real money</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {/* Poll Card 1 */}
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', transition: 'box-shadow 0.3s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ height: '180px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ fontSize: '48px' }}>📱</div>
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#10b981', color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>LIVE</div>
            </div>
            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Best Smartphone 2024?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="#6b7280" />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>2,543 votes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#6b7280" />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Ends: 25 Dec, 6:00 PM</span>
                </div>
              </div>
              <button style={{ width: '100%', background: '#2563eb', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>View Poll</button>
            </div>
          </div>

          {/* Poll Card 2 */}
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ height: '180px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ fontSize: '48px' }}>🏏</div>
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#10b981', color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>LIVE</div>
            </div>
            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Cricket: Who Will Win?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="#6b7280" />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>8,921 votes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#6b7280" />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Ends: 23 Dec, 11:30 PM</span>
                </div>
              </div>
              <button style={{ width: '100%', background: '#2563eb', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>View Poll</button>
            </div>
          </div>

          {/* Stats Card */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <TrendingUp size={32} color="#2563eb" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>₹15.2L+</h3>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Total Winnings Distributed</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Join thousands of winners</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignOption2;