import { useMemo } from 'react'

function SkillsRadarChart({ allSkills }) {
  const chartData = useMemo(() => {
    if (!allSkills || allSkills.length === 0) {
      return { skills: [], maxValue: 100 }
    }

    // Filter skills above 0% and get up to 12 skills for better visualization
    const filteredSkills = allSkills
      .filter(skill => skill.grade > 0)
      .slice(0, 12)

    // Find max value for scaling (use 100 if all skills are below 100)
    const maxValue = Math.max(100, Math.max(...filteredSkills.map(s => s.grade)))

    return { skills: filteredSkills, maxValue }
  }, [allSkills])

  const { skills, maxValue } = chartData

  if (!skills.length) {
    return (
      <div className="overview-section" style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div style={{ color: '#a0a0b0', fontSize: '1.1rem' }}>
          <div style={{ marginBottom: '12px', fontSize: '2rem' }}>📊</div>
          <div>No skills data available above 0%</div>
        </div>
      </div>
    )
  }

  // Chart dimensions
  const size = 400
  const center = size / 2
  const maxRadius = center - 60 // Leave margin for labels

  // Calculate angles for each skill (evenly distributed around circle)
  const angleStep = (2 * Math.PI) / skills.length
  
  // Generate concentric circles for grid (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]
  
  // Calculate skill points
  const skillPoints = skills.map((skill, index) => {
    const angle = index * angleStep - Math.PI / 2 // Start from top
    const radius = (skill.grade / maxValue) * maxRadius
    const x = center + Math.cos(angle) * radius
    const y = center + Math.sin(angle) * radius
    const labelX = center + Math.cos(angle) * (maxRadius + 30)
    const labelY = center + Math.sin(angle) * (maxRadius + 30)
    
    return {
      ...skill,
      x,
      y,
      labelX,
      labelY,
      angle,
      radius
    }
  })

  // Create path for skill polygon
  const skillPath = skillPoints.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z'

  return (
    <div className="overview-section" style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '24px'
    }}>
      <h2 style={{ 
        margin: '0 0 20px 0', 
        color: '#ffffff',
        borderBottom: '2px solid #8b5cf6',
        paddingBottom: '10px',
        textAlign: 'center'
      }}>
        Skills Radar Chart
      </h2>
      
      <div style={{ 
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <svg width={size} height={size} style={{ maxWidth: '100%', height: 'auto' }}>
          <defs>
            <radialGradient id="skillsGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style={{stopColor: '#8b5cf6', stopOpacity: 0.1}} />
              <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.3}} />
            </radialGradient>
            <filter id="skillsGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Grid circles */}
          {gridLevels.map((level, index) => (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={level * maxRadius}
              fill="none"
              stroke="#2a2a35"
              strokeWidth={1}
              strokeOpacity={0.5}
            />
          ))}

          {/* Grid lines (spokes) */}
          {skillPoints.map((point, index) => (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={center + Math.cos(point.angle) * maxRadius}
              y2={center + Math.sin(point.angle) * maxRadius}
              stroke="#2a2a35"
              strokeWidth={1}
              strokeOpacity={0.3}
            />
          ))}

          {/* Skill area */}
          <path
            d={skillPath}
            fill="url(#skillsGradient)"
            stroke="#8b5cf6"
            strokeWidth={2}
            filter="url(#skillsGlow)"
          />

          {/* Skill labels */}
          {skillPoints.map((point, index) => (
            <g key={index}>
              {/* Skill label */}
              <text
                x={point.labelX}
                y={point.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="500"
                fontFamily="Inter, sans-serif"
                style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}
              >
                {point.name}
              </text>
              
              {/* Skill percentage */}
              <text
                x={point.labelX}
                y={point.labelY + 12}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#8b5cf6"
                fontSize="10"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
                style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}
              >
                {point.grade}%
              </text>
            </g>
          ))}

          {/* Center dot */}
          <circle
            cx={center}
            cy={center}
            r={3}
            fill="#ffffff"
            opacity={0.8}
          />
        </svg>
      </div>

      {/* Stats summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(139, 92, 246, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(139, 92, 246, 0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#a0a0b0', fontSize: '0.8rem', marginBottom: '4px' }}>
            Skills Tracked
          </div>
          <div style={{ color: '#8b5cf6', fontSize: '1.1rem', fontWeight: '600' }}>
            {skills.length}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#a0a0b0', fontSize: '0.8rem', marginBottom: '4px' }}>
            Highest Skill
          </div>
          <div style={{ color: '#8b5cf6', fontSize: '1.1rem', fontWeight: '600' }}>
            {Math.round(Math.max(...skills.map(s => s.grade)))}%
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#a0a0b0', fontSize: '0.8rem', marginBottom: '4px' }}>
            Average
          </div>
          <div style={{ color: '#8b5cf6', fontSize: '1.1rem', fontWeight: '600' }}>
            {Math.round(skills.reduce((sum, s) => sum + s.grade, 0) / skills.length)}%
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkillsRadarChart