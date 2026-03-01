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
      </main>
    </div>
  );
}

export default App;
