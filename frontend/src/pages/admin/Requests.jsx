import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Search, Filter, Eye, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

const ALL_STATUSES = ['All', 'Pending', 'Under Review', 'Quoted', 'Approved', 'Allocated', 'Delivered', 'Completed', 'Rejected']

export default function Requests() {
  const [requests, setRequests] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => { loadRequests() }, [])

  useEffect(() => {
    let data = requests
    if (statusFilter !== 'All') data = data.filter(r => r.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(r =>
        r.companies?.company_name?.toLowerCase().includes(q) ||
        r.event_name?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q)
      )
    }
    setFiltered(data)
  }, [requests, search, statusFilter])

  async function loadRequests() {
    setLoading(true)
    const { data, error } = await supabase
      .from('rental_requests')
      .select('*, companies(company_name, email, phone), quotations(total_amount, status)')
      .order('created_at', { ascending: false })

    if (!error) {
      setRequests(data || [])
      setFiltered(data || [])
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Rental Requests</h1>
          <p className="text-slate-400 text-sm mt-0.5">{requests.length} total requests</p>
        </div>
        <button onClick={loadRequests} className="btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10"
              placeholder="Search by company, event, or request ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative sm:w-56">
            <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="input pl-10 appearance-none"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table & Cards */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading requests..." />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No requests found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {/* Desktop Table (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="table-th">Request ID</th>
                    <th className="table-th">Company</th>
                    <th className="table-th">Event</th>
                    <th className="table-th">Request Date</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Amount</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(req => (
                    <tr key={req.id} className="table-row">
                      <td className="table-td">
                        <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          {req.id.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="table-td">
                        <div>
                          <p className="font-semibold text-slate-900">{req.companies?.company_name}</p>
                          <p className="text-xs text-slate-400">{req.companies?.email}</p>
                        </div>
                      </td>
                      <td className="table-td">
                        <div>
                          <p className="font-medium">{req.event_name}</p>
                          <p className="text-xs text-slate-400">
                            {req.start_date} → {req.end_date}
                          </p>
                        </div>
                      </td>
                      <td className="table-td text-slate-500 text-xs">
                        {format(new Date(req.created_at), 'dd MMM yyyy')}
                      </td>
                      <td className="table-td">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="table-td font-semibold text-slate-800">
                        {req.quotations?.[0]?.total_amount
                          ? `₹${Number(req.quotations[0].total_amount).toLocaleString('en-IN')}`
                          : <span className="text-slate-300 font-normal">—</span>}
                      </td>
                      <td className="table-td">
                        <Link
                          to={`/admin/requests/${req.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 
                                     hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye size={13} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Grid Card System (Hidden on Desktop) */}
            <div className="grid grid-cols-1 gap-4 md:hidden p-4 bg-slate-50/50">
              {filtered.map(req => (
                <div key={req.id} className="card p-4 hover:shadow-md transition-shadow relative">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {req.id.slice(0, 8)}...
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                  
                  <h3 className="font-bold text-slate-900 text-sm">{req.companies?.company_name}</h3>
                  <p className="text-xs text-slate-500 mb-2">{req.companies?.email}</p>
                  
                  <div className="border-t border-slate-100 my-2 pt-2">
                    <p className="text-xs font-medium text-slate-700">Event: {req.event_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Dates: {req.start_date} → {req.end_date}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400">Total Amount</p>
                      <p className="text-sm font-bold text-slate-800">
                        {req.quotations?.[0]?.total_amount
                          ? `₹${Number(req.quotations[0].total_amount).toLocaleString('en-IN')}`
                          : '—'}
                      </p>
                    </div>
                    <Link
                      to={`/admin/requests/${req.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 
                                 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Eye size={13} /> View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {requests.length} requests
          </div>
        )}
      </div>
    </div>
  )
}
