import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import { Truck, MapPin, Calendar, CheckCircle, Clock, Search, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

export default function Logistics() {
  const [requests, setRequests] = useState([])
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal State
  const [tripModal, setTripModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  
  // Form State
  const [scheduledDate, setScheduledDate] = useState('')
  const [assignedAgent, setAssignedAgent] = useState('')
  const [vehicleDetails, setVehicleDetails] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [reqRes, tripRes] = await Promise.all([
      supabase.from('rental_requests')
        .select('*, companies(*)')
        .in('status', ['Approved', 'Allocated']),
      supabase.from('logistics_trips')
        .select('*, rental_requests(event_name, companies(company_name))')
        .eq('trip_type', 'Delivery')
        .order('scheduled_date', { ascending: true })
    ])
    setRequests(reqRes.data || [])
    setTrips(tripRes.data || [])
    setLoading(false)
  }

  async function handleScheduleTrip(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('logistics_trips').insert({
        request_id: selectedRequest.id,
        trip_type: 'Delivery',
        scheduled_date: scheduledDate,
        assigned_agent: assignedAgent,
        vehicle_details: vehicleDetails,
        status: 'Scheduled'
      })
      if (error) throw error
      
      // Update request status to Allocated
      await supabase.from('rental_requests')
        .update({ status: 'Allocated' })
        .eq('id', selectedRequest.id)
        
      setTripModal(false)
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateTripStatus(tripId, newStatus, requestId) {
    try {
      await supabase.from('logistics_trips')
        .update({ 
          status: newStatus,
          ...(newStatus === 'Completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', tripId)

      if (newStatus === 'Completed') {
        await supabase.from('rental_requests')
          .update({ status: 'Delivered' })
          .eq('id', requestId)
      }
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <LoadingSpinner text="Loading logistics..." />

  const filteredRequests = requests.filter(r => 
    !trips.find(t => t.request_id === r.id && t.status !== 'Failed') &&
    (r.event_name.toLowerCase().includes(search.toLowerCase()) || 
     r.companies?.company_name.toLowerCase().includes(search.toLowerCase()))
  )

  const activeTrips = trips.filter(t => t.status !== 'Completed')
  const completedTrips = trips.filter(t => t.status === 'Completed')

  return (
    <div className="space-y-6 animate-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Delivery Logistics</h1>
          <p className="text-slate-500 text-sm mt-1">Manage dispatch and track delivery vehicles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Needs Scheduling */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              Needs Dispatch ({filteredRequests.length})
            </h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search approved requests..." 
                className="input pl-9 text-sm py-2"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg">
                  <p className="text-slate-500 text-sm">No pending dispatch requests</p>
                </div>
              ) : (
                filteredRequests.map(req => (
                  <div key={req.id} className="p-3 border border-slate-200 rounded-lg hover:border-primary-300 transition-colors bg-slate-50">
                    <p className="font-semibold text-slate-900 text-sm">{req.event_name}</p>
                    <p className="text-xs text-slate-500 mb-2">{req.companies?.company_name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <MapPin size={12} /> <span className="truncate">{req.delivery_location}</span>
                    </div>
                    <button onClick={() => {
                      setSelectedRequest(req)
                      setScheduledDate(req.start_date.split('T')[0])
                      setTripModal(true)
                    }} className="btn-primary w-full text-xs py-1.5 justify-center">
                      Schedule Trip
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Trips */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Truck size={18} className="text-blue-500" />
              Active Delivery Trips ({activeTrips.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="table-th py-2">Trip Date</th>
                    <th className="table-th py-2">Event / Company</th>
                    <th className="table-th py-2">Agent & Vehicle</th>
                    <th className="table-th py-2">Status</th>
                    <th className="table-th py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTrips.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500 text-sm">No active trips</td></tr>
                  ) : (
                    activeTrips.map(trip => (
                      <tr key={trip.id} className="hover:bg-slate-50">
                        <td className="table-td py-3 whitespace-nowrap">
                          {format(new Date(trip.scheduled_date), 'dd MMM yyyy')}
                        </td>
                        <td className="table-td py-3">
                          <p className="font-medium text-slate-900">{trip.rental_requests?.event_name}</p>
                          <p className="text-xs text-slate-500">{trip.rental_requests?.companies?.company_name}</p>
                        </td>
                        <td className="table-td py-3">
                          <p className="text-sm">{trip.assigned_agent}</p>
                          <p className="text-xs text-slate-500 font-mono">{trip.vehicle_details}</p>
                        </td>
                        <td className="table-td py-3">
                          <span className={`badge ${
                            trip.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {trip.status}
                          </span>
                        </td>
                        <td className="table-td py-3 text-right space-x-2">
                          {trip.status === 'Scheduled' && (
                            <button onClick={() => updateTripStatus(trip.id, 'In Transit', trip.request_id)} 
                              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium hover:bg-blue-100">
                              Mark In Transit
                            </button>
                          )}
                          {trip.status === 'In Transit' && (
                            <button onClick={() => updateTripStatus(trip.id, 'Completed', trip.request_id)} 
                              className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded font-medium hover:bg-green-100">
                              Mark Delivered
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

          <div className="card p-5 opacity-75">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
              <CheckCircle size={16} className="text-green-500" />
              Recently Completed Deliveries
            </h2>
            <div className="space-y-2">
              {completedTrips.slice(0, 5).map(trip => (
                <div key={trip.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                  <div>
                    <span className="font-medium">{trip.rental_requests?.event_name}</span>
                    <span className="text-slate-500 ml-2">by {trip.assigned_agent}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {trip.completed_at ? format(new Date(trip.completed_at), 'dd MMM yyyy') : ''}
                  </span>
                </div>
              ))}
              {completedTrips.length === 0 && <p className="text-xs text-slate-500 italic">No recent deliveries.</p>}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={tripModal} onClose={() => setTripModal(false)} title="Schedule Delivery Trip">
        <form onSubmit={handleScheduleTrip} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-200 mb-4">
            <p className="font-semibold">{selectedRequest?.event_name}</p>
            <p className="text-slate-500 text-xs mt-1"><MapPin size={12} className="inline mr-1" />{selectedRequest?.delivery_location}</p>
          </div>
          <div>
            <label className="label">Scheduled Date</label>
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
            <button type="button" onClick={() => setTripModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Scheduling...' : 'Confirm Dispatch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
