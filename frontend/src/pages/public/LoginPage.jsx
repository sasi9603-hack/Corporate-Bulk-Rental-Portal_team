import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  Building2, Loader2, Eye, EyeOff, Lock, Mail,
  AlertCircle, User, ArrowRight, CheckCircle
} from 'lucide-react'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login') // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup form
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { user } = await signIn(loginEmail, loginPassword)
      // Role-based redirect handled in App via AuthContext
      // Brief delay for profile to load
      setTimeout(() => {
        navigate('/redirect')
      }, 100)
    } catch (err) {
      const msg = err?.message || err?.error_description || err?.msg
      if (msg && msg !== '{}') {
        setError(msg)
      } else {
        setError('Invalid email or password. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match.')
      return
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await signUp(signupEmail, signupPassword, signupName, 'client')
      setSignupSuccess(true)
    } catch (err) {
      const msg = err?.message || err?.error_description || err?.msg
      if (msg && msg !== '{}' && typeof msg === 'string') {
        setError(msg)
      } else {
        setError('Failed to create account. Please try again. Check your email and ensure SMTP is configured correctly.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-6">
        <div className="absolute inset-0 hero-pattern opacity-30" />
        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Account Created!</h2>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Your corporate client account has been created successfully.
                {' '}Please check your email to verify your account, then sign in.
              </p>
              <button onClick={() => { setTab('login'); setSignupSuccess(false); setLoginEmail(signupEmail) }}
                className="btn-primary w-full justify-center">
                Go to Sign In <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 hero-pattern opacity-30" />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary-400 via-blue-500 to-indigo-500" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mb-4 shadow-lg shadow-primary-200">
                <Building2 size={26} className="text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">CorpRentalPro</h1>
              <p className="text-slate-400 text-sm mt-1">Corporate Bulk Equipment Rental</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-50 rounded-xl p-1 mb-6">
              <button
                onClick={() => { setTab('login'); setError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setTab('signup'); setError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === 'signup'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* LOGIN Form */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" className="input pl-10" placeholder="you@company.com"
                      value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                      required autoComplete="email" />
                  </div>
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type={showPassword ? 'text' : 'password'} className="input pl-10 pr-10"
                      placeholder="••••••••" value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading || !loginEmail || !loginPassword}
                  className="btn-primary w-full justify-center py-3 text-base mt-2">
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Signing In...</> : 'Sign In'}
                </button>

                <div className="text-center pt-1">
                  <p className="text-sm text-slate-400">
                    New client?{' '}
                    <button type="button" onClick={() => setTab('signup')}
                      className="text-primary-600 font-semibold hover:text-primary-700">
                      Create an account
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* SIGNUP Form */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 mb-2">
                  <strong>Corporate Clients:</strong> Create an account to track your rental requests and quotations.
                </div>
                <div>
                  <label className="label">Full Name *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" className="input pl-10" placeholder="John Smith"
                      value={signupName} onChange={e => setSignupName(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="label">Work Email *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" className="input pl-10" placeholder="john@company.com"
                      value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="label">Password *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type={showPassword ? 'text' : 'password'} className="input pl-10 pr-10"
                      placeholder="Min. 6 characters" value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)} required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm Password *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type={showPassword ? 'text' : 'password'} className="input pl-10"
                      placeholder="Repeat password" value={signupConfirm}
                      onChange={e => setSignupConfirm(e.target.value)} required />
                  </div>
                </div>
                <button type="submit"
                  disabled={loading || !signupName || !signupEmail || !signupPassword || !signupConfirm}
                  className="btn-primary w-full justify-center py-3 text-base">
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Creating Account...</> : 'Create Account'}
                </button>
                <div className="text-center pt-1">
                  <p className="text-sm text-slate-400">
                    Already have an account?{' '}
                    <button type="button" onClick={() => setTab('login')}
                      className="text-primary-600 font-semibold hover:text-primary-700">
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
        <div className="text-center mt-3">
          <Link to="/" className="text-white/40 hover:text-white/70 text-xs transition-colors">
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

