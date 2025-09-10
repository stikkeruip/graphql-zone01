import { useState, useEffect } from 'react'
import Login from './components/Login'
import UserOverview from './components/UserOverview'
import { authService } from './services/authService'
import './components/Login.css'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)
      
      if (authenticated) {
        await fetchUserInfo()
      }
      
      setIsLoading(false)
    }
    
    checkAuth()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('zone01_jwt')
      if (!token) return

      const response = await fetch('/api/graphql-engine/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `{
            user {
              id
              login
              firstName: attrs(path: "firstName")
            }
          }`
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'GraphQL error')
      }

      const user = data.data.user[0]
      setUserInfo({
        login: user.login,
        firstName: user.firstName || user.login.split('.')[0]
      })

    } catch (err) {
      console.error('Error fetching user info:', err)
      // Fallback to JWT parsing
      const token = localStorage.getItem('zone01_jwt')
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          setUserInfo({ 
            login: payload.sub,
            firstName: payload.sub.split('.')[0]
          })
        } catch (err) {
          console.error('Error parsing JWT:', err)
        }
      }
    }
  }

  const handleLoginSuccess = async (jwt) => {
    setIsAuthenticated(true)
    await fetchUserInfo()
  }

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUserInfo(null)
  }

  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', marginBottom: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/zone01.svg" alt="Zone01" style={{ height: '32px', width: 'auto' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '500' }}>
            {userInfo?.firstName || 'User'}
          </span>
          <button onClick={handleLogout} style={{ 
            padding: '10px 20px', 
            background: 'linear-gradient(135deg, #dc3545, #c82333)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(220, 53, 69, 0.2)'
          }}>
            Logout
          </button>
        </div>
      </div>
      
      <UserOverview />
    </div>
  )
}

export default App
