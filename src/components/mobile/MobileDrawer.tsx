import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LayoutDashboard, 
  MonitorPlay, 
  ShieldAlert, 
  Image as ImageIcon, 
  Bookmark, 
  Search, 
  User, 
  Settings, 
  MessageSquare, 
  AlertCircle, 
  Server, 
  Sun, 
  Moon, 
  LogOut, 
  ArrowLeftRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { MobileTab } from '../../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  facultyName: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenServerConfig: () => void;
  onLogout: () => void;
  onSwitchPortal: () => void;
  alertCount?: number;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  facultyName,
  isDarkMode,
  onToggleTheme,
  onOpenServerConfig,
  onLogout,
  onSwitchPortal,
  alertCount = 0,
}: MobileDrawerProps) {
  const menuSections = [
    {
      title: 'Main Navigation',
      items: [
        { id: 'dashboard' as MobileTab, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'live' as MobileTab, label: 'Live Monitoring', icon: MonitorPlay },
        { id: 'alerts' as MobileTab, label: 'Alerts & Incidents', icon: ShieldAlert, badge: alertCount },
        { id: 'captured' as MobileTab, label: 'Captured Images', icon: ImageIcon },
        { id: 'saved' as MobileTab, label: 'Saved Images', icon: Bookmark },
        { id: 'search' as MobileTab, label: 'Search Cameras', icon: Search },
      ]
    },
    {
      title: 'Tools & Intelligence',
      items: [
        { id: 'chat' as MobileTab, label: 'AI Surveillance Assistant', icon: MessageSquare },
        { id: 'incident' as MobileTab, label: 'Report Incident', icon: AlertCircle },
      ]
    },
    {
      title: 'Account & Settings',
      items: [
        { id: 'profile' as MobileTab, label: 'Faculty Profile', icon: User },
        { id: 'settings' as MobileTab, label: 'System Settings', icon: Settings },
      ]
    }
  ];

  const handleItemClick = (tab: MobileTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`relative z-10 w-[85%] max-w-xs h-full flex flex-col justify-between shadow-2xl border-r ${
              isDarkMode 
                ? 'bg-[#0a0e18] border-blue-500/20 text-slate-100' 
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Top User & Brand Section */}
            <div>
              <div className={`p-5 border-b ${isDarkMode ? 'border-white/10 bg-[#060912]' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={isDarkMode ? "/logo-icon-light.png" : "/logo-icon-transparent.png"} 
                      alt="SmartEye" 
                      className="w-8 h-8 object-contain drop-shadow" 
                    />
                    <div>
                      <h2 className="text-base font-bold tracking-tight">
                        Smart<span className="text-teal-400">Eye</span>
                      </h2>
                      <p className="text-[10px] text-teal-400 uppercase tracking-wider font-semibold">Mobile Edition</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* User Card */}
                <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {facultyName ? facultyName.charAt(0).toUpperCase() : 'F'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate">{facultyName || 'Faculty Member'}</p>
                    <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      Online Faculty
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu List */}
              <div className="p-3 overflow-y-auto max-h-[calc(100vh-280px)] space-y-4">
                {/* Switch to Admin Infrastructure Portal Banner */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <ShieldCheck size={14} />
                      </div>
                      <span className="text-xs font-bold text-amber-300">Admin Control Portal</span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      APP 1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300/80 mb-2 leading-relaxed">
                    Camera Nodes, User Controls, Audit Logs & Database Health are located in the Admin Portal.
                  </p>
                  <button
                    onClick={() => {
                      onSwitchPortal();
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Launch Admin System</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {menuSections.map((section, idx) => (
                  <div key={idx}>
                    <p className="text-[10px] font-bold uppercase tracking-wider px-3 mb-1.5 opacity-50">
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const isActive = activeTab === item.id;
                        const Icon = item.icon;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleItemClick(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                              isActive
                                ? isDarkMode
                                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                                  : 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                                : isDarkMode
                                ? 'text-slate-300 hover:bg-white/5'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={18} className={isActive ? 'text-white' : 'opacity-70'} />
                              <span>{item.label}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {item.badge && item.badge > 0 ? (
                                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                  {item.badge}
                                </span>
                              ) : null}
                              <ChevronRight size={14} className="opacity-40" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Server IP Config Shortcut */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider px-3 mb-1.5 opacity-50">
                    Network
                  </p>
                  <button
                    onClick={() => {
                      onOpenServerConfig();
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      isDarkMode ? 'text-cyan-400 hover:bg-cyan-500/10' : 'text-cyan-700 hover:bg-cyan-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Server size={18} />
                      <span>Server IP Setup</span>
                    </div>
                    <ChevronRight size={14} className="opacity-40" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Theme & Logout */}
            <div className={`p-4 border-t space-y-2 ${isDarkMode ? 'border-white/10 bg-[#060912]' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <button
                  onClick={onToggleTheme}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium border ${
                    isDarkMode 
                      ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' 
                      : 'border-slate-200 bg-white text-slate-700 shadow-sm'
                  }`}
                >
                  {isDarkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                
                <button
                  onClick={onSwitchPortal}
                  title="Switch to Portal Selector"
                  className={`ml-2 p-2 rounded-xl border ${
                    isDarkMode ? 'border-white/10 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowLeftRight size={16} />
                </button>
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 active:scale-98 transition-all"
              >
                <LogOut size={16} />
                <span>Logout Faculty</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
