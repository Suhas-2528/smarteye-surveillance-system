import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Server, Wifi, CheckCircle2, AlertTriangle, RefreshCw, X, Save, Zap } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, checkServerConnection, DEFAULT_SERVER_URL, KNOWN_SERVER_HOSTS } from '../../api';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export default function ServerConfigModal({ isOpen, onClose, isDarkMode = true }: ServerConfigModalProps) {
  const [serverUrl, setServerUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setServerUrl(getApiBaseUrl() || DEFAULT_SERVER_URL);
      setStatus('idle');
      setStatusMessage('');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  const testConnectionTo = async (targetUrl: string) => {
    setStatus('testing');
    setStatusMessage(`Pinging ${targetUrl}...`);
    const result = await checkServerConnection(targetUrl);
    if (result.ok) {
      setStatus('success');
      setStatusMessage(`Connected successfully (${result.message})`);
    } else {
      setStatus('error');
      setStatusMessage(`Failed to reach server: ${result.message}`);
    }
  };

  const handleTestConnection = () => {
    testConnectionTo(serverUrl);
  };

  const handleSelectHost = (host: string) => {
    setServerUrl(host);
    testConnectionTo(host);
  };

  const handleSave = () => {
    setApiBaseUrl(serverUrl);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
      // Reload window so components re-initialize with new URL if needed
      window.location.reload();
    }, 1000);
  };

  const handleResetToAuto = () => {
    setApiBaseUrl('');
    setServerUrl(DEFAULT_SERVER_URL);
    setStatus('idle');
    setStatusMessage('Reset to default auto-detected host.');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
            isDarkMode ? 'bg-[#0b0f19] border-blue-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Backend Server Settings</h3>
                <p className="text-xs opacity-60">Live sync for Captured Images & YOLO Feeds</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Connect Options */}
          <div className="mt-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-blue-400 flex items-center gap-1.5">
              <Zap size={13} />
              Quick Connect (Detected Machine IPs)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {KNOWN_SERVER_HOSTS.map((host, idx) => (
                <button
                  key={host}
                  type="button"
                  onClick={() => handleSelectHost(host)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                    serverUrl === host
                      ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 font-bold'
                      : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{host}</span>
                  </div>
                  <span className="text-[10px] uppercase font-sans tracking-wide px-2 py-0.5 rounded-md bg-white/10 text-slate-400">
                    {idx === 0 ? 'Primary Wi-Fi' : 'Alternate'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                Custom Server Base URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => {
                    setServerUrl(e.target.value);
                    setStatus('idle');
                  }}
                  placeholder="http://192.168.1.6:3001"
                  className={`w-full px-4 py-3 rounded-xl font-mono text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode ? 'bg-white/5 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <p className="text-[11px] mt-2 opacity-70 leading-relaxed">
                💡 <span className="font-medium text-amber-300">Mobile Phone Sync:</span> Ensure your phone is connected to the same Wi-Fi network as the laptop.
              </p>
            </div>

            {/* Test Connection Result */}
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                  status === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : status === 'error'
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    : 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
                }`}
              >
                {status === 'testing' && <RefreshCw size={14} className="animate-spin" />}
                {status === 'success' && <CheckCircle2 size={14} />}
                {status === 'error' && <AlertTriangle size={14} />}
                <span>{statusMessage}</span>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={status === 'testing'}
                className="flex-1 py-3 px-4 rounded-xl border border-blue-500/40 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-blue-500/10 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Wifi size={16} />
                {status === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-98 transition-all cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 size={16} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save & Apply
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2 text-[11px] opacity-60">
              <span>Active: {getApiBaseUrl() || DEFAULT_SERVER_URL}</span>
              <button
                type="button"
                onClick={handleResetToAuto}
                className="underline hover:opacity-100 cursor-pointer"
              >
                Reset Default
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
