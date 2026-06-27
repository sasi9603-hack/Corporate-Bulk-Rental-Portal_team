import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import KPICard from '../../components/ui/KPICard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import {
  FileText, Clock, CheckCircle, ArrowRight, PlusCircle,
  Package, DollarSign, Activity
} from 'lucide-react'
import { format } from 'date-fns'

export default function ClientDashboard() {
  const { user, profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) loadRequests() }, [user])

  async function loadRequests() {
    setLoading(true)
    const { data } = await supabase
      .from('rental_requests')
      .select('*, companies(company_name), quotations(total_amount, status)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => ['Pending', 'Under Review'].includes(r.status)).length,
    approved: requests.filter(r => r.status === 'Approved').length,
    completed: requests.filter(r => r.status === 'Completed').length,
  }

  const recentRequests = requests.slice(0, 5)

  if (loading) return <LoadingSpinner text="Loading your dashboard..." />

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          My Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Track your rental requests and quotations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Requests" value={stats.total} icon={FileText} color="blue" />
        <KPICard title="In Progress" value={stats.pending} icon={Clock} color="amber" />
        <KPICard title="Approved" value={stats.approved} icon={CheckCircle} color="green" />
        <KPICard title="Completed" value={stats.completed} icon={Package} color="teal" />
      </div>

      {/* Empty state or content */}
      {requests.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <PlusCircle size={36} className="text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Requests Yet</h2>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            Submit your first bulk rental request and we'll get back to you with a custom quotation within 24 hours.
          </p>
          <Link to="/request" className="btn-primary inline-flex">
            <PlusCircle size={16} /> Submit a Request
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Requests */}
          <div className="xl:col-span-2 card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary-600" />
                <h2 className="font-bold text-slate-900">Recent Requests</h2>
              </div>
              <Link to="/client/requests" className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:text-primary-700">
                See all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="table-th">Event</th>
                    <th className="table-th">Date</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Quotation</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map(req => (
                    <tr key={req.id} className="table-row">
                      <td className="table-td">
                        <div>
                          <p className="font-semibold text-slate-900">{req.event_name}</p>
                          <p className="text-xs text-slate-400">{req.companies?.company_name}</p>
                        </div>
                      </td>
                      <td className="table-td text-slate-400 text-xs">
                        {format(new Date(req.created_at), 'dd MMM yyyy')}
                      </td>
                      <td className="table-td">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="table-td font-semibold text-slate-900">
                        {req.quotations?.[0]?.total_amount
                          ? <span className="text-green-700">₹{Number(req.quotations[0].total_amount).toLocaleString('en-IN')}</span>
                          : <span className="text-slate-700 font-normal text-xs">Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status Summary */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Activity size={18} className="text-primary-600" />
              <h2 className="font-bold text-slate-900">Request Status</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Pending Review', count: requests.filter(r => r.status === 'Pending').length, color: 'bg-amber-400' },
                { label: 'Under Review', count: requests.filter(r => r.status === 'Under Review').length, color: 'bg-blue-400' },
                { label: 'Quoted', count: requests.filter(r => r.status === 'Quoted').length, color: 'bg-purple-400' },
                { label: 'Approved', count: requests.filter(r => r.status === 'Approved').length, color: 'bg-green-400' },
                { label: 'Allocated', count: requests.filter(r => r.status === 'Allocated').length, color: 'bg-teal-400' },
                { label: 'Delivered', count: requests.filter(r => r.status === 'Delivered').length, color: 'bg-indigo-400' },
                { label: 'Completed', count: requests.filter(r => r.status === 'Completed').length, color: 'bg-slate-400' },
                { label: 'Rejected', count: requests.filter(r => r.status === 'Rejected').length, color: 'bg-red-400' },
              ].filter(s => s.count > 0).map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                  <span className="text-sm text-slate-400 flex-1">{label}</span>
                  <span className="font-bold text-slate-900 text-sm">{count}</span>
                </div>
              ))}

              {requests.filter(r => !['Completed', 'Rejected'].includes(r.status)).length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">All caught up!</p>
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100">
              <Link to="/request" className="btn-primary w-full justify-center text-sm">
                <PlusCircle size={15} /> New Request
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Help Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg mb-1">Need Help?</h3>
            <p className="text-white/80 text-sm">
              Our team is available 24/7 to assist with your rental requirements.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a href="tel:+911234567890"
              className="px-5 py-2.5 bg-white text-primary-700 font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors">
              📞 Call Us
            </a>
            <a href="mailto:hello@corprental.com"
              className="px-5 py-2.5 bg-white/20 text-white font-semibold rounded-xl text-sm border border-white/30 hover:bg-white/30 transition-colors">
              ✉️ Email
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

