import React from 'react'

interface ProgressBarProps {
  percentage: number // 0-100
  status: string // e.g., "En Route", "At Pickup", "Loading", etc.
  color?: 'blue' | 'green' | 'yellow' | 'purple'
}

export default function ProgressBar({ percentage, status, color = 'blue' }: ProgressBarProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500', 
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  }

  return (
    <div className="w-full my-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-300">{status}</span>
        <span className="text-sm font-medium text-gray-300">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3">
        <div 
          className={`${colorClasses[color]} h-3 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
} 