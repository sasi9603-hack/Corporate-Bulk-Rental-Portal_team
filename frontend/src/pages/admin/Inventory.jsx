import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Plus, Edit2, Trash2, Package, Search, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const CATEGORIES = ['Laptop', 'Desktop', 'Monitor', 'Projector', 'Printer']
const EMPTY_FORM = { name: '', category: 'Laptop', available_quantity: 0, daily_price: 0 }

export default function Inventory() {
  const [devices, setDevices] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [modal, setModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [editDevice, setEditDevice] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { loadDevices() }, [])

  useEffect(() => {
    let data = devices
    if (catFilter !== 'All') data = data.filter(d => d.category === catFilter)
    if (search) data = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    setFiltered(data)
  }, [devices, search, catFilter])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadDevices() {
    setLoading(true)
    const { data } = await supabase.from('devices').select('*').order('category').order('name')
    setDevices(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditDevice(null)
    setForm(EMPTY_FORM)
    setModal(true)
  }

  function openEdit(device) {
    setEditDevice(device)
    setForm({
      name: device.name,
      category: device.category,
      available_quantity: device.available_quantity,
      daily_price: device.daily_price,
    })
    setModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editDevice) {
        const { error } = await supabase.from('devices').update(form).eq('id', editDevice.id)
        if (error) throw error
        showToast('Device updated successfully')
      } else {
        const { error } = await supabase.from('devices').insert(form)
        if (error) throw error
        showToast('Device added successfully')
      }
      setModal(false)
      await loadDevices()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const { error } = await supabase.from('devices').delete().eq('id', deleteTarget.id)
      if (error) throw error
      showToast('Device deleted')
      setDeleteModal(false)
      setDeleteTarget(null)
      await loadDevices()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const catColors = {
    Laptop: 'bg-blue-100 text-blue-700',
    Desktop: 'bg-purple-100 text-purple-700',
    Monitor: 'bg-teal-100 text-teal-700',
    Projector: 'bg-amber-100 text-amber-700',
    Printer: 'bg-red-100 text-red-700',
  }

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
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Inventory Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">{devices.length} devices in fleet</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Add Device
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {CATEGORIES.map(cat => {
          const catDevices = devices.filter(d => d.category === cat)
          const total = catDevices.reduce((sum, d) => sum + d.available_quantity, 0)
          return (
            <div key={cat} className="card p-4 text-center">
              <p className="text-2xl font-extrabold text-slate-900">{total}</p>
              <p className="text-xs text-slate-400 mt-0.5">{cat}s</p>
              <p className="text-xs text-slate-300">{catDevices.length} models</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search devices..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', ...CATEGORIES].map(cat => (
              <button key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                  ${catFilter === cat
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-600'
                  }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading inventory..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="table-th">Device Name</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Available Qty</th>
                  <th className="table-th">Daily Price</th>
                  <th className="table-th">Stock Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-td text-center text-slate-400 py-12">
                      <Package size={32} className="mx-auto mb-3 opacity-30" />
                      No devices found
                    </td>
                  </tr>
                ) : filtered.map(device => (
                  <tr key={device.id} className="table-row">
                    <td className="table-td font-semibold text-slate-900">{device.name}</td>
                    <td className="table-td">
                      <span className={`badge ${catColors[device.category] || 'bg-gray-100 text-gray-700'}`}>
                        {device.category}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className="font-bold text-slate-800">{device.available_quantity}</span>
                      <span className="text-slate-400 text-xs ml-1">units</span>
                    </td>
                    <td className="table-td font-semibold text-slate-800">
                      ₹{Number(device.daily_price).toLocaleString('en-IN')}/day
                    </td>
                    <td className="table-td">
                      {device.available_quantity === 0 ? (
                        <span className="badge bg-red-100 text-red-700">Out of Stock</span>
                      ) : device.available_quantity < 10 ? (
                        <span className="badge bg-amber-100 text-amber-700">Low Stock</span>
                      ) : (
                        <span className="badge bg-green-100 text-green-700">In Stock</span>
                      )}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(device)}
                          className="p-1.5 rounded-lg hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => { setDeleteTarget(device); setDeleteModal(true) }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            {filtered.length} of {devices.length} devices
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)}
        title={editDevice ? 'Edit Device' : 'Add New Device'}>
        <div className="space-y-4">
          <div>
            <label className="label">Device Name *</label>
            <input className="input" placeholder="e.g. Dell Latitude 5520"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Available Quantity</label>
              <input className="input" type="number" min="0"
                value={form.available_quantity}
                onChange={e => setForm(f => ({ ...f, available_quantity: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Daily Price (₹)</label>
              <input className="input" type="number" min="0" step="0.01"
                value={form.daily_price}
                onChange={e => setForm(f => ({ ...f, daily_price: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : editDevice ? 'Save Changes' : 'Add Device'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Device" size="sm">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <p className="text-slate-700 font-semibold mb-1">Delete "{deleteTarget?.name}"?</p>
          <p className="text-slate-400 text-sm mb-6">This action cannot be undone. The device will be permanently removed from inventory.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setDeleteModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} disabled={saving} className="btn-danger">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Deleting...</> : 'Delete Device'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
