import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import { RotateCcw, Truck, Search, ClipboardCheck, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

export default function Returns() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [trips, setTrips] = useState([])
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modals
  const [pickupModal, setPickupModal] = useState(false)
  const [inspectModal, setInspectModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  
  // Form States
  const [scheduledDate, setScheduledDate] = useState('')
  const [assignedAgent, setAssignedAgent] = useState('')
  const [vehicleDetails, setVehicleDetails] = useState('')
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [reqRes, tripRes, retRes] = await Promise.all([
      supabase.from('rental_requests')
        .select('*, companies(*)')
        .in('status', ['Delivered', 'Completed']),
      supabase.from('logistics_trips')
        .select('*')
        .eq('trip_type', 'Pickup'),
      supabase.from('returns_log')
        .select('*')
    ])
    setRequests(reqRes.data || [])
    setTrips(tripRes.data || [])
    setReturns(retRes.data || [])
    setLoading(false)
  }

  async function handleSchedulePickup(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('logistics_trips').insert({
        request_id: selectedRequest.id,
        trip_type: 'Pickup',
        scheduled_date: scheduledDate,
        assigned_agent: assignedAgent,
        vehicle_details: vehicleDetails,
        status: 'Scheduled'
      })
      if (error) throw error
      setPickupModal(false)
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateTripStatus(tripId, newStatus) {
    try {
      await supabase.from('logistics_trips')
        .update({ 
          status: newStatus,
          ...(newStatus === 'Completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', tripId)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleLogInspection(e) {
    e.preventDefault()
    setSaving(true)
    try {
      // Create return log
      const { error: logErr } = await supabase.from('returns_log').insert({
        request_id: selectedRequest.id,
        notes: inspectionNotes,
        inspected_by: user.id,
        status: 'Completed'
      })
      if (logErr) throw logErr

      // Update request status
      const { error: reqErr } = await supabase.from('rental_requests')
        .update({ status: 'Completed' })
        .eq('id', selectedRequest.id)
      if (reqErr) throw reqErr

      setInspectModal(false)
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading returns board..." />

  const activeDeliveries = requests.filter(r => r.status === 'Delivered')
  
  return (
    <div className="space-y-6 animate-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Returns & Inspections</h1>
          <p className="text-slate-500 text-sm mt-1">Manage reverse logistics and equipment condition checks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Rentals (Needs Pickup or Inspection) */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <RotateCcw size={18} className="text-orange-500" />
              Active Rentals ({activeDeliveries.length})
            </h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search by event or company..." 
                className="input pl-9 text-sm py-2"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="space-y-3">
              {activeDeliveries.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8 border border-dashed rounded-lg">No active rentals pending return</p>
              ) : (
                activeDeliveries
                  .filter(r => r.event_name.toLowerCase().includes(search.toLowerCase()) || r.companies?.company_name.toLowerCase().includes(search.toLowerCase()))
                  .map(req => {
                  const pickupTrip = trips.find(t => t.request_id === req.id && t.status !== 'Failed')
                  const isReturned = pickupTrip?.status === 'Completed'
                  
                  return (
                    <div key={req.id} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{req.event_name}</p>
                          <p className="text-xs text-slate-500">{req.companies?.company_name}</p>
                        </div>
                        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">
                          Ends: {format(new Date(req.end_date), 'dd MMM')}
                        </span>
                      </div>
                      
                      {/* Pickup Status / Action */}
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        {!pickupTrip ? (
                          <>
                            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded flex items-center gap-1">
                              <AlertTriangle size={12}/> Needs Pickup Scheduled
                            </span>
                            <button onClick={() => {
                              setSelectedRequest(req)
                              setScheduledDate(req.end_date.split('T')[0])
                              setPickupModal(true)
                            }} className="btn-secondary text-xs py-1.5 px-3">
                              Schedule Pickup
                            </button>
                          </>
                        ) : !isReturned ? (
                          <>
                            <div className="text-xs">
                              <p className="text-slate-500">Pickup Agent: <span className="font-medium text-slate-700">{pickupTrip.assigned_agent}</span></p>
                              <p className="text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                                <Truck size={12}/> {pickupTrip.status}
                              </p>
                            </div>
                            <div className="space-x-2">
                              {pickupTrip.status === 'Scheduled' && (
                                <button onClick={() => updateTripStatus(pickupTrip.id, 'In Transit')} className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">
                                  Mark In Transit
                                </button>
                              )}
                              {pickupTrip.status === 'In Transit' && (
                                <button onClick={() => updateTripStatus(pickupTrip.id, 'Completed')} className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100">
                                  Mark Arrived
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                              <Truck size={12}/> Gear Arrived at HQ
                            </span>
                            <button onClick={() => {
                              setSelectedRequest(req)
                              setInspectionNotes('')
                              setInspectModal(true)
                            }} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                              <ClipboardCheck size={14}/> Log Inspection
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Completed Returns */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-green-600" />
              Completed Returns History
            </h2>
            <div className="space-y-3">
              {returns.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8 border border-dashed rounded-lg">No completed returns yet</p>
              ) : (
                returns.map(ret => {
                  const req = requests.find(r => r.id === ret.request_id)
                  return (
                    <div key={ret.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-slate-900 text-sm">{req?.event_name || 'Unknown Request'}</p>
                        <span className="text-xs text-slate-400">{format(new Date(ret.returned_at), 'dd MMM yyyy')}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{req?.companies?.company_name}</p>
                      {ret.notes && (
                        <div className="bg-white p-2 rounded border border-slate-100 text-xs text-slate-600">
                          <span className="font-medium">Inspection Notes: </span>{ret.notes}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Pickup Modal */}
      <Modal isOpen={pickupModal} onClose={() => setPickupModal(false)} title="Schedule Reverse Pickup">
        <form onSubmit={handleSchedulePickup} className="space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg text-sm border border-amber-200 text-amber-800 mb-4">
            Scheduling pickup for <strong>{selectedRequest?.event_name}</strong>
          </div>
          <div>
            <label className="label">Pickup Date</label>
            <input type="date" required className="input" 
              value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Assigned Driver / Agent</label>
            <input type="text" required className="input" placeholder="e.g. Michael Smith"
              value={assignedAgent} onChange={e => setAssignedAgent(e.target.value)} />
          </div>
          <div>
            <label className="label">Vehicle Details (Optional)</label>
            <input type="text" className="input" placeholder="e.g. MH-12-AB-3456 (Van)"
              value={vehicleDetails} onChange={e => setVehicleDetails(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setPickupModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Scheduling...' : 'Schedule Pickup'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Inspection Modal */}
      <Modal isOpen={inspectModal} onClose={() => setInspectModal(false)} title="Log Return Inspection">
        <form onSubmit={handleLogInspection} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-200 mb-4 text-slate-700">
            Log physical condition of equipment returned from <strong>{selectedRequest?.companies?.company_name}</strong>.
          </div>
          <div>
            <label className="label">Inspection Notes (Damages, missing cables, etc.)</label>
            <textarea required rows={4} className="input" placeholder="e.g. All 50 laptops returned safely. 2 chargers missing."
              value={inspectionNotes} onChange={e => setInspectionNotes(e.target.value)} />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setInspectModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <ClipboardCheck size={16} />
              {saving ? 'Saving...' : 'Complete Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
