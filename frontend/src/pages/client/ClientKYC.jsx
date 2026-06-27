import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Upload, FileText, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StatusBadge from '../../components/ui/StatusBadge'

export default function ClientKYC() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  
  // Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [documentType, setDocumentType] = useState('GSTIN')
  const [file, setFile] = useState(null)

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch user's companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
      
      if (companiesError) throw companiesError
      setCompanies(companiesData)
      if (companiesData.length > 0) {
        setSelectedCompanyId(companiesData[0].id)
      }

      // Fetch user's KYC documents
      const { data: docsData, error: docsError } = await supabase
        .from('kyc_documents')
        .select(`
          id, document_type, status, rejection_reason, created_at,
          companies ( company_name )
        `)
        .order('created_at', { ascending: false })
      
      if (docsError) throw docsError
      setDocuments(docsData)
    } catch (err) {
      console.error('Error fetching KYC data:', err)
      setError('Failed to load data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file || !selectedCompanyId) {
      setError('Please select a file and a company.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error('Failed to upload file to storage. Did you create the kyc-documents bucket?')
      }

      // Insert record
      const { error: dbError } = await supabase
        .from('kyc_documents')
        .insert([{
          company_id: selectedCompanyId,
          uploaded_by: user.id,
          document_type: documentType,
          document_url: filePath,
          status: 'Pending'
        }])

      if (dbError) throw dbError

      // Reset form & refresh
      setFile(null)
      fetchData()
      
      // Reset file input UI
      const fileInput = document.getElementById('file-upload')
      if (fileInput) fileInput.value = ''

    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'An error occurred during upload.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="section-title">KYC Verification</h1>
          <p className="text-slate-400 mt-1">Upload your corporate documents for verification to proceed with rentals.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary-500" />
              Upload Document
            </h2>
            
            {companies.length === 0 ? (
              <div className="text-sm text-slate-400 bg-slate-50 p-4 rounded-lg border border-slate-200">
                You need to submit at least one rental request to register a company before uploading KYC documents.
              </div>
            ) : (
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="label">Company</label>
                  <select 
                    className="input"
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    required
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Document Type</label>
                  <select 
                    className="input"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    required
                  >
                    <option value="GSTIN">GSTIN Certificate</option>
                    <option value="Company_PAN">Company PAN</option>
                    <option value="Trade_License">Trade License</option>
                    <option value="Aadhar_Corp">Authorized Signatory Aadhar</option>
                  </select>
                </div>

                <div>
                  <label className="label">File</label>
                  <input 
                    id="file-upload"
                    type="file" 
                    className="input py-2 text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-slate-400 mt-2">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary w-full justify-center mt-2"
                  disabled={uploading || !file}
                >
                  {uploading ? (
                    <>Uploading...</>
                  ) : (
                    <>Submit Document</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Uploaded Documents List */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Your Documents</h2>
            </div>
            
            {documents.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No documents uploaded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        doc.status === 'Verified' ? 'bg-green-500/20 text-green-500' : 
                        doc.status === 'Rejected' ? 'bg-red-500/20 text-red-500' : 
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {doc.status === 'Verified' ? <CheckCircle className="w-5 h-5" /> :
                         doc.status === 'Rejected' ? <XCircle className="w-5 h-5" /> :
                         <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-slate-900 font-medium">
                          {doc.document_type.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-slate-400">
                          {doc.companies?.company_name} • {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                        {doc.status === 'Rejected' && doc.rejection_reason && (
                          <p className="text-sm text-red-400 mt-1">Reason: {doc.rejection_reason}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <StatusBadge status={doc.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
