import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import { Search, Filter, Eye, RefreshCw, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

const ALL_STATUSES = ['All', 'Pending', 'Under Review', 'Quoted', 'Approved', 'Allocated', 'Delivered', 'Completed', 'Rejected']

export default function Requests() {
  const [requests, setRequests] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

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

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

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

  function confirmDelete(req) {
    setDeleteTarget(req)
    setDeleteModal(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('rental_requests')
        .delete()
        .eq('id', deleteTarget.id)

      if (error) throw error
      showToast('Rental request deleted successfully')
      setDeleteModal(false)
      setDeleteTarget(null)
      await loadRequests()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDeleting(false)
    }
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

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSpinner text="Loading requests..." />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No requests found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
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
                      <code className="text-xs bg-slate-50 text-slate-400 px-2 py-0.5 rounded font-mono">
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
                    <td className="table-td font-semibold text-slate-900">
                      {req.quotations?.[0]?.total_amount
                        ? `₹${Number(req.quotations[0].total_amount).toLocaleString('en-IN')}`
                        : <span className="text-slate-700 font-normal">—</span>}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/requests/${req.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 
                                     hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye size={13} /> View
                        </Link>
                        <button
                          onClick={() => confirmDelete(req)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 
                                     hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {requests.length} requests
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Request" size="sm">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <p className="text-slate-700 font-semibold mb-1">Delete request for "{deleteTarget?.companies?.company_name}"?</p>
          <p className="text-slate-400 text-sm mb-6">This action cannot be undone. All items associated with this request will also be deleted.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setDeleteModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
              {deleting ? <><Loader2 size={15} className="animate-spin" /> Deleting...</> : 'Delete Request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 animate-in
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}

