import React from 'react'

export default function KPICard({ title, value, icon: Icon, color = 'blue', trend, subtitle }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
      border: 'border-blue-100',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      iconBg: 'bg-amber-100',
      border: 'border-amber-100',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      iconBg: 'bg-green-100',
      border: 'border-green-100',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      iconBg: 'bg-purple-100',
      border: 'border-purple-100',
    },
    teal: {
      bg: 'bg-teal-50',
      icon: 'text-teal-600',
      iconBg: 'bg-teal-100',
      border: 'border-teal-100',
    },
    slate: {
      bg: 'bg-slate-50',
      icon: 'text-slate-400',
      iconBg: 'bg-slate-50',
      border: 'border-slate-200',
    },
  }

  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`card p-6 animate-in border ${c.border} hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
              {trend.positive ? '↑' : '↓'} {trend.label}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
          {Icon && <Icon size={22} className={c.icon} />}
        </div>
      </div>
    </div>
  )
}

