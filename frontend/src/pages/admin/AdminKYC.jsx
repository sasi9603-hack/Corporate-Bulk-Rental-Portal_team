import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, FileText, Download, Eye } from 'lucide-react'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'

export default function AdminKYC() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('kyc_documents')
        .select(`
          id, document_type, document_url, status, rejection_reason, created_at,
          companies ( company_name, contact_person, email )
        `)
        .order('created_at', { ascending: false })
      
      if (err) throw err
      setDocuments(data)
    } catch (err) {
      console.error('Error fetching KYC documents:', err)
      setError('Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDocument = async (docUrl) => {
    try {
      // kyc-documents is a private bucket, so we need a signed URL
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(docUrl, 60) // valid for 60 seconds

      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      console.error('Error getting signed URL:', err)
      alert('Could not open document. It might have been deleted.')
    }
  }

  const handleVerify = async (docId) => {
    if (!window.confirm('Are you sure you want to verify this document?')) return
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({ status: 'Verified', rejection_reason: null })
        .eq('id', docId)

      if (error) throw error
      fetchDocuments()
    } catch (err) {
      console.error('Error verifying doc:', err)
      alert('Failed to verify document.')
    } finally {
      setActionLoading(false)
    }
  }

  const openRejectModal = (doc) => {
    setSelectedDoc(doc)
    setRejectionReason('')
    setRejectModalOpen(true)
  }

  const handleReject = async (e) => {
    e.preventDefault()
    if (!rejectionReason.trim()) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({ status: 'Rejected', rejection_reason: rejectionReason })
        .eq('id', selectedDoc.id)

      if (error) throw error
      
      setRejectModalOpen(false)
      fetchDocuments()
    } catch (err) {
      console.error('Error rejecting doc:', err)
      alert('Failed to reject document.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="section-title">KYC Verification Queue</h1>
          <p className="text-slate-400 mt-1">Review and verify client corporate documents.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">Company</th>
                <th className="table-th">Document Type</th>
                <th className="table-th">Uploaded</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                    No KYC documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="table-row">
                    <td className="table-td">
                      <div className="font-medium text-slate-900">{doc.companies?.company_name}</div>
                      <div className="text-xs text-slate-400">{doc.companies?.email}</div>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {doc.document_type.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="table-td text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="table-td">
                      <StatusBadge status={doc.status} />
                      {doc.status === 'Rejected' && (
                        <div className="text-xs text-red-400 mt-1 truncate max-w-[150px]" title={doc.rejection_reason}>
                          {doc.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDocument(doc.document_url)}
                          className="p-1.5 text-slate-400 hover:text-primary-400 hover:bg-white rounded transition-colors"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {doc.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleVerify(doc.id)}
                              disabled={actionLoading}
                              className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-white rounded transition-colors"
                              title="Verify"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRejectModal(doc)}
                              disabled={actionLoading}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal 
        isOpen={rejectModalOpen} 
        onClose={() => !actionLoading && setRejectModalOpen(false)}
        title="Reject Document"
      >
        <form onSubmit={handleReject} className="space-y-4">
          <p className="text-sm text-slate-700">
            Please provide a reason for rejecting the <strong className="text-slate-900">{selectedDoc?.document_type.replace('_', ' ')}</strong> for <strong className="text-slate-900">{selectedDoc?.companies?.company_name}</strong>.
          </p>
          
          <div>
            <label className="label">Rejection Reason</label>
            <textarea
              className="input min-h-[100px]"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="E.g., Image is blurry, document is expired..."
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="btn-secondary"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-danger"
              disabled={actionLoading}
            >
              {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
