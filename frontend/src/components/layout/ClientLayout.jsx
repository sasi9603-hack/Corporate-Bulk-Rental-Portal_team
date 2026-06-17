import React, { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, FileText, LogOut, Menu, X,
  Monitor, ChevronRight, Building2, Bell, PlusCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'

const navItems = [
  { to: '/client/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
  { to: '/client/requests', icon: FileText, label: 'My Requests' },
]

export default function ClientLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const Sidebar = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
          <Monitor size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-900 text-sm leading-tight">CorpRentalPro</p>
          <p className="text-xs text-slate-400">Client Portal</p>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-3">Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={mobile ? () => setSidebarOpen(false) : undefined}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
            <ChevronRight size={14} className="ml-auto opacity-50" />
          </NavLink>
        ))}

        {/* Quick CTA */}
        <div className="pt-4">
          <Link to="/request"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-50 text-primary-700 
                       hover:bg-primary-100 transition-all font-medium text-sm border border-primary-100">
            <PlusCircle size={16} />
            New Rental Request
          </Link>
        </div>
      </nav>

      {/* User + Sign Out */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-bold text-sm">
              {(profile?.full_name || profile?.email || 'C')[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{profile?.full_name || 'Client'}</p>
            <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-50 shadow-xl animate-in">
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600">
                <Menu size={20} />
              </button>
              <div>
                <p className="text-sm font-semibold text-slate-800 hidden sm:block">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/request"
                className="btn-primary btn-sm hidden sm:inline-flex">
                <PlusCircle size={14} /> New Request
              </Link>
              <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <Bell size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
