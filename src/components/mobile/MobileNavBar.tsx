import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  MonitorPlay, 
  ShieldAlert, 
  Image as ImageIcon, 
  Bookmark, 
  Menu
} from 'lucide-react';
import { MobileTab } from '../../types';

interface MobileNavBarProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  onOpenDrawer: () => void;
  alertCount?: number;
  isDarkMode?: boolean;
}

export default function MobileNavBar({
  activeTab,
  onSelectTab,
  onOpenDrawer,
  alertCount = 0,
  isDarkMode = true,
}: MobileNavBarProps) {
  const navItems = [
    { id: 'dashboard' as MobileTab, label: 'Home', icon: LayoutDashboard },
    { id: 'live' as MobileTab, label: 'Live', icon: MonitorPlay },
    { id: 'alerts' as MobileTab, label: 'Alerts', icon: ShieldAlert, badge: alertCount },
    { id: 'captured' as MobileTab, label: 'Captured', icon: ImageIcon },
    { id: 'saved' as MobileTab, label: 'Saved', icon: Bookmark },
  ];

  const isMoreActive = ['search', 'profile', 'settings', 'chat', 'incident'].includes(activeTab);

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t backdrop-blur-xl transition-colors ${
        isDarkMode 
          ? 'bg-[#090d16]/95 border-blue-500/20 text-slate-300' 
          : 'bg-white/95 border-slate-200 text-slate-600 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]'
      }`}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all active:scale-95 group focus:outline-none"
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={`transition-all duration-200 ${
                    isActive
                      ? isDarkMode ? 'text-blue-400 scale-110' : 'text-blue-600 scale-110'
                      : 'opacity-70 group-hover:opacity-100'
                  }`}
                />
                
                {/* Badge for Alerts */}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-md animate-pulse">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </div>

              <span
                className={`text-[10px] mt-1 font-medium transition-colors ${
                  isActive
                    ? isDarkMode ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold'
                    : 'opacity-70'
                }`}
              >
                {item.label}
              </span>

              {/* Active Indicator Bar */}
              {isActive && (
                <motion.div
                  layoutId="mobileActiveIndicator"
                  className={`absolute -bottom-1 w-6 h-1 rounded-full ${
                    isDarkMode ? 'bg-blue-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'bg-blue-600'
                  }`}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}

        {/* More / Menu Button */}
        <button
          onClick={onOpenDrawer}
          className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all active:scale-95 group focus:outline-none"
        >
          <Menu
            size={20}
            className={`transition-all duration-200 ${
              isMoreActive
                ? isDarkMode ? 'text-blue-400 scale-110' : 'text-blue-600 scale-110'
                : 'opacity-70 group-hover:opacity-100'
            }`}
          />
          <span
            className={`text-[10px] mt-1 font-medium ${
              isMoreActive
                ? isDarkMode ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold'
                : 'opacity-70'
            }`}
          >
            More
          </span>
          {isMoreActive && (
            <motion.div
              layoutId="mobileActiveIndicator"
              className={`absolute -bottom-1 w-6 h-1 rounded-full ${
                isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
              }`}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
        </button>
      </div>
    </nav>
  );
}
