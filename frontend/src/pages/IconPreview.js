import React from 'react';
import { 
  Vote, Inbox, BoxSelect, ClipboardCheck, SquareCheck, FileCheck, Landmark, Archive,
  IndianRupee, Coins, Banknote, Wallet, PiggyBank, CircleDollarSign, BadgeIndianRupee, HandCoins,
  Users, DollarSign
} from 'lucide-react';

export default function IconPreview() {
  const voteIcons = [
    { name: 'Vote', icon: Vote, desc: 'Ballot into box' },
    { name: 'Inbox', icon: Inbox, desc: 'Box receiving' },
    { name: 'BoxSelect', icon: BoxSelect, desc: 'Selection box' },
    { name: 'ClipboardCheck', icon: ClipboardCheck, desc: 'Voting form' },
    { name: 'SquareCheck', icon: SquareCheck, desc: 'Checked ballot' },
    { name: 'FileCheck', icon: FileCheck, desc: 'Vote document' },
    { name: 'Landmark', icon: Landmark, desc: 'Government/Poll' },
    { name: 'Archive', icon: Archive, desc: 'Ballot box' },
    { name: 'Users (Current)', icon: Users, desc: 'Current icon' },
  ];

  const amountIcons = [
    { name: 'IndianRupee', icon: IndianRupee, desc: '₹ symbol' },
    { name: 'Coins', icon: Coins, desc: 'Stack of coins' },
    { name: 'Banknote', icon: Banknote, desc: 'Paper money' },
    { name: 'Wallet', icon: Wallet, desc: 'Wallet' },
    { name: 'PiggyBank', icon: PiggyBank, desc: 'Savings' },
    { name: 'CircleDollarSign', icon: CircleDollarSign, desc: 'Coin' },
    { name: 'BadgeIndianRupee', icon: BadgeIndianRupee, desc: 'Badge ₹' },
    { name: 'HandCoins', icon: HandCoins, desc: 'Hand with coins' },
    { name: 'DollarSign (Current)', icon: DollarSign, desc: 'Current icon' },
  ];

  const IconCard = ({ icon: Icon, name, desc, color }) => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      minWidth: '140px'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 12px'
      }}>
        <Icon size={28} color="white" />
      </div>
      <div style={{ fontWeight: '700', fontSize: '14px', color: '#1f2937', marginBottom: '4px' }}>{name}</div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>{desc}</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '800', marginBottom: '32px', textAlign: 'center' }}>
          Icon Options Preview
        </h1>

        {/* Total Votes Icons */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>
            📊 Total Votes Icons (Purple Theme)
          </h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {voteIcons.map((item, idx) => (
              <IconCard key={idx} {...item} color="#667eea" />
            ))}
          </div>
        </div>

        {/* Amount Per Vote Icons */}
        <div>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>
            💰 Amount Per Vote Icons (Orange Theme)
          </h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {amountIcons.map((item, idx) => (
              <IconCard key={idx} {...item} color="#f59e0b" />
            ))}
          </div>
        </div>

        {/* Preview of how it would look */}
        <div style={{ marginTop: '48px' }}>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>
            🎯 Preview: How Cards Would Look
          </h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Vote + IndianRupee */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '24px', display: 'flex', gap: '16px' }}>
              <div style={{ 
                flex: '1',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px 24px',
                borderRadius: '16px',
                textAlign: 'center',
                color: 'white',
                minWidth: '120px'
              }}>
                <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Vote size={22} color="white" />
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800' }}>12</div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>Total Votes</div>
              </div>
              <div style={{ 
                flex: '1',
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                padding: '20px 24px',
                borderRadius: '16px',
                textAlign: 'center',
                color: 'white',
                minWidth: '120px'
              }}>
                <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <IndianRupee size={22} color="white" />
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800' }}>₹10</div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>Per Vote</div>
              </div>
            </div>

            {/* Vote + Coins */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '24px', display: 'flex', gap: '16px' }}>
              <div style={{ 
                flex: '1',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px 24px',
                borderRadius: '16px',
                textAlign: 'center',
                color: 'white',
                minWidth: '120px'
              }}>
                <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Archive size={22} color="white" />
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800' }}>12</div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>Total Votes</div>
              </div>
              <div style={{ 
                flex: '1',
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                padding: '20px 24px',
                borderRadius: '16px',
                textAlign: 'center',
                color: 'white',
                minWidth: '120px'
              }}>
                <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Coins size={22} color="white" />
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800' }}>₹10</div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>Per Vote</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
