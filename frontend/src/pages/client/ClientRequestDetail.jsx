import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import {
  ArrowLeft, Building2, Calendar, MapPin, Package,
  DollarSign, Clock, CheckCircle, ChevronRight, AlertCircle,
  Phone, Mail, FileText
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
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) loadAll() }, [user, id])

  async function loadAll() {
    setLoading(true)
    const [reqRes, itemsRes, histRes, quotRes] = await Promise.all([
      supabase.from('rental_requests').select('*, companies(*)')
        .eq('id', id).eq('user_id', user.id).single(),
      supabase.from('request_items').select('*, devices(name, category, daily_price)').eq('request_id', id),
      supabase.from('status_history').select('*').eq('request_id', id).order('changed_at', { ascending: true }),
      supabase.from('quotations').select('*').eq('request_id', id).maybeSingle(),
    ])

    if (!reqRes.data) { navigate('/client/requests'); return }

    setRequest(reqRes.data)
    setCompany(reqRes.data.companies)
    setItems(itemsRes.data || [])
    setHistory(histRes.data || [])
    setQuotation(quotRes.data)
    setLoading(false)
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
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
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
          <h2 className="font-bold text-slate-800 mb-5 text-sm">Request Progress</h2>
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
                      ${active ? 'text-primary-600' : done ? 'text-slate-500' : 'text-slate-300'}`}>
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
            <h2 className="font-bold text-slate-800">Company Info</h2>
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
            <h2 className="font-bold text-slate-800">Event Details</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div><p className="text-slate-400 text-xs">Event Name</p><p className="font-semibold">{request?.event_name}</p></div>
            <div><p className="text-slate-400 text-xs">Start Date</p><p className="font-medium">{format(new Date(request?.start_date + 'T00:00:00'), 'dd MMM yyyy')}</p></div>
            <div><p className="text-slate-400 text-xs">End Date</p><p className="font-medium">{format(new Date(request?.end_date + 'T00:00:00'), 'dd MMM yyyy')}</p></div>
            <div><p className="text-slate-400 text-xs">Duration</p><p className="font-bold text-primary-600">{duration} day{duration > 1 ? 's' : ''}</p></div>
            <div className="flex items-start gap-2"><MapPin size={13} className="text-slate-400 flex-shrink-0 mt-0.5" /><span>{request?.delivery_location}</span></div>
            {request?.notes && <div><p className="text-slate-400 text-xs">Notes</p><p className="italic text-slate-600">{request.notes}</p></div>}
          </div>
        </div>

        {/* Quotation */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-green-600" />
            <h2 className="font-bold text-slate-800">Quotation</h2>
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
                  <p className="text-sm text-slate-600">{quotation.quotation_notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Clock size={22} className="text-slate-400" />
              </div>
              <p className="font-medium text-slate-600">Quotation Pending</p>
              <p className="text-xs text-slate-400 mt-1">
                Our team will send a quotation within 24 hours of review.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Devices */}
      <div className="card">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
          <Package size={18} className="text-purple-600" />
          <h2 className="font-bold text-slate-800">Requested Devices</h2>
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
                  <td className="table-td"><span className="badge bg-slate-100 text-slate-600">{item.devices?.category}</span></td>
                  <td className="table-td font-bold text-primary-600">{item.quantity}</td>
                  <td className="table-td text-slate-600">₹{Number(item.devices?.daily_price || 0).toLocaleString('en-IN')}/day</td>
                  <td className="table-td font-semibold text-slate-800">
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
          <h2 className="font-bold text-slate-800">Activity History</h2>
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
            <p className="font-semibold text-slate-800">Have questions about this request?</p>
            <p className="text-sm text-slate-400 mt-0.5">Reference your Request ID: <code className="bg-white px-2 py-0.5 rounded text-xs font-mono border">{id?.slice(0, 8).toUpperCase()}</code></p>
          </div>
          <a href="mailto:hello@corprental.com?subject=Query about Request"
            className="btn-secondary btn-sm flex-shrink-0">
            <Mail size={14} /> Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
