import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ArrowLeft, Lock, Key, AlertCircle, CheckCircle2, ChevronRight, Server, Wifi } from 'lucide-react';
import ServerConfigModal from '../mobile/ServerConfigModal';
import { checkServerConnection } from '../../api';

interface AdminLoginProps {
  onLogin: (name: string, uid?: string) => void;
  onBack: () => void;
}

export default function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('1234');
  const [passcode, setPasscode] = useState('9876');
  const [require2FA, setRequire2FA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  useEffect(() => {
    checkServerConnection().then(res => setServerOk(res.ok));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    setTimeout(() => {
      if ((username === 'admin' || username === 'admin@smarteye.local') && password === '1234') {
        if (require2FA && passcode !== '9876') {
          setError('Invalid 2FA Security Token. Use default: 9876');
          setIsProcessing(false);
          return;
        }
        onLogin('System Administrator', 'admin-master-001');
      } else {
        setError('Invalid Administrator Credentials. Demo: admin / 1234');
        setIsProcessing(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Top Navigation & Server Status */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Application Hub</span>
          </button>

          <button
            onClick={() => setIsServerModalOpen(true)}
            title="Configure Backend Server IP"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-amber-500/40 text-[11px] text-slate-300 transition-all active:scale-95 cursor-pointer"
          >
            <span className={`w-2 h-2 rounded-full ${serverOk === true ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{serverOk === true ? 'Server Live' : 'Setup IP'}</span>
          </button>
        </div>

        <div className="rounded-3xl bg-[#0e121b]/90 border border-amber-500/30 p-8 shadow-[0_0_50px_-10px_rgba(245,158,11,0.15)] backdrop-blur-xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex flex-col items-center mb-3 select-none">
              <div className="flex items-start">
                <h1 className="text-3xl font-medium tracking-tight text-white lowercase">smarteye</h1>
                <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="-mt-2.5 -ml-1.5">
                  <path d="M55 20 L85 30 L60 50 Z" fill="#F97316" />
                  <path d="M48 45 L25 60 L55 65 Z" fill="#3B82F6" />
                  <path d="M62 55 L85 85 L52 78 Z" fill="#4ADE80" />
                </svg>
              </div>
              <p className="text-[11px] font-light tracking-widest text-slate-400 lowercase -mt-1">ai camera</p>
            </div>
            <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-amber-400 mb-1 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              SECURE ADMIN GATEWAY
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Admin Infrastructure Control
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Authorized personnel only. System operations are audited.
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-400 font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Admin Username / Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all text-sm"
                />
                <Server className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all text-sm"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2FA Toggle for High Security Demo */}
            <div className="pt-2 border-t border-white/[0.05]">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Enable Hardware 2FA Token
                </span>
                <button
                  type="button"
                  onClick={() => setRequire2FA(!require2FA)}
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 ${require2FA ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${require2FA ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {require2FA && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-1"
                >
                  <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    2FA Security Passcode (Demo: 9876)
                  </label>
                  <input
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="9876"
                    className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 text-amber-300 font-mono text-sm focus:outline-none"
                  />
                </motion.div>
              )}
            </div>

            {/* Quick Demo Credentials Badge */}
            <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-300/90 flex items-center justify-between">
              <span>Demo Quick Login: <strong>admin</strong> / <strong>1234</strong></span>
              <button
                type="button"
                onClick={() => { setUsername('admin'); setPassword('1234'); }}
                className="text-amber-400 font-bold underline hover:text-amber-300 cursor-pointer"
              >
                Auto-fill
              </button>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 mt-4"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Verifying Master Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate as System Admin</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Backend Server Configuration Modal */}
      <ServerConfigModal
        isOpen={isServerModalOpen}
        onClose={() => {
          setIsServerModalOpen(false);
          checkServerConnection().then(res => setServerOk(res.ok));
        }}
        isDarkMode={true}
      />
    </div>
  );
}
