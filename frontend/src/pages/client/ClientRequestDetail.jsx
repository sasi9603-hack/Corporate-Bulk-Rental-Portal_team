import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import {
  ArrowLeft, Building2, Calendar, MapPin, Package,
  DollarSign, Clock, CheckCircle, ChevronRight, AlertCircle,
  Phone, Mail, FileText, FileSignature, Loader2
} from 'lucide-react'
import { format } from 'date-fns'

const STATUS_FLOW = ['Pending', 'Under Review', 'Quoted', 'Approved', 'Allocated', 'Delivered', 'Completed']

export default function ClientRequestDetail() {
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

  const [signModal, setSignModal] = useState(false)
  const [signatureName, setSignatureName] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (user) loadAll() }, [user, id])

  async function loadAll() {
    setLoading(true)
    const [reqRes, itemsRes, histRes, quotRes] = await Promise.all([
      supabase.from('rental_requests').select('*, companies(*)')
        .eq('id', id).eq('user_id', user.id).single(),
      supabase.from('request_items').select('*, devices(name, category, daily_price)').eq('request_id', id),
      supabase.from('status_history').select('*').eq('request_id', id).order('changed_at', { ascending: true }),
      supabase.from('quotations').select('*').eq('request_id', id).maybeSingle(),
      supabase.from('rental_agreements').select('*').eq('request_id', id).maybeSingle(),
    ])

    if (!reqRes.data) { navigate('/client/requests'); return }

    setRequest(reqRes.data)
    setCompany(reqRes.data.companies)
    setItems(itemsRes.data || [])
    setHistory(histRes.data || [])
    setQuotation(quotRes.data)
    setAgreement(agreeRes.data)
    setLoading(false)
  }

  async function handleSignAgreement() {
    if (!signatureName || !agreedTerms) return
    setSaving(true)
    try {
      // 1. Update the agreement
      const { error: agreeErr } = await supabase.from('rental_agreements').update({
        signed_by_name: signatureName,
        signed_by_email: user.email,
        signed_at: new Date().toISOString(),
        status: 'Signed'
      }).eq('id', agreement.id)
      if (agreeErr) throw agreeErr

      // Note: In a real app, an edge function or DB trigger would auto-update the request status.
      // For now, we will just update the agreement. The admin can verify and update the request status.

      setSignModal(false)
      await loadAll()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading request details..." />

  const duration = request
    ? Math.max(1, Math.ceil((new Date(request.end_date) - new Date(request.start_date)) / (1000 * 60 * 60 * 24)) + 1)
    : 1

  const currentStep = STATUS_FLOW.indexOf(request?.status)

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="page-header flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/client/requests')}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="section-title">{request?.event_name}</h1>
            <p className="text-slate-400 text-xs mt-0.5">Submitted {format(new Date(request?.created_at), 'dd MMM yyyy, hh:mm a')}</p>
          </div>
        </div>
        <StatusBadge status={request?.status} />
      </div>

      {/* Status Progress Bar */}
      {request?.status !== 'Rejected' && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-5 text-sm">Request Progress</h2>
          <div className="relative">
            {/* Track */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 z-0">
              <div
                className="h-full bg-primary-500 transition-all duration-700"
                style={{ width: currentStep >= 0 ? `${(currentStep / (STATUS_FLOW.length - 1)) * 100}%` : '0%' }}
              />
            </div>
            {/* Steps */}
            <div className="relative flex justify-between z-10">
              {STATUS_FLOW.map((status, i) => {
                const done = i < currentStep
                const active = i === currentStep
                return (
                  <div key={status} className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                      ${done ? 'bg-primary-600 border-primary-600'
                        : active ? 'bg-white border-primary-600'
                        : 'bg-white border-slate-200'}`}>
                      {done
                        ? <CheckCircle size={16} className="text-white" />
                        : active
                        ? <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                        : <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />}
                    </div>
                    <span className={`text-xs font-medium text-center leading-tight max-w-[60px] hidden sm:block
                      ${active ? 'text-primary-600' : done ? 'text-slate-500' : 'text-slate-700'}`}>
                      {status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {request?.status === 'Rejected' && (
        <div className="card p-5 bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">This request was rejected</p>
              <p className="text-sm text-red-600 mt-0.5">
                Please contact our team at hello@corprental.com for more information.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-primary-600" />
            <h2 className="font-bold text-slate-900">Company Info</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div><p className="text-slate-400 text-xs">Company</p><p className="font-semibold text-slate-900">{company?.company_name}</p></div>
            <div><p className="text-slate-400 text-xs">Contact</p><p className="font-medium">{company?.contact_person}</p></div>
            <div className="flex items-center gap-2"><Mail size={13} className="text-slate-400" /><span>{company?.email}</span></div>
            <div className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /><span>{company?.phone}</span></div>
            <div className="flex items-start gap-2"><MapPin size={13} className="text-slate-400 flex-shrink-0 mt-0.5" /><span>{company?.address}</span></div>
          </div>
        </div>

        {/* Event */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-900">Event Details</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div><p className="text-slate-400 text-xs">Event Name</p><p className="font-semibold">{request?.event_name}</p></div>
            <div><p className="text-slate-400 text-xs">Start Date</p><p className="font-medium">{format(new Date(request?.start_date + 'T00:00:00'), 'dd MMM yyyy')}</p></div>
            <div><p className="text-slate-400 text-xs">End Date</p><p className="font-medium">{format(new Date(request?.end_date + 'T00:00:00'), 'dd MMM yyyy')}</p></div>
            <div><p className="text-slate-400 text-xs">Duration</p><p className="font-bold text-primary-600">{duration} day{duration > 1 ? 's' : ''}</p></div>
            <div className="flex items-start gap-2"><MapPin size={13} className="text-slate-400 flex-shrink-0 mt-0.5" /><span>{request?.delivery_location}</span></div>
            {request?.notes && <div><p className="text-slate-400 text-xs">Notes</p><p className="italic text-slate-400">{request.notes}</p></div>}
          </div>
        </div>

        {/* Quotation */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-green-600" />
            <h2 className="font-bold text-slate-900">Quotation</h2>
          </div>
          {quotation ? (
            <div className="space-y-3">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-xs text-green-600 mb-1">Total Amount</p>
                <p className="text-3xl font-extrabold text-green-700">
                  ₹{Number(quotation.total_amount).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-green-500 mt-1">for {duration} day{duration > 1 ? 's' : ''}</p>
              </div>
              <div><p className="text-slate-400 text-xs">Quotation Status</p><StatusBadge status={quotation.status} /></div>
              <div><p className="text-slate-400 text-xs">Issued On</p><p className="text-sm font-medium">{format(new Date(quotation.created_at), 'dd MMM yyyy')}</p></div>
              {quotation.quotation_notes && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Terms & Notes</p>
                  <p className="text-sm text-slate-400">{quotation.quotation_notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <Clock size={22} className="text-slate-400" />
              </div>
              <p className="font-medium text-slate-400">Quotation Pending</p>
              <p className="text-xs text-slate-400 mt-1">
                Our team will send a quotation within 24 hours of review.
              </p>
            </div>
          )}
        </div>

        {/* Agreement */}
        {agreement && agreement.status !== 'Draft' && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileSignature size={18} className="text-primary-600" />
              <h2 className="font-bold text-slate-900">Rental Agreement</h2>
            </div>
            <div className="space-y-3">
              <div><p className="text-slate-400 text-xs">Agreement Status</p><StatusBadge status={agreement.status} /></div>
              
              {agreement.status === 'Sent' ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-primary-500/20 text-center mt-2">
                  <p className="text-sm text-slate-700 mb-3">Your rental agreement is ready for signature.</p>
                  <button onClick={() => setSignModal(true)} className="btn-primary w-full justify-center">
                    Review & Sign
                  </button>
                </div>
              ) : (
                <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <CheckCircle size={16} />
                    <span className="font-medium text-sm">Digitally Signed</span>
                  </div>
                  <div><p className="text-slate-400 text-xs">Signed By</p><p className="text-sm font-semibold text-slate-900">{agreement.signed_by_name}</p></div>
                  <div><p className="text-slate-400 text-xs">Date</p><p className="text-sm text-slate-700">{format(new Date(agreement.signed_at), 'dd MMM yyyy, hh:mm a')}</p></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Devices */}
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
                <th className="table-th">Quantity</th>
                <th className="table-th">Daily Rate</th>
                <th className="table-th">Subtotal ({duration}d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id} className="table-row">
                  <td className="table-td font-medium text-slate-900">{item.devices?.name || '—'}</td>
                  <td className="table-td"><span className="badge bg-slate-50 text-slate-400">{item.devices?.category}</span></td>
                  <td className="table-td font-bold text-primary-600">{item.quantity}</td>
                  <td className="table-td text-slate-400">₹{Number(item.devices?.daily_price || 0).toLocaleString('en-IN')}/day</td>
                  <td className="table-td font-semibold text-slate-900">
                    ₹{(item.quantity * (item.devices?.daily_price || 0) * duration).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status History */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={18} className="text-amber-600" />
          <h2 className="font-bold text-slate-900">Activity History</h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
          <div className="space-y-4">
            {history.map((h, i) => (
              <div key={h.id} className="flex items-start gap-4">
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
                  {h.admin_note && (
                    <p className="text-sm text-slate-500 mt-1 italic">"{h.admin_note}"</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {format(new Date(h.changed_at), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="card p-6 bg-slate-50 border-dashed">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900">Have questions about this request?</p>
            <p className="text-sm text-slate-400 mt-0.5">Reference your Request ID: <code className="bg-white px-2 py-0.5 rounded text-xs font-mono border">{id?.slice(0, 8).toUpperCase()}</code></p>
          </div>
          <a href="mailto:hello@corprental.com?subject=Query about Request"
            className="btn-secondary btn-sm flex-shrink-0">
            <Mail size={14} /> Contact Support
          </a>
        </div>
      </div>

      {/* Signature Modal */}
      <Modal isOpen={signModal} onClose={() => setSignModal(false)} title="Sign Rental Agreement">
        <div className="space-y-4">
          <div className="h-48 overflow-y-auto bg-slate-50 border border-slate-200 p-4 rounded-lg text-sm text-slate-400 space-y-3">
            <h3 className="font-bold text-slate-900 mb-2">Terms and Conditions</h3>
            <p>1. <strong>Equipment Condition:</strong> The equipment must be returned in the same condition as it was delivered, normal wear and tear excepted.</p>
            <p>2. <strong>Payment:</strong> The client agrees to pay the total quotation amount within 30 days of the invoice date.</p>
            <p>3. <strong>Liability:</strong> The client is fully responsible for any loss, theft, or damage to the equipment during the rental period.</p>
            <p>4. <strong>Late Returns:</strong> Late returns will be subject to a daily penalty equal to 1.5x the standard daily rate.</p>
            <p>5. <strong>Termination:</strong> CorpRentalPro reserves the right to terminate this agreement immediately if the client breaches any terms.</p>
          </div>
          
          <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-white transition-colors">
            <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-50 text-primary-600 focus:ring-primary-500 focus:ring-offset-slate-800"
              checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} />
            <span className="text-sm text-slate-700">
              I have read and agree to the Terms and Conditions above. I understand this constitutes a legally binding digital signature.
            </span>
          </label>

          <div>
            <label className="label">Type your full legal name to sign</label>
            <input className="input" type="text" placeholder="John Doe"
              value={signatureName} onChange={e => setSignatureName(e.target.value)} />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button onClick={() => setSignModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSignAgreement} disabled={saving || !agreedTerms || !signatureName} className="btn-primary">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Signing...</> : 'Sign Agreement'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

