import { useState } from "react";
import "@/App.css";
import DesignOption1 from "./DesignOption1";
import DesignOption2 from "./DesignOption2";

function App() {
  const [view, setView] = useState('option1');

  return (
    <div className="App">
      <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', gap: '12px', background: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <button 
          onClick={() => setView('option1')} 
          style={{ 
            padding: '10px 20px', 
            borderRadius: '8px', 
            border: 'none', 
            background: view === 'option1' ? '#667eea' : '#e5e7eb', 
            color: view === 'option1' ? 'white' : '#374151',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Option A: Modern & Colorful
        </button>
        <button 
          onClick={() => setView('option2')} 
          style={{ 
            padding: '10px 20px', 
            borderRadius: '8px', 
            border: 'none', 
            background: view === 'option2' ? '#2563eb' : '#e5e7eb', 
            color: view === 'option2' ? 'white' : '#374151',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Option B: Professional & Clean
        </button>
      </div>
      {view === 'option1' ? <DesignOption1 /> : <DesignOption2 />}
    </div>
  );
}

export default App;