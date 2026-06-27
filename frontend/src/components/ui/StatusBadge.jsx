import React from 'react'

const statusConfig = {
  'Pending': { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
  'Under Review': { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
  'Quoted': { bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-500' },
  'Approved': { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-500' },
  'Allocated': { bg: 'bg-teal-500/20', text: 'text-teal-400', dot: 'bg-teal-500' },
  'Delivered': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', dot: 'bg-indigo-500' },
  'Completed': { bg: 'bg-slate-700/50', text: 'text-slate-700', dot: 'bg-slate-500' },
  'Rejected': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  'Verified': { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-500' },
  // Quotation statuses
  'Draft': { bg: 'bg-slate-700/50', text: 'text-slate-700', dot: 'bg-slate-400' },
  'Sent': { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' }
  return (
    <span className={`badge ${config.bg} ${config.text} gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} inline-block`} />
      {status}
    </span>
  )
}

