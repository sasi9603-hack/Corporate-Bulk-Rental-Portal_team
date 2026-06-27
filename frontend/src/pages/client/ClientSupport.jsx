import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import { MessageSquare, Plus, Send, Clock, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function ClientSupport() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals & Active State
  const [newTicketModal, setNewTicketModal] = useState(false)
  const [activeTicket, setActiveTicket] = useState(null)
  
  // Forms
  const [subject, setSubject] = useState('')
  const [messageText, setMessageText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setTickets(data)
    setLoading(false)
  }

  async function loadMessages(ticketId) {
    const { data } = await supabase.from('support_messages')
      .select('*, profiles(full_name, role)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function handleCreateTicket(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data, error } = await supabase.from('support_tickets').insert({
        client_id: user.id,
        subject,
        status: 'Open'
      }).select().single()

      if (error) throw error

      await supabase.from('support_messages').insert({
        ticket_id: data.id,
        sender_id: user.id,
        message_text: messageText
      })

      setNewTicketModal(false)
      setSubject('')
      setMessageText('')
      loadData()
      openTicket(data)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!messageText.trim()) return
    
    setSaving(true)
    try {
      await supabase.from('support_messages').insert({
        ticket_id: activeTicket.id,
        sender_id: user.id,
        message_text: messageText
      })
      setMessageText('')
      loadMessages(activeTicket.id)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  function openTicket(ticket) {
    setActiveTicket(ticket)
    setMessageText('')
    loadMessages(ticket.id)
  }

  if (loading) return <LoadingSpinner text="Loading support desk..." />

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-in">
      <div className="page-header mb-4">
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="section-title">IT Support & Helpdesk</h1>
            <p className="text-slate-500 text-sm mt-1">Chat with our engineers about equipment issues</p>
          </div>
          <button onClick={() => setNewTicketModal(true)} className="btn-primary py-2 px-4 flex items-center gap-2">
            <Plus size={16} /> New Ticket
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex">
        
        {/* Ticket List (Sidebar) */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Your Tickets</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {tickets.length === 0 ? (
              <p className="text-center text-slate-400 text-sm mt-8">No support tickets found.</p>
            ) : (
              tickets.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => openTicket(t)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    activeTicket?.id === t.id 
                      ? 'bg-white border-primary-300 shadow-sm' 
                      : 'border-transparent hover:bg-slate-100'
                  }`}
                >
                  <p className="font-medium text-slate-900 text-sm truncate">{t.subject}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      t.status === 'Open' ? 'bg-amber-100 text-amber-700' :
                      t.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {t.status}
                    </span>
                    <span className="text-xs text-slate-400">{format(new Date(t.created_at), 'MMM dd')}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {activeTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="font-bold text-slate-900">{activeTicket.subject}</h2>
                  <p className="text-xs text-slate-500 mt-1">Ticket ID: {activeTicket.id.split('-')[0]}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => {
                  const isMe = msg.sender_id === user.id
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-400 mb-1 px-1">
                        {isMe ? 'You' : msg.profiles?.full_name || 'Support Admin'} • {format(new Date(msg.created_at), 'h:mm a')}
                      </span>
                      <div className={`p-3 max-w-[80%] text-sm ${
                        isMe 
                          ? 'bg-primary-600 text-white rounded-l-xl rounded-tr-xl' 
                          : 'bg-slate-100 text-slate-800 rounded-r-xl rounded-tl-xl'
                      }`}>
                        {msg.message_text}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Chat Input */}
              {activeTicket.status !== 'Closed' ? (
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input 
                      type="text" 
                      className="input flex-1 bg-white" 
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                    />
                    <button type="submit" disabled={saving || !messageText.trim()} className="btn-primary px-4">
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
                  <CheckCircle size={16} className="inline mr-2 text-green-500" />
                  This ticket has been marked as Closed.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>Select a ticket to view the conversation</p>
            </div>
          )}
        </div>

      </div>

      <Modal isOpen={newTicketModal} onClose={() => setNewTicketModal(false)} title="Open New Support Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="label">Subject / Issue Summary</label>
            <input type="text" required className="input" placeholder="e.g. Broken screen on Dell Latitude"
              value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label">Describe the issue</label>
            <textarea required rows={4} className="input" placeholder="Please provide details about the problem..."
              value={messageText} onChange={e => setMessageText(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setNewTicketModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
