import { useMemo, useState, useEffect, useRef } from 'react'

function XPChart({ xpTransactions, availableFolders, selectedFolder, onFolderChange }) {
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null)
  const [zoomState, setZoomState] = useState({
    scale: 1,
    centerX: 0,
    centerY: 0,
    isZoomed: false
  })
  const hoverTimeoutRef = useRef(null)

  const chartData = useMemo(() => {
    if (!xpTransactions || xpTransactions.length === 0) {
      const folderName = selectedFolder === 'all' ? 'All Folders' : selectedFolder
      return { points: [], maxXP: 0, maxDate: null, minDate: null, folderName }
    }

    const folderName = selectedFolder === 'all' ? 'All Folders' : selectedFolder

    // Sort transactions by date
    const sortedTransactions = [...xpTransactions].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    )

    // Calculate cumulative XP over time
    let cumulativeXP = 0
    const points = sortedTransactions.map(transaction => {
      cumulativeXP += transaction.amount
      return {
        date: new Date(transaction.createdAt),
        xp: cumulativeXP / 1000, // Convert to kB (cumulative)
        project: transaction.object?.name || 'Unknown',
        folder: selectedFolder,
        transactionAmount: transaction.amount, // Individual transaction amount
        originalTransaction: transaction
      }
    })

    const maxXP = Math.max(...points.map(p => p.xp))
    const minDate = points[0]?.date
    const maxDate = points[points.length - 1]?.date

    return { points, maxXP, maxDate, minDate, folderName }
  }, [xpTransactions, selectedFolder])

  const { points, maxXP, maxDate, minDate, folderName } = chartData

  if (!points.length) {
    return (
      <div className="xp-chart-container">
        <div className="chart-header">
          <h2>XP Progress Over Time - {folderName}</h2>
        </div>
        
        {availableFolders.length > 1 && (
          <div className="folder-selector">
            {availableFolders.map(folder => (
              <button
                key={folder}
                className={`folder-tab ${selectedFolder === folder ? 'active' : ''}`}
                onClick={() => onFolderChange(folder)}
              >
                {folder === 'all' ? 'All Folders' : folder}
              </button>
            ))}
          </div>
        )}
        
        <div className="no-data">No XP transactions found for {folderName}</div>
      </div>
    )
  }

  // Chart dimensions
  const width = 800
  const height = 400
  const margin = { top: 20, right: 40, bottom: 60, left: 80 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // Base scale functions (without zoom)
  const baseXScale = (date) => {
    const timeDiff = maxDate - minDate
    const pointTimeDiff = date - minDate
    return (pointTimeDiff / timeDiff) * chartWidth
  }

  const baseYScale = (xp) => {
    return chartHeight - (xp / maxXP) * chartHeight
  }

  // Handle hover events
  const handlePointHover = (index) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    
    setHoveredPointIndex(index)
    if (index !== null && points[index]) {
      const point = points[index]
      
      // Check if there are nearby transactions within 3 days
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000 // 3 days in milliseconds
      const hasNearbyTransactions = points.some((otherPoint, otherIndex) => {
        if (otherIndex === index) return false // Skip the same point
        const timeDiff = Math.abs(point.date.getTime() - otherPoint.date.getTime())
        return timeDiff <= threeDaysMs
      })
      
      // Only zoom if there are nearby transactions
      if (hasNearbyTransactions) {
        const centerX = baseXScale(point.date)
        const centerY = baseYScale(point.xp)
        setZoomState({
          scale: 2,
          centerX,
          centerY,
          isZoomed: true
        })
      }
    }
  }

  const handleMouseLeave = () => {
    // Set timeout to zoom out after 0.5 seconds
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredPointIndex(null)
      setZoomState({
        scale: 1,
        centerX: 0,
        centerY: 0,
        isZoomed: false
      })
    }, 500)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Scale functions with zoom
  const xScale = (date) => {
    const baseX = baseXScale(date)
    
    if (zoomState.isZoomed) {
      // Apply zoom transformation
      const scaledX = (baseX - zoomState.centerX) * zoomState.scale + zoomState.centerX
      return scaledX
    }
    return baseX
  }

  const yScale = (xp) => {
    const baseY = baseYScale(xp)
    
    if (zoomState.isZoomed) {
      // Apply zoom transformation
      const scaledY = (baseY - zoomState.centerY) * zoomState.scale + zoomState.centerY
      return scaledY
    }
    return baseY
  }

  // Generate path for the line
  const pathData = points.map((point, index) => {
    const x = xScale(point.date)
    const y = yScale(point.xp)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  // Generate Y-axis ticks - use zoomed Y position, fixed X position
  const yTicks = []
  const tickCount = 5
  for (let i = 0; i <= tickCount; i++) {
    const value = (maxXP / tickCount) * i
    yTicks.push({
      value: Math.round(value),
      y: yScale(value) // Use zoomed scale for Y position
    })
  }

  // Generate X-axis ticks - use zoomed X position, fixed Y position  
  const xTicks = []
  const xTickCount = 5
  for (let i = 0; i <= xTickCount; i++) {
    const timeDiff = maxDate - minDate
    const tickTime = minDate.getTime() + (timeDiff / xTickCount) * i
    const tickDate = new Date(tickTime)
    xTicks.push({
      date: tickDate,
      x: xScale(tickDate), // Use zoomed scale for X position
      label: tickDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: tickDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      })
    })
  }

  return (
    <div className="xp-chart-container">
      <div className="chart-header">
        <h2>XP Progress Over Time - {folderName}</h2>
      </div>
      
      {availableFolders.length > 1 && (
        <div className="folder-selector">
          {availableFolders.map(folder => (
            <button
              key={folder}
              className={`folder-tab ${selectedFolder === folder ? 'active' : ''}`}
              onClick={() => onFolderChange(folder)}
            >
              {folder === 'all' ? 'All Folders' : folder}
            </button>
          ))}
        </div>
      )}
      
      <div className="chart-stats">
        <div className="stat">
          <span className="stat-label">Total XP:</span>
          <span className="stat-value">{Math.round(maxXP).toLocaleString()} kB</span>
        </div>
        <div className="stat">
          <span className="stat-label">Transactions:</span>
          <span className="stat-value">{points.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Period:</span>
          <span className="stat-value">
            {minDate?.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })} - {maxDate?.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
        </div>
      </div>

      <div className="chart-wrapper">
        <svg width={width} height={height} className="xp-chart">
          <defs>
            <linearGradient id="xpGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#8b5cf6', stopOpacity: 0.3}} />
              <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0}} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <clipPath id="chartClip">
              <rect x={0} y={0} width={chartWidth} height={chartHeight} />
            </clipPath>
          </defs>

          <g 
            transform={`translate(${margin.left}, ${margin.top})`}
            style={{ 
              transition: 'all 0.5s ease-out',
              transformOrigin: zoomState.isZoomed ? `${zoomState.centerX}px ${zoomState.centerY}px` : 'center'
            }}
          >
            {/* Grid lines */}
            {yTicks.map((tick, index) => (
              <g key={index}>
                <line
                  x1={0}
                  y1={tick.y}
                  x2={chartWidth}
                  y2={tick.y}
                  stroke="#2a2a35"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                />
              </g>
            ))}

            {xTicks.map((tick, index) => (
              <line
                key={index}
                x1={tick.x}
                y1={0}
                x2={tick.x}
                y2={chartHeight}
                stroke="#2a2a35"
                strokeWidth={1}
                strokeOpacity={0.5}
              />
            ))}

            {/* Clipped chart content */}
            <g clipPath="url(#chartClip)">
              {/* Area under curve */}
              <path
                d={`${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                fill="url(#xpGradient)"
              />

              {/* Main line */}
              <path
                d={pathData}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth={3}
                filter="url(#glow)"
              />

              {/* Data points */}
              {points.map((point, index) => (
                <g key={index}>
                  {/* Invisible larger hover area */}
                  <circle
                    cx={xScale(point.date)}
                    cy={yScale(point.xp)}
                    r={12}
                    fill="transparent"
                    className="hover-area"
                    onMouseEnter={() => handlePointHover(index)}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: 'pointer' }}
                  >
                    <title>{`${point.project}: ${Math.round(point.xp)} kB on ${point.date.toLocaleDateString()}`}</title>
                  </circle>
                  
                  {/* Visible data point */}
                  <circle
                    cx={xScale(point.date)}
                    cy={yScale(point.xp)}
                    r={hoveredPointIndex === index ? 6 : 4}
                    fill="#8b5cf6"
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="data-point"
                    style={{
                      transition: 'all 0.3s ease',
                      pointerEvents: 'none'
                    }}
                  />
                </g>
              ))}
            </g>

            {/* Y-axis */}
            <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#ffffff" strokeWidth={2}/>
            
            {/* X-axis */}
            <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#ffffff" strokeWidth={2}/>

            {/* Y-axis labels - fixed X position, zoomed Y position */}
            {yTicks.map((tick, index) => (
              <text
                key={index}
                x={-10}
                y={tick.y + 4}
                textAnchor="end"
                fill="#a0a0b0"
                fontSize="12"
                fontFamily="Inter, sans-serif"
                style={{
                  transform: `translateX(0)`, // Lock horizontal movement
                }}
              >
                {tick.value}k
              </text>
            ))}

            {/* X-axis labels - zoomed X position, fixed Y position */}
            {xTicks.map((tick, index) => (
              <text
                key={index}
                x={tick.x}
                y={chartHeight + 20}
                textAnchor="middle"
                fill="#a0a0b0"
                fontSize="12"
                fontFamily="Inter, sans-serif"
                style={{
                  transform: `translateY(0)`, // Lock vertical movement
                }}
              >
                {tick.label}
              </text>
            ))}

            {/* Axis labels */}
            <text
              x={chartWidth / 2}
              y={chartHeight + 50}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="14"
              fontWeight="500"
              fontFamily="Inter, sans-serif"
            >
              Date
            </text>

            <text
              x={-40}
              y={chartHeight / 2}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="14"
              fontWeight="500"
              fontFamily="Inter, sans-serif"
              transform={`rotate(-90, -40, ${chartHeight / 2})`}
            >
              XP (kB)
            </text>
          </g>
        </svg>
      </div>



    </div>
  )
}

export default XPChart