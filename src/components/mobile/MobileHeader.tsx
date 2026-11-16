import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Sun, 
  Moon, 
  Server, 
  Wifi, 
  ShieldAlert,
  Search,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { checkServerConnection, getApiBaseUrl } from '../../api';

interface MobileHeaderProps {
  onOpenDrawer: () => void;
  onOpenServerConfig: () => void;
  onOpenSearch: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  alertCount?: number;
  onSwitchPortal?: () => void;
}

export default function MobileHeader({
  onOpenDrawer,
  onOpenServerConfig,
  onOpenSearch,
  isDarkMode,
  onToggleTheme,
  alertCount = 0,
  onSwitchPortal,
}: MobileHeaderProps) {
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const test = async () => {
      const res = await checkServerConnection();
      if (isMounted) setServerOk(res.ok);
    };
    test();
    const interval = setInterval(test, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 md:hidden px-4 py-3 border-b backdrop-blur-xl transition-colors ${
        isDarkMode
          ? 'bg-[#080c16]/90 border-blue-500/20 text-slate-100'
          : 'bg-white/90 border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {/* Left: Menu & Brand */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDrawer}
            aria-label="Open Navigation Menu"
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              isDarkMode
                ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}
          >
            <Menu size={19} />
          </button>

          <div className="flex items-center gap-2 select-none">
            <img 
              src={isDarkMode ? "/logo-icon-light.png" : "/logo-icon-transparent.png"} 
              alt="SmartEye Logo" 
              className="w-7 h-7 object-contain drop-shadow-sm" 
            />
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <span className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Smart<span className="text-teal-500">Eye</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  AI
                </span>
              </div>
              <span className="text-[8px] tracking-wider uppercase opacity-60 font-semibold -mt-0.5">
                Faculty Surveillance
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Server status, Search, Theme) */}
        <div className="flex items-center gap-2">
          {/* Server Connection Pill */}
          <button
            onClick={onOpenServerConfig}
            title="Backend Connection Status - Tap to Configure"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-medium transition-all active:scale-95 ${
              serverOk === true
                ? isDarkMode
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : serverOk === false
                ? isDarkMode
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                  : 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                serverOk === true
                  ? 'bg-emerald-400'
                  : serverOk === false
                  ? 'bg-rose-500'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="hidden xs:inline">
              {serverOk === true ? 'Live' : serverOk === false ? 'Offline' : '...'}
            </span>
          </button>

          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            aria-label="Search Cameras"
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              isDarkMode
                ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}
          >
            <Search size={18} />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              isDarkMode
                ? 'border-white/10 bg-white/5 text-amber-400 hover:bg-white/10'
                : 'border-slate-200 bg-slate-100 text-indigo-600'
            }`}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Quick Admin Portal Switch Button */}
          {onSwitchPortal && (
            <button
              onClick={onSwitchPortal}
              title="Switch to Admin Control Portal"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all active:scale-95 ${
                isDarkMode
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
            >
              <ShieldCheck size={14} className="text-amber-400" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
