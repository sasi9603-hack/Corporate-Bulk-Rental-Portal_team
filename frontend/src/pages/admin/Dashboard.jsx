import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import KPICard from '../../components/ui/KPICard'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import {
  FileText, Clock, CheckCircle, Package, DollarSign,
  TrendingUp, ArrowRight, Activity, Laptop, Monitor
} from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentRequests, setRecentRequests] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Parallel fetch
      const [reqRes, quotRes, histRes] = await Promise.all([
        supabase.from('rental_requests').select('id, status, created_at, event_name, companies(company_name)'),
        supabase.from('quotations').select('total_amount, status'),
        supabase.from('status_history').select('*, rental_requests(event_name, companies(company_name))').order('changed_at', { ascending: false }).limit(8),
      ])

      const requests = reqRes.data || []
      const quotations = quotRes.data || []
      const history = histRes.data || []

      const totalRevenue = quotations
        .filter(q => q.status === 'Approved')
        .reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0)

      setStats({
        total: requests.length,
        pending: requests.filter(r => r.status === 'Pending').length,
        approved: requests.filter(r => r.status === 'Approved').length,
        completed: requests.filter(r => r.status === 'Completed').length,
        revenue: totalRevenue,
      })

      setRecentRequests(requests
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
      )

      setActivity(history)
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Welcome back — here's what's happening today</p>
        </div>
        <Link to="/admin/requests" className="btn-primary btn-sm">
          View All Requests <ArrowRight size={14} />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KPICard title="Total Requests" value={stats?.total} icon={FileText} color="blue" />
        <KPICard title="Pending" value={stats?.pending} icon={Clock} color="amber" />
        <KPICard title="Approved" value={stats?.approved} icon={CheckCircle} color="green" />
        <KPICard title="Completed" value={stats?.completed} icon={Package} color="teal" />
        <KPICard
          title="Total Revenue"
          value={`₹${(stats?.revenue || 0).toLocaleString('en-IN')}`}
          icon={DollarSign}
          color="purple"
          subtitle="From approved quotations"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Requests Table */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-600" />
              <h2 className="font-bold text-slate-800">Recent Requests</h2>
            </div>
            <Link to="/admin/requests" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
              See all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Company</th>
                  <th className="table-th">Event</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-td text-center text-slate-400 py-12">
                      No requests yet
                    </td>
                  </tr>
                ) : recentRequests.map(r => (
                  <tr key={r.id} className="table-row">
                    <td className="table-td font-medium text-slate-900">
                      {r.companies?.company_name || '—'}
                    </td>
                    <td className="table-td">{r.event_name}</td>
                    <td className="table-td text-slate-400 text-xs">
                      {format(new Date(r.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="table-td">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
            <Activity size={18} className="text-primary-600" />
            <h2 className="font-bold text-slate-800">Recent Activity</h2>
          </div>
          <div className="px-6 py-4 space-y-4 max-h-80 overflow-y-auto">
            {activity.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No activity yet</p>
            ) : activity.map(item => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity size={13} className="text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">
                    <span className="font-medium">{item.rental_requests?.companies?.company_name || 'Request'}</span>
                    {' → '}
                    <StatusBadge status={item.new_status} />
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {format(new Date(item.changed_at), 'dd MMM, hh:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Requests This Month',
            value: recentRequests.filter(r => new Date(r.created_at).getMonth() === new Date().getMonth()).length,
            icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50'
          },
          {
            label: 'Under Review',
            value: stats ? (stats.total - stats.pending - stats.approved - stats.completed) : 0,
            icon: Monitor, color: 'text-purple-600', bg: 'bg-purple-50'
          },
          {
            label: 'Avg. Request Value',
            value: stats?.revenue && stats?.completed
              ? `₹${Math.round(stats.revenue / stats.completed).toLocaleString('en-IN')}`
              : '₹0',
            icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50'
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
