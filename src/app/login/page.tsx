'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { richHaptics } from '@/lib/utils/richHaptics'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!email || !password) return

    richHaptics.impact('light')
    setLoading(true)
    setErrorMsg('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        throw new Error(error.message || 'Invalid credentials')
      }

      richHaptics.success()
      router.push('/')
      router.refresh()
    } catch (err: any) {
      richHaptics.error()
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAccount = (demoEmail: string, demoPass: string = 'Darion@123') => {
    richHaptics.selection()
    setEmail(demoEmail)
    setPassword(demoPass)
    setErrorMsg('')
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#070a12] text-slate-100 overflow-hidden select-none">
      {/* 1. AMBIENT GLOWING MESH ORBS */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 2. FROSTED GLASS CONTAINER */}
      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-white/10 dark:border-slate-800/80 rounded-3xl p-6 sm:p-9 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* Brand Logo with Blue Glow */}
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0B57D0] to-blue-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 border border-white/15">
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-sans">
            Darion Chat
            <Sparkles className="w-5 h-5 text-blue-400" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xs font-medium">
            Real-time enterprise messaging, video meetings & team spaces
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium animate-in fade-in flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 ml-1">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/60 border border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-bold text-slate-300">Password</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-950/60 border border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  richHaptics.selection()
                  setShowPassword(!showPassword)
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-[#0B57D0] hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Quick Demo Accounts
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('candidate@darion.com')}
              className="px-2.5 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-[11px] font-semibold text-slate-300 hover:text-white transition-all text-left truncate cursor-pointer active:scale-95"
            >
              👤 Candidate Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('harsha@darion.com')}
              className="px-2.5 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-[11px] font-semibold text-slate-300 hover:text-white transition-all text-left truncate cursor-pointer active:scale-95"
            >
              👔 Harsha G
            </button>
          </div>
        </div>

        {/* Security & Cloud Badge */}
        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted with Darion Enterprise Cloud</span>
        </div>
      </div>
    </div>
  )
}
