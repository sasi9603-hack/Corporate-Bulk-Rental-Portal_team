import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Monitor, Laptop, Printer, Projector, Server,
  CheckCircle, Phone, Mail, MapPin, ArrowRight,
  Star, Shield, Clock, Users, ChevronDown, Menu, X, Building2
} from 'lucide-react'

const devices = [
  { icon: Laptop, name: 'Laptops', desc: 'High-performance laptops for training and corporate events', from: '₹400/day', color: 'bg-blue-50 text-blue-600' },
  { icon: Monitor, name: 'Desktops', desc: 'Powerful desktop workstations for intensive computing tasks', from: '₹300/day', color: 'bg-purple-50 text-purple-600' },
  { icon: Monitor, name: 'Monitors', desc: 'Ultra-sharp displays from 24" to 32" for any setup', from: '₹150/day', color: 'bg-teal-50 text-teal-600' },
  { icon: Projector, name: 'Projectors', desc: 'Full HD and 4K projectors for conferences and events', from: '₹800/day', color: 'bg-amber-50 text-amber-600' },
  { icon: Printer, name: 'Printers', desc: 'Laser and inkjet printers for corporate documentation', from: '₹250/day', color: 'bg-red-50 text-red-600' },
]

const steps = [
  { num: '01', title: 'Submit a Request', desc: 'Fill out our simple bulk rental request form with your event details and device requirements.' },
  { num: '02', title: 'Get a Quotation', desc: 'Our team reviews your request and sends a customized quotation within 24 hours.' },
  { num: '03', title: 'Approve & Confirm', desc: 'Review the quotation, approve it, and we lock in your equipment for the specified dates.' },
  { num: '04', title: 'Delivery & Setup', desc: 'We deliver and set up all equipment at your location on the event start date.' },
  { num: '05', title: 'Event Support', desc: 'Technical support is available throughout your event for any assistance needed.' },
  { num: '06', title: 'Return & Close', desc: 'After the event, we collect all equipment and close the rental seamlessly.' },
]

const stats = [
  { value: '500+', label: 'Events Served' },
  { value: '10,000+', label: 'Devices in Fleet' },
  { value: '98%', label: 'Client Satisfaction' },
  { value: '24hr', label: 'Support Response' },
]

const clients = ['TCS', 'Infosys', 'Wipro', 'HCL', 'Cognizant', 'Accenture']

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">CorpRental<span className="text-primary-600">Pro</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Services', 'How It Works', 'About', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm font-medium text-slate-400 hover:text-primary-600 transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="btn-secondary btn-sm">Login</Link>
            <Link to="/request" className="btn-primary btn-sm">Get a Quote</Link>
          </div>

          <button className="md:hidden p-2 rounded-lg text-slate-400" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 flex flex-col gap-4">
            {['Services', 'How It Works', 'About', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm font-medium text-slate-400" onClick={() => setMenuOpen(false)}>
                {item}
              </a>
            ))}
            <Link to="/request" className="btn-primary btn-sm w-full justify-center" onClick={() => setMenuOpen(false)}>
              Get a Quote
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="hero-gradient hero-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 to-primary-600/80" />
        <div className="relative max-w-7xl mx-auto px-6 py-28 md:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 
                            rounded-full px-4 py-1.5 mb-6">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="text-white/90 text-xs font-medium">Trusted by 200+ Corporate Clients Across India</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
              Bulk IT Equipment<br />
              <span className="text-blue-300">Rental Made Simple</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed max-w-2xl">
              Rent laptops, desktops, monitors, projectors, and printers in bulk for corporate events,
              training programs, and conferences — delivered and set up at your location.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/request"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 
                           font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl text-base">
                Request a Quote <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white 
                           font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-all text-base">
                See How It Works <ChevronDown size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="relative bg-white/10 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold text-white">{value}</p>
                <p className="text-white/60 text-sm mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services / Devices */}
      <section id="services" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-wider mb-3">Our Equipment</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              World-Class Devices, On Demand
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Choose from our extensive fleet of corporate-grade equipment, available in any quantity for any duration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map(({ icon: Icon, name, desc, from, color }) => (
              <div key={name}
                className="card-hover p-6 group cursor-pointer"
                onClick={() => navigate('/request')}>
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-5 
                                  group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={26} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{name}</h3>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">{desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600 font-bold">Starting {from}</span>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-primary-600 
                                                    group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}

            {/* CTA Card */}
            <div className="hero-gradient rounded-xl p-6 text-white flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-5">
                  <Users size={26} className="text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">Custom Packages</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  Need a custom combination? We tailor bulk rental packages to exactly fit your requirements.
                </p>
              </div>
              <Link to="/request"
                className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-5 py-2.5 
                           rounded-lg hover:bg-blue-50 transition-colors text-sm w-fit">
                Request Custom <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-wider mb-3">Process</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              From request to delivery in 6 simple steps. We handle everything so you can focus on your event.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 border-2 border-primary-100 flex items-center 
                                  justify-center flex-shrink-0 font-black text-primary-600 text-base">
                    {num}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-24 bg-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-blue-300 font-semibold text-sm uppercase tracking-wider mb-3">Why CorpRentalPro</p>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight">
                The Most Trusted IT Rental Partner for Corporates
              </h2>
              <p className="text-white/70 text-lg mb-8 leading-relaxed">
                With over a decade of experience in bulk IT equipment rental, we understand the unique demands
                of corporate events, training institutes, and large-scale conferences.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Shield, text: 'All equipment tested and certified before delivery' },
                  { icon: Clock, text: 'On-time delivery guaranteed — 99.2% track record' },
                  { icon: CheckCircle, text: 'Dedicated account manager for every project' },
                  { icon: Users, text: 'Serving 200+ corporate clients across Pan India' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-blue-300" />
                    </div>
                    <span className="text-white/80 text-sm">{text}</span>
                  </div>
                ))}
              </div>
              <Link to="/request"
                className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 bg-white text-primary-700 
                           font-bold rounded-xl hover:bg-blue-50 transition-all">
                Start Your Request <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Laptops Available', value: '500+', bg: 'bg-blue-800' },
                { label: 'Cities Covered', value: '15+', bg: 'bg-blue-700' },
                { label: 'Years Experience', value: '10+', bg: 'bg-blue-700' },
                { label: 'Happy Clients', value: '200+', bg: 'bg-blue-800' },
              ].map(({ label, value, bg }) => (
                <div key={label} className={`${bg} rounded-2xl p-6 text-center`}>
                  <p className="text-4xl font-black text-white mb-1">{value}</p>
                  <p className="text-white/60 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Clients */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm font-medium mb-8 uppercase tracking-wider">Trusted by India's Leading Companies</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {clients.map(c => (
              <span key={c} className="text-2xl font-extrabold text-slate-700 hover:text-slate-400 transition-colors cursor-default">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA Section */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="card p-10 md:p-16 text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
              <Phone size={26} className="text-primary-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Ready to Get Started?</h2>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed">
              Fill out our bulk rental request form and get a customized quotation within 24 hours.
              No commitment required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/request" className="btn-primary text-base px-8 py-3.5">
                Request a Quotation <ArrowRight size={18} />
              </Link>
              <a href="tel:+911234567890" className="btn-secondary text-base px-8 py-3.5">
                <Phone size={18} /> Call Us Now
              </a>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Mail size={15} className="text-primary-500" />
                <span>hello@corprental.com</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Phone size={15} className="text-primary-500" />
                <span>+91 12345 67890</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <MapPin size={15} className="text-primary-500" />
                <span>Pan India Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg">CorpRental<span className="text-blue-400">Pro</span></span>
            </div>
            <p className="text-slate-400 text-sm text-center">
              © {new Date().getFullYear()} CorpRentalPro. All rights reserved. Built for corporate excellence.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Login</Link>
              <Link to="/request" className="text-slate-400 hover:text-white text-sm transition-colors">Get a Quote</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

