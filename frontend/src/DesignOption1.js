import React from 'react';
import { Trophy, Users, Clock, TrendingUp } from 'lucide-react';

const DesignOption1 = () => {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <Trophy size={40} color="#fbbf24" />
            <h1 style={{ fontSize: '42px', fontWeight: '800', color: '#ffffff', margin: 0 }}>The Polling Winner</h1>
          </div>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)' }}>Vote, Win & Earn Real Money</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Poll Card 1 */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', transition: 'transform 0.3s ease' }}>
            <div style={{ height: '200px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.95)', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', color: '#f5576c' }}>Live</div>
            </div>
            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>Best Smartphone 2024?</h3>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={18} color="#667eea" />
                  <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>2,543 votes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={18} color="#f59e0b" />
                  <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>2d left</span>
                </div>
              </div>
              <button style={{ width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>Vote Now</button>
            </div>
          </div>

          {/* Poll Card 2 */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ height: '200px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.95)', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', color: '#00f2fe' }}>Live</div>
            </div>
            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>Cricket: Who Will Win?</h3>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={18} color="#667eea" />
                  <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>8,921 votes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={18} color="#f59e0b" />
                  <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>5h left</span>
                </div>
              </div>
              <button style={{ width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>Vote Now</button>
            </div>
          </div>

          {/* Stats Card */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <TrendingUp size={40} color="#667eea" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>₹15.2L+</h3>
            <p style={{ fontSize: '16px', color: '#6b7280', fontWeight: '600' }}>Total Winnings Distributed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignOption1;