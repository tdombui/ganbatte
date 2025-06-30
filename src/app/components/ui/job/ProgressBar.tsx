import React from 'react'

interface ProgressBarProps {
  nodes: string[]
  current: number // index of current node
  completed?: number[] // indices of completed nodes
}

export default function ProgressBar({ nodes, current, completed = [] }: ProgressBarProps) {
  return (
    <div className="flex items-center w-full my-4 overflow-x-auto">
      {nodes.map((label, idx) => (
        <React.Fragment key={idx}>
          <div className="flex flex-col items-center min-w-0 flex-shrink-0">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-xs
                ${completed.includes(idx) ? 'bg-green-500 text-white' : idx === current ? 'bg-yellow-400 text-black' : 'bg-gray-400 text-white'}`}
            >
              {idx + 1}
            </div>
            <div className="text-xs mt-1 text-center w-12 truncate text-gray-300">{label}</div>
          </div>
          {idx < nodes.length - 1 && (
            <div className={`flex-1 h-1 mx-1 min-w-2 ${completed.includes(idx) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
} 