import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { FileText, DollarSign, Search, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default function Billing() {
  const [invoices, setInvoices] = useState([])
  const [requests, setRequests] = useState([]) // Requests that can be invoiced
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [invRes, reqRes] = await Promise.all([
      supabase.from('invoices').select('*, rental_requests(event_name, companies(company_name))').order('created_at', { ascending: false }),
      supabase.from('rental_requests')
        .select('*, companies(*), quotations(*)')
        .in('status', ['Allocated', 'Dispatched', 'Delivered', 'Completed'])
    ])
    setInvoices(invRes.data || [])
    setRequests(reqRes.data || [])
    setLoading(false)
  }

  async function generateInvoice(req) {
    const amount = req.quotations?.[0]?.total_amount || 0
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    
    // Due date is 30 days from now
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    try {
      const { error } = await supabase.from('invoices').insert({
        request_id: req.id,
        invoice_number: invoiceNumber,
        total_amount: amount,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'Unpaid'
      })
      if (error) throw error
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  async function markAsPaid(invoiceId) {
    try {
      const { error } = await supabase.from('invoices').update({ status: 'Paid' }).eq('id', invoiceId)
      if (error) throw error
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <LoadingSpinner text="Loading invoices..." />

  // Find requests that don't have an invoice yet
  const uninvoiced = requests.filter(r => !invoices.find(i => i.request_id === r.id))
  
  const filteredInvoices = invoices.filter(i => 
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    i.rental_requests?.companies?.company_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Billing & Invoices</h1>
          <p className="text-slate-500 text-sm mt-1">Manage B2B invoices and track payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Generate New Invoices */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5 bg-primary-50/50 border-primary-100">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-primary-600" />
              Ready to Invoice ({uninvoiced.length})
            </h2>
            <div className="space-y-3">
              {uninvoiced.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-4">All active rentals are invoiced.</p>
              ) : (
                uninvoiced.map(req => (
                  <div key={req.id} className="p-3 border border-slate-200 rounded-lg bg-white">
                    <p className="font-semibold text-slate-900 text-sm">{req.companies?.company_name}</p>
                    <p className="text-xs text-slate-500 mb-2">{req.event_name}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-slate-700">₹{req.quotations?.[0]?.total_amount?.toLocaleString() || 0}</span>
                      <button onClick={() => generateInvoice(req)} className="btn-primary py-1 px-3 text-xs">
                        Generate Invoice
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Invoices List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-slate-600" />
                All Invoices
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search invoices..." 
                  className="input pl-9 text-sm py-2"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="table-th py-2">Invoice #</th>
                    <th className="table-th py-2">Company</th>
                    <th className="table-th py-2">Amount</th>
                    <th className="table-th py-2">Due Date</th>
                    <th className="table-th py-2">Status</th>
                    <th className="table-th py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-500 text-sm">No invoices found</td></tr>
                  ) : (
                    filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="table-td py-3 font-mono text-sm">{inv.invoice_number}</td>
                        <td className="table-td py-3 font-medium text-slate-900">{inv.rental_requests?.companies?.company_name}</td>
                        <td className="table-td py-3 font-semibold text-slate-700">₹{inv.total_amount.toLocaleString()}</td>
                        <td className="table-td py-3 text-slate-600">{format(new Date(inv.due_date), 'dd MMM yyyy')}</td>
                        <td className="table-td py-3">
                          <span className={`badge ${
                            inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                            inv.status === 'Unpaid' ? 'bg-amber-100 text-amber-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="table-td py-3 text-right">
                          {inv.status === 'Unpaid' && (
                            <button onClick={() => markAsPaid(inv.id)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded font-medium hover:bg-green-100 flex items-center gap-1 ml-auto">
                              <CheckCircle size={12} /> Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
