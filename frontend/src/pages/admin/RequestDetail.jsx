import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import {
  ArrowLeft, Building2, Calendar, MapPin, Package,
  FileText, Clock, DollarSign, CheckCircle, Loader2,
  AlertCircle, Edit, ChevronRight, FileSignature
} from 'lucide-react'
import { format } from 'date-fns'

const STATUS_FLOW = ['Pending', 'Under Review', 'Quoted', 'Approved', 'Allocated', 'Delivered', 'Completed']

export default function RequestDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [request, setRequest] = useState(null)
  const [company, setCompany] = useState(null)
  const [items, setItems] = useState([])
  const [history, setHistory] = useState([])
  const [quotation, setQuotation] = useState(null)
  const [agreement, setAgreement] = useState(null)
  const [loading, setLoading] = useState(true)

  const [statusModal, setStatusModal] = useState(false)
  const [quotModal, setQuotModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [quotAmount, setQuotAmount] = useState('')
  const [quotNotes, setQuotNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { loadAll() }, [id])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadAll() {
    setLoading(true)
    const [reqRes, itemsRes, histRes, quotRes] = await Promise.all([
      supabase.from('rental_requests').select('*, companies(*)').eq('id', id).single(),
      supabase.from('request_items').select('*, devices(name, category, daily_price)').eq('request_id', id),
      supabase.from('status_history').select('*').eq('request_id', id).order('changed_at', { ascending: true }),
      supabase.from('quotations').select('*').eq('request_id', id).maybeSingle(),
      supabase.from('rental_agreements').select('*').eq('request_id', id).maybeSingle(),
    ])

    if (reqRes.data) {
      setRequest(reqRes.data)
      setCompany(reqRes.data.companies)
      setNewStatus(reqRes.data.status)
    }
    setItems(itemsRes.data || [])
    setHistory(histRes.data || [])
    setQuotation(quotRes.data)
    setAgreement(agreeRes.data)
    setLoading(false)
  }

  async function handleStatusUpdate() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('rental_requests')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error

      await supabase.from('status_history').insert({
        request_id: id,
        old_status: request.status,
        new_status: newStatus,
        changed_by: user?.id,
        admin_note: adminNote,
      })

      setStatusModal(false)
      setAdminNote('')
      showToast('Status updated successfully')
      await loadAll()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateQuotation() {
    if (!quotAmount) return
    setSaving(true)
    try {
      // Calculate total: duration * daily prices * quantities
      const amount = Number(quotAmount)

      if (quotation) {
        const { error } = await supabase.from('quotations').update({
          total_amount: amount,
          quotation_notes: quotNotes,
          status: 'Sent',
        }).eq('id', quotation.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('quotations').insert({
          request_id: id,
          total_amount: amount,
          quotation_notes: quotNotes,
          status: 'Sent',
        })
        if (error) throw error
      }

      // Auto-update request status to Quoted
      if (request.status === 'Pending' || request.status === 'Under Review') {
        await supabase.from('rental_requests').update({ status: 'Quoted' }).eq('id', id)
        await supabase.from('status_history').insert({
          request_id: id,
          old_status: request.status,
          new_status: 'Quoted',
          changed_by: user?.id,
          admin_note: 'Quotation generated',
        })
      }

      setQuotModal(false)
      showToast('Quotation saved successfully')
      await loadAll()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendAgreement() {
    if (!window.confirm('Send rental agreement to client for signature?')) return
    try {
      const { error } = await supabase.from('rental_agreements').insert({
        request_id: id,
        status: 'Sent'
      })
      if (error) throw error
      showToast('Agreement sent to client')
      await loadAll()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Auto-calculate suggested amount
  function calcSuggested() {
    if (!request) return 0
    const start = new Date(request.start_date)
    const end = new Date(request.end_date)
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1)
    return items.reduce((sum, item) => sum + (item.quantity * (item.devices?.daily_price || 0) * days), 0)
  }

  if (loading) return <LoadingSpinner text="Loading request details..." />
  if (!request) return (
    <div className="text-center py-20 text-slate-400">
      <AlertCircle size={40} className="mx-auto mb-3 opacity-30" />
      <p>Request not found</p>
    </div>
  )

  const suggested = calcSuggested()
  const duration = Math.max(1, Math.ceil((new Date(request.end_date) - new Date(request.start_date)) / (1000 * 60 * 60 * 24)) + 1)

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
      <div className="page-header flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/requests')}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="section-title">Request Details</h1>
            <p className="text-slate-400 text-xs mt-0.5 font-mono">{id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={request.status} />
          <button onClick={() => { setNewStatus(request.status); setStatusModal(true) }}
            className="btn-secondary btn-sm">
            <Edit size={14} /> Update Status
          </button>
          <button onClick={() => { setQuotAmount(String(suggested)); setQuotNotes(quotation?.quotation_notes || ''); setQuotModal(true) }}
            className="btn-primary btn-sm">
            <DollarSign size={14} /> {quotation ? 'Edit Quotation' : 'Generate Quotation'}
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-primary-600" />
            <h2 className="font-bold text-slate-900">Company</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div><p className="text-slate-400 text-xs">Company Name</p><p className="font-semibold text-slate-900">{company?.company_name}</p></div>
            <div><p className="text-slate-400 text-xs">Contact Person</p><p className="font-medium text-slate-700">{company?.contact_person}</p></div>
            <div><p className="text-slate-400 text-xs">Email</p><p className="font-medium text-slate-700">{company?.email}</p></div>
            <div><p className="text-slate-400 text-xs">Phone</p><p className="font-medium text-slate-700">{company?.phone}</p></div>
            <div><p className="text-slate-400 text-xs">Address</p><p className="font-medium text-slate-700">{company?.address}</p></div>
          </div>
        </div>

        {/* Event Info */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-900">Event</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div><p className="text-slate-400 text-xs">Event Name</p><p className="font-semibold text-slate-900">{request.event_name}</p></div>
            <div><p className="text-slate-400 text-xs">Start Date</p><p className="font-medium text-slate-700">{format(new Date(request.start_date + 'T00:00:00'), 'dd MMM yyyy')}</p></div>
            <div><p className="text-slate-400 text-xs">End Date</p><p className="font-medium text-slate-700">{format(new Date(request.end_date + 'T00:00:00'), 'dd MMM yyyy')}</p></div>
            <div><p className="text-slate-400 text-xs">Duration</p><p className="font-semibold text-primary-600">{duration} day{duration > 1 ? 's' : ''}</p></div>
            <div><p className="text-slate-400 text-xs">Delivery Location</p><p className="font-medium text-slate-700">{request.delivery_location}</p></div>
            {request.notes && <div><p className="text-slate-400 text-xs">Notes</p><p className="font-medium text-slate-700">{request.notes}</p></div>}
          </div>
        </div>

        {/* Quotation */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-green-600" />
            <h2 className="font-bold text-slate-900">Quotation</h2>
          </div>
          {quotation ? (
            <div className="space-y-3 text-sm">
              <div><p className="text-slate-400 text-xs">Total Amount</p>
                <p className="text-2xl font-extrabold text-slate-900">₹{Number(quotation.total_amount).toLocaleString('en-IN')}</p>
              </div>
              <div><p className="text-slate-400 text-xs">Status</p><StatusBadge status={quotation.status} /></div>
              <div><p className="text-slate-400 text-xs">Created</p><p className="font-medium text-slate-700">{format(new Date(quotation.created_at), 'dd MMM yyyy')}</p></div>
              {quotation.quotation_notes && <div><p className="text-slate-400 text-xs">Notes</p><p className="font-medium text-slate-700">{quotation.quotation_notes}</p></div>}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <DollarSign size={32} className="text-slate-900 mb-3" />
              <p className="text-slate-400 text-sm">No quotation generated yet</p>
              <button onClick={() => { setQuotAmount(String(suggested)); setQuotModal(true) }}
                className="btn-primary btn-sm mt-4">
                Generate Now
              </button>
            </div>
          )}
        </div>

        {/* Agreement */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileSignature size={18} className="text-primary-600" />
            <h2 className="font-bold text-slate-900">Agreement</h2>
          </div>
          {agreement ? (
            <div className="space-y-3 text-sm">
              <div><p className="text-slate-400 text-xs">Status</p><StatusBadge status={agreement.status} /></div>
              {agreement.status === 'Signed' ? (
                <>
                  <div><p className="text-slate-400 text-xs">Signed By</p><p className="font-semibold text-slate-900">{agreement.signed_by_name}</p></div>
                  <div><p className="text-slate-400 text-xs">Signer Email</p><p className="font-medium text-slate-700">{agreement.signed_by_email}</p></div>
                  <div><p className="text-slate-400 text-xs">Signed At</p><p className="font-medium text-slate-700">{format(new Date(agreement.signed_at), 'dd MMM yyyy, hh:mm a')}</p></div>
                </>
              ) : (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                  <p className="text-sm text-slate-400">Waiting for client signature.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <FileSignature size={32} className="text-slate-900 mb-3" />
              <p className="text-slate-400 text-sm">No agreement sent yet</p>
              <button onClick={handleSendAgreement} disabled={!quotation || quotation.status !== 'Sent'}
                className="btn-primary btn-sm mt-4 disabled:opacity-50" title={!quotation ? 'Generate Quotation first' : ''}>
                Send Agreement to Client
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Devices Requested */}
      <div className="card">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
          <Package size={18} className="text-purple-600" />
          <h2 className="font-bold text-slate-900">Requested Devices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="table-th">Device</th>
                <th className="table-th">Category</th>
                <th className="table-th">Qty</th>
                <th className="table-th">Daily Price</th>
                <th className="table-th">Subtotal ({duration}d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr><td colSpan={5} className="table-td text-center text-slate-400 py-8">No items</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="table-row">
                  <td className="table-td font-medium text-slate-900">{item.devices?.name || '—'}</td>
                  <td className="table-td"><span className="badge bg-slate-50 text-slate-400">{item.devices?.category}</span></td>
                  <td className="table-td font-bold text-primary-600">{item.quantity}</td>
                  <td className="table-td">₹{Number(item.devices?.daily_price || 0).toLocaleString('en-IN')}/day</td>
                  <td className="table-td font-semibold text-slate-900">
                    ₹{(item.quantity * (item.devices?.daily_price || 0) * duration).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {items.length > 0 && (
                <tr className="bg-slate-50">
                  <td colSpan={4} className="table-td font-bold text-right text-slate-700">Suggested Total</td>
                  <td className="table-td font-extrabold text-green-700 text-base">₹{suggested.toLocaleString('en-IN')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={18} className="text-amber-600" />
          <h2 className="font-bold text-slate-900">Status Timeline</h2>
        </div>
        <div className="relative">
          {/* Track */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
          <div className="space-y-5">
            {history.map((h, i) => (
              <div key={h.id} className="flex items-start gap-4 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 relative
                  ${i === history.length - 1 ? 'bg-primary-600' : 'bg-white border-2 border-slate-300'}`}>
                  {i === history.length - 1
                    ? <CheckCircle size={16} className="text-white" />
                    : <span className="w-2 h-2 rounded-full bg-slate-400" />}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {h.old_status && <><StatusBadge status={h.old_status} /><ChevronRight size={12} className="text-slate-400" /></>}
                    <StatusBadge status={h.new_status} />
                  </div>
                  {h.admin_note && <p className="text-sm text-slate-400 mt-1 italic">"{h.admin_note}"</p>}
                  <p className="text-xs text-slate-400 mt-1">{format(new Date(h.changed_at), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Update Request Status">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500 mb-4">Current status: <StatusBadge status={request.status} /></p>
            <label className="label">New Status</label>
            <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {[...STATUS_FLOW, 'Rejected'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Admin Note (optional)</label>
            <textarea className="input resize-none h-24" placeholder="Add a note about this status change..."
              value={adminNote} onChange={e => setAdminNote(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setStatusModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleStatusUpdate} disabled={saving || newStatus === request.status} className="btn-primary">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Quotation Modal */}
      <Modal isOpen={quotModal} onClose={() => setQuotModal(false)} title="Generate Quotation">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">Suggested Amount</p>
            <p className="text-2xl font-extrabold text-blue-800">₹{suggested.toLocaleString('en-IN')}</p>
            <p className="text-xs mt-1">Based on {duration} days × device quantities × daily prices</p>
          </div>
          <div>
            <label className="label">Final Quotation Amount (₹) *</label>
            <input className="input" type="number" min="0" value={quotAmount}
              onChange={e => setQuotAmount(e.target.value)} placeholder="Enter final amount" />
          </div>
          <div>
            <label className="label">Quotation Notes</label>
            <textarea className="input resize-none h-24"
              placeholder="Terms, delivery charges, taxes, special conditions..."
              value={quotNotes} onChange={e => setQuotNotes(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setQuotModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleGenerateQuotation} disabled={saving || !quotAmount} className="btn-primary">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save Quotation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

