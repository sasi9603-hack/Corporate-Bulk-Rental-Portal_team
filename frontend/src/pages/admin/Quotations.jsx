import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import {
  Receipt, Search, Eye, CheckCircle, XCircle,
  FileDown, Loader2, AlertCircle, DollarSign, RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import jsPDF from 'jspdf'

export default function Quotations() {
  const { user } = useAuth()
  const [quotations, setQuotations] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [actionModal, setActionModal] = useState(null) // { type: 'approve'|'reject', quotation }
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { loadQuotations() }, [])

  useEffect(() => {
    let data = quotations
    if (statusFilter !== 'All') data = data.filter(q => q.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(qo =>
        qo.rental_requests?.companies?.company_name?.toLowerCase().includes(q) ||
        qo.rental_requests?.event_name?.toLowerCase().includes(q) ||
        qo.id?.toLowerCase().includes(q)
      )
    }
    setFiltered(data)
  }, [quotations, search, statusFilter])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadQuotations() {
    setLoading(true)
    const { data, error } = await supabase
      .from('quotations')
      .select('*, rental_requests(id, event_name, start_date, end_date, status, companies(company_name, contact_person, email))')
      .order('created_at', { ascending: false })
    if (!error) setQuotations(data || [])
    setLoading(false)
  }

  async function handleApprove(quotation) {
    setSaving(true)
    try {
      await supabase.from('quotations').update({ status: 'Approved' }).eq('id', quotation.id)
      await supabase.from('rental_requests').update({ status: 'Approved' }).eq('id', quotation.request_id)
      await supabase.from('status_history').insert({
        request_id: quotation.request_id,
        old_status: quotation.rental_requests?.status,
        new_status: 'Approved',
        changed_by: user?.id,
        admin_note: 'Quotation approved',
      })
      setActionModal(null)
      showToast('Quotation approved')
      await loadQuotations()
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleReject(quotation) {
    setSaving(true)
    try {
      await supabase.from('quotations').update({ status: 'Rejected' }).eq('id', quotation.id)
      await supabase.from('rental_requests').update({ status: 'Rejected' }).eq('id', quotation.request_id)
      await supabase.from('status_history').insert({
        request_id: quotation.request_id,
        old_status: quotation.rental_requests?.status,
        new_status: 'Rejected',
        changed_by: user?.id,
        admin_note: 'Quotation rejected',
      })
      setActionModal(null)
      showToast('Quotation rejected')
      await loadQuotations()
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  function exportPDF(quotation) {
    const doc = new jsPDF()
    const req = quotation.rental_requests
    const company = req?.companies

    // Header
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('QUOTATION', 20, 22)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('CorpRentalPro — Corporate IT Equipment Rental', 20, 32)

    // Quotation Number
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text(`QUO-${quotation.id.slice(0, 8).toUpperCase()}`, 150, 22, { align: 'left' })
    doc.text(format(new Date(quotation.created_at), 'dd MMM yyyy'), 150, 32)

    // Company Info
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Billed To:', 20, 55)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(company?.company_name || '—', 20, 63)
    doc.text(`Contact: ${company?.contact_person || '—'}`, 20, 70)
    doc.text(`Email: ${company?.email || '—'}`, 20, 77)

    // Event Info
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Event Details:', 120, 55)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(req?.event_name || '—', 120, 63)
    doc.text(`From: ${req?.start_date || '—'}`, 120, 70)
    doc.text(`To: ${req?.end_date || '—'}`, 120, 77)

    // Divider
    doc.setDrawColor(226, 232, 240)
    doc.line(20, 85, 190, 85)

    // Total
    doc.setFillColor(239, 246, 255)
    doc.rect(20, 90, 170, 30, 'F')
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL AMOUNT', 25, 103)
    doc.setFontSize(18)
    doc.setTextColor(37, 99, 235)
    doc.text(`INR ${Number(quotation.total_amount).toLocaleString('en-IN')}`, 130, 103)

    // Status
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.text(`Status: ${quotation.status}`, 25, 130)

    // Notes
    if (quotation.quotation_notes) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(30, 41, 59)
      doc.text('Notes & Terms:', 20, 145)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)
      const lines = doc.splitTextToSize(quotation.quotation_notes, 170)
      doc.text(lines, 20, 153)
    }

    // Footer
    doc.setFillColor(248, 250, 252)
    doc.rect(0, 270, 210, 27, 'F')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('CorpRentalPro | hello@corprental.com | +91 12345 67890 | Pan India', 105, 280, { align: 'center' })
    doc.text('This is a computer-generated quotation. No signature required.', 105, 287, { align: 'center' })

    doc.save(`Quotation-${quotation.id.slice(0, 8)}.pdf`)
    showToast('PDF exported successfully')
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 animate-in
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Quotations</h1>
          <p className="text-slate-400 text-sm mt-0.5">{quotations.length} quotations generated</p>
        </div>
        <button onClick={loadQuotations} className="btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', count: quotations.length, color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Sent', count: quotations.filter(q => q.status === 'Sent').length, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Approved', count: quotations.filter(q => q.status === 'Approved').length, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Rejected', count: quotations.filter(q => q.status === 'Rejected').length, color: 'text-red-700', bg: 'bg-red-50' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`card p-4 ${bg} text-center border-0`}>
            <p className={`text-2xl font-extrabold ${color}`}>{count}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search by company or event..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {['All', 'Draft', 'Sent', 'Approved', 'Rejected'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading quotations..." />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Receipt size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No quotations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="table-th">Quotation #</th>
                  <th className="table-th">Company</th>
                  <th className="table-th">Event</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Created</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(q => (
                  <tr key={q.id} className="table-row">
                    <td className="table-td">
                      <code className="text-xs bg-slate-50 text-slate-400 px-2 py-1 rounded font-mono">
                        QUO-{q.id.slice(0, 8).toUpperCase()}
                      </code>
                    </td>
                    <td className="table-td">
                      <div>
                        <p className="font-semibold text-slate-900">{q.rental_requests?.companies?.company_name || '—'}</p>
                        <p className="text-xs text-slate-400">{q.rental_requests?.companies?.email}</p>
                      </div>
                    </td>
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-slate-700">{q.rental_requests?.event_name || '—'}</p>
                        <p className="text-xs text-slate-400">
                          {q.rental_requests?.start_date} → {q.rental_requests?.end_date}
                        </p>
                      </div>
                    </td>
                    <td className="table-td font-bold text-slate-900 text-base">
                      ₹{Number(q.total_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="table-td">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="table-td text-slate-400 text-xs">
                      {format(new Date(q.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/admin/requests/${q.request_id}`}
                          className="p-1.5 rounded-lg hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors"
                          title="View Request">
                          <Eye size={15} />
                        </Link>
                        {q.status === 'Sent' && (
                          <>
                            <button onClick={() => setActionModal({ type: 'approve', quotation: q })}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors"
                              title="Approve">
                              <CheckCircle size={15} />
                            </button>
                            <button onClick={() => setActionModal({ type: 'reject', quotation: q })}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                              title="Reject">
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                        <button onClick={() => exportPDF(q)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Export PDF">
                          <FileDown size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Confirm Modal */}
      <Modal isOpen={actionModal?.type === 'approve'} onClose={() => setActionModal(null)} title="Approve Quotation" size="sm">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <p className="text-slate-700 font-semibold mb-1">Approve this quotation?</p>
          <p className="text-slate-400 text-sm mb-1">
            Amount: <strong className="text-slate-700">₹{Number(actionModal?.quotation?.total_amount || 0).toLocaleString('en-IN')}</strong>
          </p>
          <p className="text-slate-400 text-sm mb-6">The request status will be updated to Approved.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setActionModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleApprove(actionModal.quotation)} disabled={saving}
              className="btn-primary bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              Approve
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Confirm Modal */}
      <Modal isOpen={actionModal?.type === 'reject'} onClose={() => setActionModal(null)} title="Reject Quotation" size="sm">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle size={24} className="text-red-600" />
          </div>
          <p className="text-slate-700 font-semibold mb-1">Reject this quotation?</p>
          <p className="text-slate-400 text-sm mb-6">The request will be marked as Rejected.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setActionModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleReject(actionModal.quotation)} disabled={saving} className="btn-danger">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
              Reject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

