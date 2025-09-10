import { useState, useEffect, useRef } from 'react';
import { authService } from '../services/authService';
import zone01Logo from '/zone01.svg';

export default function Login({ onLoginSuccess }) {
  const [credentials, setCredentials] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const buttonRef = useRef(null);

  // Debug state changes
  useEffect(() => {
    console.log('🔍 DEBUG: State changed - isLoading:', isLoading, 'error:', error, 'success:', success);
    if (buttonRef.current) {
      const styles = window.getComputedStyle(buttonRef.current);
      console.log('🔍 DEBUG: Button classes:', buttonRef.current.className);
      console.log('🔍 DEBUG: Key button styles:', {
        background: styles.background,
        backgroundColor: styles.backgroundColor,
        backgroundImage: styles.backgroundImage,
        border: styles.border,
        borderColor: styles.borderColor,
        borderStyle: styles.borderStyle,
        borderWidth: styles.borderWidth,
        padding: styles.padding,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        color: styles.color,
        width: styles.width,
        height: styles.height,
        display: styles.display,
        position: styles.position,
        transform: styles.transform,
        boxShadow: styles.boxShadow,
        outline: styles.outline,
        opacity: styles.opacity
      });
    }
  }, [isLoading, error, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 DEBUG: Form submitted, setting isLoading to true');
    setIsLoading(true);
    setError('');

    // Add a small delay to let the loading state render
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      console.log('🔍 DEBUG: Calling authService.login');
      const jwt = await authService.login(credentials.identifier, credentials.password);
      console.log('🔍 DEBUG: Login successful, setting success to true');
      setSuccess(true);
      setTimeout(() => onLoginSuccess(jwt), 2000);
    } catch (err) {
      console.log('🔍 DEBUG: Login failed, setting error');
      setError(err.message || 'Login failed. Please check your credentials.');
      
      // Add delay before resetting loading state
      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      console.log('🔍 DEBUG: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  if (success) {
    return (
      <div className="success-container">
        <div className="success-card">
          <div className="success-message show">
            <div className="success-icon">✓</div>
            <h3>Welcome back!</h3>
            <p>Redirecting to your dashboard...</p>
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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
            <img src={zone01Logo} alt="Zone01" className="logo-icon" />
        </div>
        
        <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠</span>
              <span className="error-text">{error}</span>
            </div>
          )}
          
          <div className="form-group">
            <div className={`input-wrapper ${credentials.identifier ? 'has-content' : ''}`}>
              <input
                type="text"
                id="identifier"
                name="identifier"
                required
                value={credentials.identifier}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <label htmlFor="identifier">Username or Email</label>
              <span className="input-line"></span>
            </div>
          </div>

          <div className="form-group">
            <div className={`input-wrapper password-wrapper ${credentials.password ? 'has-content' : ''}`}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                required
                value={credentials.password}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <label htmlFor="password">Password</label>
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                <span className={`toggle-icon ${showPassword ? 'show-password' : ''}`}></span>
              </button>
              <span className="input-line"></span>
            </div>
          </div>

          <button 
            ref={buttonRef}
            type="submit" 
            className={`login-btn ${isLoading ? 'loading' : ''}`} 
            disabled={isLoading}
            data-debug-state={`loading:${isLoading},error:${!!error},success:${success}`}
            style={{
              border: isLoading ? '2px solid red' : '2px solid green'
            }}
          >
            <span className="btn-text">{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <span className="btn-loader"></span>
            <span className="btn-glow"></span>
          </button>
        </form>
      </div>
      
      <div className="background-effects">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
      </div>
    </div>
  );
}