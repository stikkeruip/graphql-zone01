import { useState, useEffect } from 'react'
import XPChart from './XPChart'
import SkillsRadarChart from './SkillsRadarChart'
import './UserOverview.css'

function UserOverview() {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showXPChart, setShowXPChart] = useState(false)
  const [showAllSkills, setShowAllSkills] = useState(false)
  const [availableFolders, setAvailableFolders] = useState(['all'])
  const [selectedFolder, setSelectedFolder] = useState('all')

  useEffect(() => {
    fetchAvailableFolders()
  }, [])

  useEffect(() => {
    if (availableFolders.length > 0) {
      fetchUserData(selectedFolder)
    }
  }, [selectedFolder, availableFolders])

  const fetchAvailableFolders = async () => {
    try {
      const token = localStorage.getItem('zone01_jwt')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Get all XP transactions to extract unique folders
      const query = `{
        user {
          xpTransactions: transactions(where: {type: {_eq: "xp"}}) {
            path
            object {
              name
              type
              parents {
                parent {
                  name
                  type
                }
              }
            }
          }
        }
      }`

      const response = await fetch('/api/graphql-engine/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'GraphQL error')
      }

      const user = data.data.user[0]
      
      // Extract unique folders with max 2 levels after athens, only if parent is module/piscine
      const folderSet = new Set()
      user.xpTransactions.forEach(transaction => {
        if (transaction.path && transaction.object?.parents) {
          const pathParts = transaction.path.split('/').filter(part => part)
          if (pathParts.length >= 2 && pathParts[0] === 'athens') {
            let targetFolder
            if (pathParts.length === 3) {
              // Direct under div-01: /athens/div-01/project -> div-01
              targetFolder = pathParts[1]
            } else if (pathParts.length === 4) {
              // Level 2: /athens/div-01/piscine-js/exercise -> piscine-js
              targetFolder = pathParts[2]
            } else if (pathParts.length >= 5) {
              // Level 3+: /athens/div-01/piscine-js/quest-01/exercise -> piscine-js (stop at level 2)
              targetFolder = pathParts[2]
            }
            
            // Only add folder if the immediate parent is module or piscine
            if (targetFolder && transaction.object.parents[0]?.parent) {
              const parentType = transaction.object.parents[0].parent.type
              if (parentType === 'module' || parentType === 'piscine') {
                folderSet.add(targetFolder)
              }
            }
          }
        }
      })

      const folders = ['all', ...Array.from(folderSet).sort()]
      setAvailableFolders(folders)

    } catch (err) {
      console.error('Error fetching available folders:', err)
      setError(err.message)
    }
  }

  const fetchUserData = async (folderFilter = 'all') => {
    try {
      const token = localStorage.getItem('zone01_jwt')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Build GraphQL where clause for XP transactions with hierarchical logic
      let xpWhere = `{type: {_eq: "xp"}}`
      if (folderFilter !== 'all') {
        if (folderFilter === 'div-01') {
          // For div-01, get direct transactions + checkpoint exercises
          xpWhere = `{
            type: {_eq: "xp"},
            _or: [
              {
                path: {_like: "/athens/div-01/%"},
                _not: {path: {_like: "/athens/div-01/%/%"}}
              },
              {path: {_like: "/athens/div-01/checkpoint/%"}}
            ]
          }`
        } else {
          // For other folders (piscine-js, etc.), get nested transactions
          xpWhere = `{
            type: {_eq: "xp"},
            _or: [
              {path: {_like: "/athens/${folderFilter}/%"}},
              {path: {_like: "/athens/%/${folderFilter}/%"}}
            ]
          }`
        }
      }

      // Query to get user data with XP transactions, skills, audits, and progress
      const query = `{
        user {
          id
          login
          xpTransactions: transactions(where: ${xpWhere}, order_by: {createdAt: desc}) {
            id
            amount
            createdAt
            path
            object {
              name
              parents {
                parent {
                  name
                  type
                }
              }
            }
          }
          skillTransactions: transactions(
            where: {type: {_like: "skill_%"}},
            distinct_on: [type],
            order_by: [{type: asc}, {amount: desc}]
          ) {
            type
            amount
          }
          progresses(order_by: {updatedAt: desc}, limit: 3) {
            id
            grade
            updatedAt
            object {
              name
              type
            }
          }
        }
      }`

      const response = await fetch('/api/graphql-engine/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'GraphQL error')
      }

      const user = data.data.user[0]
      
      // Use all XP transactions (filtering done at GraphQL level)
      const filteredXpTransactions = user.xpTransactions
      
      // Log filtered XP transactions to console
      console.log('Filtered XP transactions:', filteredXpTransactions)
      console.log('Number of filtered XP transactions:', filteredXpTransactions.length)
      console.log('Skill transactions:', user.skillTransactions)
      
      // Calculate total XP from filtered transactions (divide by 1000 and round to nearest)
      const totalXP = Math.round(filteredXpTransactions.reduce((sum, transaction) => sum + transaction.amount, 0) / 1000)
      
      // Helper function to convert skill types to friendly names
      const getSkillFriendlyName = (skillType) => {
        const skillMap = {
          'skill_prog': 'Programming',
          'skill_go': 'Golang',
          'skill_back-end': 'Back-End',
          'skill_front-end': 'Front-End',
          'skill_js': 'JavaScript',
          'skill_html': 'HTML',
          'skill_css': 'CSS',
          'skill_sql': 'SQL',
          'skill_docker': 'Docker',
          'skill_algo': 'Algorithms',
          'skill_tcp': 'TCP/IP',
          'skill_unix': 'Unix/Linux',
          'skill_sys-admin': 'System Admin',
          'skill_game': 'Game Development'
        }
        return skillMap[skillType] || skillType.replace('skill_', '').replace('-', ' ')
      }

      // Process real skills data (maximum level for each skill type)
      const allSkills = user.skillTransactions
        .map(skill => ({
          name: getSkillFriendlyName(skill.type),
          grade: skill.amount // Use the amount as percentage
        }))
        .sort((a, b) => b.grade - a.grade) // Sort by highest skill level
      
      const topSkills = allSkills.slice(0, 3) // Get top 3 skills for the sidebar

      setUserData({
        ...user,
        totalXP,
        topSkills,
        allSkills,
        progresses: user.progresses,
        recentActivity: filteredXpTransactions.slice(0, 3), // Last 3 filtered XP transactions
        xpTransactions: filteredXpTransactions // Store filtered XP transactions for the chart
      })

    } catch (err) {
      console.error('Error fetching user data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleXPClick = () => {
    setShowXPChart(true)
    setShowAllSkills(false)
  }

  const handleSkillsClick = () => {
    setShowAllSkills(true)
    setShowXPChart(false)
  }

  const handleFolderChange = (folder) => {
    setSelectedFolder(folder)
  }


  if (loading) {
    return (
      <div className="overview-container">
        <div className="overview-loading">Loading profile...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="overview-container">
        <div className="overview-error">Error: {error}</div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="overview-container">
        <div className="overview-error">No user data found</div>
      </div>
    )
  }

  return (
    <div className="overview-container">
      <div className="overview-grid">
        <div className="left-sections">
          {/* Total XP */}
          <div className="overview-section clickable" onClick={handleXPClick}>
            <h3>Total XP</h3>
            <div className="xp-display">
              {userData.totalXP.toLocaleString()}
              <span className="xp-unit">kB</span>
            </div>
          </div>

          {/* Top 3 Skills */}
          <div className="overview-section clickable" onClick={handleSkillsClick}>
            <h3>Top Skills</h3>
            <div className="skills-list">
              {userData.topSkills.length > 0 ? (
                userData.topSkills.map((skill, index) => (
                  <div key={index} className="skill-item">
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-grade">{skill.grade}%</span>
                  </div>
                ))
              ) : (
                <div className="no-data">No skills data available</div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="overview-section">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {userData.recentActivity.length > 0 ? (
                userData.recentActivity.map((transaction) => (
                  <div key={transaction.id} className="activity-item">
                    <span className="activity-name">{transaction.object?.name || 'Unknown Project'}</span>
                    <span className="activity-xp">+{Math.ceil(transaction.amount / 1000)} kB</span>
                  </div>
                ))
              ) : (
                <div className="no-data">No recent activity</div>
              )}
            </div>
          </div>
        </div>

        <div className={`right-section ${!showXPChart && !showAllSkills ? 'overview-section' : ''}`}>
          {showXPChart ? (
            <XPChart 
              xpTransactions={userData.xpTransactions}
              availableFolders={availableFolders}
              selectedFolder={selectedFolder}
              onFolderChange={handleFolderChange}
            />
          ) : showAllSkills ? (
            <SkillsRadarChart allSkills={userData.allSkills} />
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              minHeight: '300px',
              color: '#a0a0b0',
              fontSize: '1.1rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ marginBottom: '12px', fontSize: '1.5rem' }}>📊</div>
                <div>Click on <strong>Total XP</strong> to view your XP progress over time</div>
                <div style={{ marginTop: '8px' }}>Click on <strong>Top Skills</strong> to view all your skills</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserOverview