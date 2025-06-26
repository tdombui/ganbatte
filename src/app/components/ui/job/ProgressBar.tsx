import React from 'react'

interface ProgressBarProps {
  nodes: string[]
  current: number // index of current node
  completed?: number[] // indices of completed nodes
}

export default function ProgressBar({ nodes, current, completed = [] }: ProgressBarProps) {
  return (
    <div className="flex items-center w-full my-4">
      {nodes.map((label, idx) => (
        <React.Fragment key={idx}>
          <div className="flex flex-col items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs
                ${completed.includes(idx) ? 'bg-green-500 text-white' : idx === current ? 'bg-yellow-400 text-black' : 'bg-gray-400 text-white'}`}
            >
              {idx + 1}
            </div>
            <div className="text-xs mt-1 text-center w-20 truncate">{label}</div>
          </div>
          {idx < nodes.length - 1 && (
            <div className={`flex-1 h-2 mx-1 ${completed.includes(idx) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
} 