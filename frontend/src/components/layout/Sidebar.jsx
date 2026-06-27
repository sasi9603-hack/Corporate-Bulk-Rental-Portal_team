import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, FileText, Package, Receipt, ShieldCheck,
  LogOut, Menu, X, Monitor, ChevronRight, Building2, DollarSign,
  Truck, RotateCcw, MessageSquare
} from 'lucide-react'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/requests', icon: FileText, label: 'Requests' },
  { to: '/admin/kyc', icon: ShieldCheck, label: 'KYC Verification' },
  { to: '/admin/inventory', icon: Package, label: 'Inventory' },
  { to: '/admin/quotations', icon: Receipt, label: 'Quotations' },
  { to: '/admin/billing', icon: DollarSign, label: 'Billing & Invoices' },
  { to: '/admin/support', icon: MessageSquare, label: 'Helpdesk' },
  { to: '/admin/logistics', icon: Truck, label: 'Logistics' },
  { to: '/admin/returns', icon: RotateCcw, label: 'Returns' },
]

export default function Sidebar({ mobile = false, onClose }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
          <Monitor size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-900 text-sm leading-tight">Corporate Rental</p>
          <p className="text-xs text-slate-400">Admin Portal</p>
        </div>
        {mobile && (
          <button onClick={onClose} className="ml-auto p-1 rounded-lg hover:bg-slate-50 text-slate-500">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-3">Main Menu</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={mobile ? onClose : undefined}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
            <ChevronRight size={14} className="ml-auto opacity-50" />
          </NavLink>
        ))}
      </nav>

      {/* User + Sign Out */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-bold text-sm">
              {(profile?.full_name || profile?.email || 'A')[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {profile?.full_name || 'Admin'}
            </p>
            <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return content
}

