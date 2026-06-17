import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowLeft, ArrowRight, CheckCircle, Building2, Calendar, Monitor, Loader2, LogIn } from 'lucide-react'

const STEPS = ['Company Info', 'Event Details', 'Device Requirements', 'Review & Submit']

const INITIAL = {
  company_name: '', contact_person: '', email: '', phone: '', address: '',
  event_name: '', start_date: '', end_date: '', delivery_location: '', notes: '',
  laptops: 0, desktops: 0, monitors: 0, projectors: 0, printers: 0,
}

export default function RequestForm() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function next() { if (step < STEPS.length - 1) setStep(s => s + 1) }
  function back() { if (step > 0) setStep(s => s - 1) }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      // 1. Insert company
      const { data: company, error: companyErr } = await supabase
        .from('companies')
        .insert({
          company_name: form.company_name,
          contact_person: form.contact_person,
          email: form.email,
          phone: form.phone,
          address: form.address,
        })
        .select()
        .single()

      if (companyErr) throw companyErr

      // 2. Insert rental request
      const { data: request, error: reqErr } = await supabase
        .from('rental_requests')
        .insert({
          company_id: company.id,
          event_name: form.event_name,
          start_date: form.start_date,
          end_date: form.end_date,
          delivery_location: form.delivery_location,
          notes: form.notes,
          status: 'Pending',
          user_id: user?.id || null,  // Link to client account if logged in
        })
        .select()
        .single()

      if (reqErr) throw reqErr

      // 3. Fetch device IDs
      const { data: devices } = await supabase.from('devices').select('id, category')

      const deviceMap = {}
      devices?.forEach(d => {
        if (!deviceMap[d.category]) deviceMap[d.category] = d.id
      })

      // 4. Insert request items
      const items = [
        { category: 'Laptop', quantity: Number(form.laptops) },
        { category: 'Desktop', quantity: Number(form.desktops) },
        { category: 'Monitor', quantity: Number(form.monitors) },
        { category: 'Projector', quantity: Number(form.projectors) },
        { category: 'Printer', quantity: Number(form.printers) },
      ].filter(i => i.quantity > 0 && deviceMap[i.category])

      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from('request_items').insert(
          items.map(i => ({ request_id: request.id, device_id: deviceMap[i.category], quantity: i.quantity }))
        )
        if (itemsErr) throw itemsErr
      }

      // 5. Record initial status history
      await supabase.from('status_history').insert({
        request_id: request.id,
        old_status: null,
        new_status: 'Pending',
        admin_note: 'Request submitted by client',
      })

      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="card p-12 max-w-lg w-full text-center animate-in">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Request Submitted!</h2>
          <p className="text-slate-500 mb-6 leading-relaxed">
            Thank you! Your bulk rental request has been received. Our team will review it and send you a
            customized quotation within <strong>24 hours</strong>.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-slate-500">Company: <strong className="text-slate-800">{form.company_name}</strong></p>
            <p className="text-sm text-slate-500 mt-1">Event: <strong className="text-slate-800">{form.event_name}</strong></p>
            <p className="text-sm text-slate-500 mt-1">Contact: <strong className="text-slate-800">{form.email}</strong></p>
          </div>

          {user ? (
            <div className="flex flex-col gap-3">
              <Link to="/client/requests" className="btn-primary w-full justify-center">
                <CheckCircle size={16} /> Track My Requests
              </Link>
              <Link to="/" className="btn-secondary w-full justify-center">
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 text-left mb-1">
                <p className="font-semibold mb-1">💡 Track your request online</p>
                <p>Create a free account to track your request status and view your quotation anytime.</p>
              </div>
              <Link to="/login" className="btn-primary w-full justify-center">
                <LogIn size={16} /> Create Account to Track
              </Link>
              <Link to="/" className="btn-secondary w-full justify-center">
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            {!user && (
              <Link to="/login" className="text-sm text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1.5">
                <LogIn size={14} /> Sign In
              </Link>
            )}
            {user && (
              <Link to="/client/dashboard" className="text-sm text-primary-600 font-semibold hover:text-primary-700">
                My Dashboard
              </Link>
            )}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                <Building2 size={14} className="text-white" />
              </div>
              <span className="font-bold text-slate-900 text-sm hidden sm:inline">Bulk Rental Request</span>
            </div>
          </div>
        </div>

      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all
                  ${i < step ? 'bg-primary-600 border-primary-600 text-white'
                    : i === step ? 'bg-white border-primary-600 text-primary-600'
                    : 'bg-white border-slate-200 text-slate-400'}`}>
                  {i < step ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary-600' : 'text-slate-400'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="absolute" />
                )}
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${((step) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <p className="text-right text-xs text-slate-400 mt-1">Step {step + 1} of {STEPS.length}</p>
        </div>

        <div className="card p-8 animate-in">
          {/* Step 0: Company Info */}
          {step === 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Building2 size={20} className="text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Company Information</h2>
                  <p className="text-slate-400 text-sm">Tell us about your organization</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="label">Company Name *</label>
                  <input className="input" placeholder="Acme Corporation" value={form.company_name}
                    onChange={e => update('company_name', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Contact Person *</label>
                  <input className="input" placeholder="John Smith" value={form.contact_person}
                    onChange={e => update('contact_person', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input className="input" type="email" placeholder="john@acme.com" value={form.email}
                    onChange={e => update('email', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <input className="input" placeholder="+91 98765 43210" value={form.phone}
                    onChange={e => update('phone', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Company Address *</label>
                  <input className="input" placeholder="123 Business Park, Mumbai" value={form.address}
                    onChange={e => update('address', e.target.value)} required />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Event Details */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Calendar size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Event Information</h2>
                  <p className="text-slate-400 text-sm">Details about your upcoming event or training</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="label">Event Name *</label>
                  <input className="input" placeholder="Annual Training Program 2025" value={form.event_name}
                    onChange={e => update('event_name', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Start Date *</label>
                  <input className="input" type="date" value={form.start_date}
                    onChange={e => update('start_date', e.target.value)} required
                    min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input className="input" type="date" value={form.end_date}
                    onChange={e => update('end_date', e.target.value)} required
                    min={form.start_date || new Date().toISOString().split('T')[0]} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Delivery Location *</label>
                  <input className="input" placeholder="5th Floor, Techno Park, Whitefield, Bengaluru - 560066"
                    value={form.delivery_location} onChange={e => update('delivery_location', e.target.value)} required />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Additional Notes</label>
                  <textarea className="input resize-none h-28" placeholder="Any special requirements, setup instructions, or notes for our team..."
                    value={form.notes} onChange={e => update('notes', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Device Requirements */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Monitor size={20} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Device Requirements</h2>
                  <p className="text-slate-400 text-sm">Specify quantities for each device type</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'laptops', label: 'Laptops', desc: 'High-performance notebooks', icon: '💻' },
                  { key: 'desktops', label: 'Desktop Computers', desc: 'All-in-one workstations', icon: '🖥️' },
                  { key: 'monitors', label: 'Monitors', desc: '24" to 32" displays', icon: '🖥' },
                  { key: 'projectors', label: 'Projectors', desc: 'Full HD projection systems', icon: '📽️' },
                  { key: 'printers', label: 'Printers', desc: 'Laser & inkjet printers', icon: '🖨️' },
                ].map(({ key, label, desc, icon }) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-primary-200 hover:bg-primary-50/30 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{label}</p>
                        <p className="text-slate-400 text-xs">{desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => update(key, Math.max(0, Number(form[key]) - 1))}
                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center font-bold text-slate-600 transition-colors">
                        −
                      </button>
                      <input
                        type="number" min="0"
                        value={form[key]}
                        onChange={e => update(key, Math.max(0, Number(e.target.value)))}
                        className="w-16 text-center border border-slate-200 rounded-lg py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button onClick={() => update(key, Number(form[key]) + 1)}
                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-primary-50 flex items-center justify-center font-bold text-primary-600 transition-colors">
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {(Number(form.laptops) + Number(form.desktops) + Number(form.monitors) + Number(form.projectors) + Number(form.printers)) === 0 && (
                <p className="text-amber-600 text-sm mt-4 flex items-center gap-2">
                  <span>⚠️</span> Please add at least one device to your request.
                </p>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Review & Submit</h2>
                  <p className="text-slate-400 text-sm">Verify your details before submitting</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Company */}
                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="font-bold text-slate-700 text-sm mb-3 uppercase tracking-wider">Company</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-400">Company:</span> <span className="font-medium text-slate-800">{form.company_name}</span></div>
                    <div><span className="text-slate-400">Contact:</span> <span className="font-medium text-slate-800">{form.contact_person}</span></div>
                    <div><span className="text-slate-400">Email:</span> <span className="font-medium text-slate-800">{form.email}</span></div>
                    <div><span className="text-slate-400">Phone:</span> <span className="font-medium text-slate-800">{form.phone}</span></div>
                    <div className="col-span-2"><span className="text-slate-400">Address:</span> <span className="font-medium text-slate-800">{form.address}</span></div>
                  </div>
                </div>

                {/* Event */}
                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="font-bold text-slate-700 text-sm mb-3 uppercase tracking-wider">Event</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2"><span className="text-slate-400">Event:</span> <span className="font-medium text-slate-800">{form.event_name}</span></div>
                    <div><span className="text-slate-400">Start:</span> <span className="font-medium text-slate-800">{form.start_date}</span></div>
                    <div><span className="text-slate-400">End:</span> <span className="font-medium text-slate-800">{form.end_date}</span></div>
                    <div className="col-span-2"><span className="text-slate-400">Location:</span> <span className="font-medium text-slate-800">{form.delivery_location}</span></div>
                    {form.notes && <div className="col-span-2"><span className="text-slate-400">Notes:</span> <span className="font-medium text-slate-800">{form.notes}</span></div>}
                  </div>
                </div>

                {/* Devices */}
                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="font-bold text-slate-700 text-sm mb-3 uppercase tracking-wider">Devices</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {[
                      { label: '💻 Laptops', val: form.laptops },
                      { label: '🖥️ Desktops', val: form.desktops },
                      { label: '🖥 Monitors', val: form.monitors },
                      { label: '📽️ Projectors', val: form.projectors },
                      { label: '🖨️ Printers', val: form.printers },
                    ].map(({ label, val }) => (
                      Number(val) > 0 && (
                        <div key={label} className="flex items-center gap-2">
                          <span className="text-slate-500">{label}:</span>
                          <span className="font-bold text-primary-600">{val}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    ❌ {error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <button onClick={back} disabled={step === 0}
              className="btn-secondary disabled:opacity-40">
              <ArrowLeft size={16} /> Previous
            </button>

            {step < STEPS.length - 1 ? (
              <button onClick={next}
                disabled={
                  (step === 0 && (!form.company_name || !form.contact_person || !form.email || !form.phone || !form.address)) ||
                  (step === 1 && (!form.event_name || !form.start_date || !form.end_date || !form.delivery_location)) ||
                  (step === 2 && (Number(form.laptops) + Number(form.desktops) + Number(form.monitors) + Number(form.projectors) + Number(form.printers)) === 0)
                }
                className="btn-primary disabled:opacity-40">
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary px-8">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <>Submit Request <CheckCircle size={16} /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
