import { useState } from 'react';
import axios from 'axios';

// API configuration based on the NestJS webapp port
const API_BASE_URL = 'http://localhost:3000/api';

// Definition of the available endpoints matching the backend
const endpoints = [
  { id: 'all', label: 'Get All Employees', method: 'GET', url: `${API_BASE_URL}/employees` },
  { id: 'single', label: 'Get Employee By ID (emp1)', method: 'GET', url: `${API_BASE_URL}/employees/emp1` },
  { id: 'salary', label: 'Get Employee Salary (emp1)', method: 'GET', url: `${API_BASE_URL}/salary/emp1` },
  { id: 'attendance', label: 'Get Employee Attendance (emp1)', method: 'GET', url: `${API_BASE_URL}/attendance/emp1` },
];

function App() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'agent', text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/chat', { message: userMessage });
      setChatMessages(prev => [...prev, { role: 'agent', text: response.data.reply }]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error contacting Agent';
      setChatMessages(prev => [...prev, { role: 'agent', text: `Error: ${errorMessage}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchData = async (url: string, endpointId: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    setActiveEndpoint(endpointId);

    // Artificial small delay to showcase the smooth loading animation
    await new Promise(r => setTimeout(r, 400));

    try {
      const response = await axios.get(url);
      setData(response.data);
    } catch (err: any) {
      console.error("API Error details:", err);
      // Construct a user-friendly error string
      const errorMessage = err.response?.data?.message
        || err.message
        || 'An unknown error occurred while fetching data. Check backend connection.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Main Header */}
      <header className="app-header">
        <h1>Employee Portal</h1>
        <p>A modernized interface powered by your local MCP REST Backend</p>
      </header>

      {/* Control Panel for sending requests */}
      <main>
        <div className="glass-panel controls-panel">
          {endpoints.map((ep) => (
            <button
              key={ep.id}
              className={`btn ${activeEndpoint === ep.id ? 'active' : ''}`}
              onClick={() => fetchData(ep.url, ep.id)}
              disabled={loading}
              title={`Calls: ${ep.url}`}
            >
              {
                /* Standard SVG Icon */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              }
              {ep.label}
            </button>
          ))}
        </div>

        {/* Display Area for viewing results */}
        <div className="glass-panel display-panel" style={{ marginTop: '2rem' }}>
          <div className="display-header">
            <h2>Data Explorer</h2>
            {activeEndpoint && !loading && !error && (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Results formatted via JSON
              </span>
            )}
          </div>

          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Connecting to Backend...</span>
            </div>
          )}

          {error && (
            <div className="error-message">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
              <br />
              <small style={{ marginLeft: 'auto' }}>Is the NestJS server running on port 3000?</small>
            </div>
          )}

          {!loading && !error && data && (
            <div className="data-container">
              {JSON.stringify(data, null, 2)}
            </div>
          )}

          {!loading && !error && !data && (
            <div className="data-empty">
              Configure your network requests using the control panel above.
            </div>
          )}
        </div>

        {/* Chat Console Panel */}
        <div className="glass-panel chat-console">
          <div className="chat-header">
            <h3>🤖 Agent Chat Console</h3>
          </div>
          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <div className="data-empty" style={{ padding: '1rem 0', margin: 'auto' }}>
                Ask the agent a question about the employees!
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <span className="message-label">{msg.role}</span>
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="chat-message agent">
                <span className="message-label">agent</span>
                <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Thinking...</span>
              </div>
            )}
          </div>
          <div className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              placeholder="E.g. What is emp1's salary?"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
              disabled={chatLoading}
            />
            <button
              className="chat-send-btn"
              onClick={sendChatMessage}
              disabled={chatLoading || !chatInput.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
