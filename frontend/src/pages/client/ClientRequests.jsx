import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Search, PlusCircle, Eye, FileText } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_FILTERS = ['All', 'Pending', 'Under Review', 'Quoted', 'Approved', 'Allocated', 'Delivered', 'Completed', 'Rejected']

export default function ClientRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => { if (user) loadRequests() }, [user])

  useEffect(() => {
    let data = requests
    if (statusFilter !== 'All') data = data.filter(r => r.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(r =>
        r.event_name?.toLowerCase().includes(q) ||
        r.companies?.company_name?.toLowerCase().includes(q) ||
        r.delivery_location?.toLowerCase().includes(q)
      )
    }
    setFiltered(data)
  }, [requests, search, statusFilter])

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

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">My Requests</h1>
          <p className="text-slate-400 text-sm mt-0.5">{requests.length} total requests submitted</p>
        </div>
        <Link to="/request" className="btn-primary">
          <PlusCircle size={16} /> New Request
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search by event name or location..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUS_FILTERS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading your requests..." />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto mb-4 text-slate-900" />
            <p className="font-semibold text-slate-500 mb-1">No requests found</p>
            <p className="text-slate-400 text-sm mb-6">
              {requests.length === 0 ? 'Submit your first rental request to get started.' : 'Try adjusting your filters.'}
            </p>
            {requests.length === 0 && (
              <Link to="/request" className="btn-primary inline-flex">
                <PlusCircle size={15} /> Submit a Request
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="table-th">Event</th>
                  <th className="table-th">Duration</th>
                  <th className="table-th">Location</th>
                  <th className="table-th">Submitted</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Quotation</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(req => (
                  <tr key={req.id} className="table-row">
                    <td className="table-td">
                      <div>
                        <p className="font-semibold text-slate-900">{req.event_name}</p>
                        <p className="text-xs text-slate-400">{req.companies?.company_name}</p>
                      </div>
                    </td>
                    <td className="table-td text-sm text-slate-400">
                      <p>{format(new Date(req.start_date + 'T00:00:00'), 'dd MMM')}</p>
                      <p className="text-xs text-slate-400">to {format(new Date(req.end_date + 'T00:00:00'), 'dd MMM yyyy')}</p>
                    </td>
                    <td className="table-td text-slate-500 text-sm max-w-[160px] truncate">
                      {req.delivery_location}
                    </td>
                    <td className="table-td text-xs text-slate-400">
                      {format(new Date(req.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="table-td">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="table-td">
                      {req.quotations?.[0]?.total_amount ? (
                        <div>
                          <p className="font-bold text-green-700">
                            ₹{Number(req.quotations[0].total_amount).toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-slate-400">{req.quotations[0].status}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Awaiting quote</span>
                      )}
                    </td>
                    <td className="table-td">
                      <Link to={`/client/requests/${req.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 
                                   hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
                        <Eye size={13} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {requests.length} requests
          </div>
        )}
      </div>
    </div>
  )
}

