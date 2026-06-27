import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import { FileText, Download, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function ClientBilling() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  // Invoice Print Modal State
  const [printModal, setPrintModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [company, setCompany] = useState(null)
  const [items, setItems] = useState([])
  const [downloading, setDownloading] = useState(false)
  const invoiceRef = useRef(null)

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    setLoading(true)
    // We only fetch invoices that belong to requests made by this user (enforced by RLS)
    const { data, error } = await supabase.from('invoices')
      .select('*, rental_requests(*, companies(*), quotations(*))')
      .order('created_at', { ascending: false })
    
    if (data) setInvoices(data)
    setLoading(false)
  }

  async function handleOpenInvoice(inv) {
    setSelectedInvoice(inv)
    setCompany(inv.rental_requests?.companies)
    
    // Fetch items for the invoice details
    const { data } = await supabase.from('request_items')
      .select('*, devices(*)')
      .eq('request_id', inv.request_id)
      
    setItems(data || [])
    setPrintModal(true)
  }

  async function downloadPDF() {
    if (!invoiceRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Invoice_${selectedInvoice.invoice_number}.pdf`)
    } catch (err) {
      console.error(err)
      alert("Failed to generate PDF")
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading your billing data..." />

  return (
    <div className="space-y-6 animate-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Billing & Invoices</h1>
          <p className="text-slate-500 text-sm mt-1">View and download your official corporate rental invoices</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText size={18} className="text-primary-600" />
          Invoice History
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="table-th py-2">Invoice #</th>
                <th className="table-th py-2">Event / Description</th>
                <th className="table-th py-2">Amount</th>
                <th className="table-th py-2">Due Date</th>
                <th className="table-th py-2">Status</th>
                <th className="table-th py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500 text-sm">No invoices found</td></tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="table-td py-3 font-mono text-sm">{inv.invoice_number}</td>
                    <td className="table-td py-3 font-medium text-slate-900">{inv.rental_requests?.event_name}</td>
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
                      <button onClick={() => handleOpenInvoice(inv)} className="btn-secondary py-1 px-3 text-xs">
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal for PDF rendering */}
      <Modal isOpen={printModal} onClose={() => setPrintModal(false)} title={`Invoice ${selectedInvoice?.invoice_number}`}>
        <div className="space-y-4">
          
          {/* Printable Area */}
          <div ref={invoiceRef} className="p-8 bg-white border border-slate-200 shadow-sm rounded-lg" style={{ width: '100%', minHeight: '400px' }}>
            <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-primary-600 mb-1">Corporate Rental Pro</h2>
                <p className="text-slate-500 text-sm">123 Tech Park, Bangalore, India</p>
                <p className="text-slate-500 text-sm">GSTIN: 29ABCDE1234F1Z5</p>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-extrabold text-slate-200 mb-2 uppercase tracking-widest text-slate-200">INVOICE</h1>
                <p className="text-slate-900 font-mono text-sm font-semibold">{selectedInvoice?.invoice_number}</p>
                <p className="text-slate-500 text-sm mt-1">Date: {selectedInvoice ? format(new Date(selectedInvoice.created_at), 'dd MMM yyyy') : ''}</p>
                <p className="text-slate-500 text-sm">Due: {selectedInvoice ? format(new Date(selectedInvoice.due_date), 'dd MMM yyyy') : ''}</p>
              </div>
            </div>

            <div className="flex justify-between mb-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To:</p>
                <p className="font-semibold text-slate-900 text-lg">{company?.company_name}</p>
                <p className="text-slate-600 text-sm">{company?.address}</p>
                <p className="text-slate-600 text-sm mt-1">{company?.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Event Reference:</p>
                <p className="font-semibold text-slate-900">{selectedInvoice?.rental_requests?.event_name}</p>
              </div>
            </div>

            <table className="w-full mb-8">
              <thead className="bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Item</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500">Qty</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Daily Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="py-3 px-3 text-sm text-slate-900">{item.devices?.name}</td>
                    <td className="py-3 px-3 text-sm text-slate-600 text-center">{item.quantity}</td>
                    <td className="py-3 px-3 text-sm text-slate-600 text-right">₹{item.devices?.daily_price?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end border-t border-slate-200 pt-4">
              <div className="w-64">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500 text-sm">Subtotal:</span>
                  <span className="text-slate-900 text-sm font-medium">₹{selectedInvoice?.total_amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2">
                  <span className="font-bold text-slate-900">Total Due:</span>
                  <span className="font-bold text-primary-600 text-lg">₹{selectedInvoice?.total_amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center text-xs text-slate-400">
              <p>Thank you for your business!</p>
              <p className="mt-1">Please make bank transfers to: HDFC Bank, Acct #1234567890, IFSC: HDFC0001234</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setPrintModal(false)} className="btn-secondary">Close</button>
            <button onClick={downloadPDF} disabled={downloading} className="btn-primary flex items-center gap-2">
              <Download size={16} />
              {downloading ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
