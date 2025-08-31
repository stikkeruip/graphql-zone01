import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

export default function Dashboard({ onLogout }) {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserInfo = () => {
      try {
        const token = authService.getToken();
        if (token) {
          const decoded = authService.decodeJWT(token);
          setUserInfo(decoded);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
      setIsLoading(false);
    };

    loadUserInfo();
  }, []);

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
        <div className="background-effects">
          <div className="glow-orb glow-orb-1"></div>
          <div className="glow-orb glow-orb-2"></div>
          <div className="glow-orb glow-orb-3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div className="logo-container">
            <img src="/zone01.svg" alt="Zone01" className="logo-icon" />
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-info">
            <h3>Profile Information</h3>
            {userInfo && (
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">User ID:</span>
                  <span className="info-value">{userInfo.sub || userInfo.user_id || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Token Type:</span>
                  <span className="info-value">{userInfo.typ || 'JWT'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Issued:</span>
                  <span className="info-value">
                    {userInfo.iat ? new Date(userInfo.iat * 1000).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Expires:</span>
                  <span className="info-value">
                    {userInfo.exp ? new Date(userInfo.exp * 1000).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="stats-preview">
            <h3>Statistics Preview</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h4>XP Progress</h4>
                  <p>Coming soon...</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <h4>Projects</h4>
                  <p>Coming soon...</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-info">
                  <h4>Audits</h4>
                  <p>Coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-actions">
          <button onClick={handleLogout} className="logout-btn">
            <span className="btn-text">Logout</span>
            <span className="btn-glow"></span>
          </button>
        </div>
      </div>
      
      <div className="background-effects">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
      </div>
    </div>
  );
}