import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  Camera, 
  Activity, 
  Database, 
  Terminal, 
  School, 
  Image as ImageIcon, 
  ChevronRight, 
  Radio, 
  Lock, 
  Cpu, 
  Layers,
  AlertTriangle,
  MessageSquare,
  Wifi,
  Server
} from 'lucide-react';
import { AppPortal } from '../types';
import { apiFetch } from '../api';
import ServerConfigModal from './mobile/ServerConfigModal';

interface AppSelectorProps {
  onSelectPortal: (portal: AppPortal) => void;
}

export default function AppSelector({ onSelectPortal }: AppSelectorProps) {
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; mode: string }>({
    connected: false,
    mode: 'Connecting...'
  });
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  useEffect(() => {
    apiFetch('/api/db-status')
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(() => setDbStatus({ connected: false, mode: 'Standalone Mode' }));
  }, []);

  return (
    <div className="min-h-screen bg-[#05070c] text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans select-none">
      {/* Background Ambience & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-[#05070c] to-[#030407] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370f_1px,transparent_1px),linear-gradient(to_bottom,#1f29370f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Floating Animated Orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1], x: [-20, 20, -20] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08], y: [-30, 30, -30] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"
      />

      {/* Header Bar */}
      <header className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/[0.07] pb-6">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-start select-none">
            <div className="flex items-start">
              <h1 className="text-3xl font-medium tracking-tight text-white lowercase">smarteye</h1>
              <svg width="30" height="30" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="-mt-2.5 -ml-1.5">
                <path d="M55 20 L85 30 L60 50 Z" fill="#F97316" />
                <path d="M48 45 L25 60 L55 65 Z" fill="#3B82F6" />
                <path d="M62 55 L85 85 L52 78 Z" fill="#4ADE80" />
              </svg>
            </div>
            <p className="text-[11px] font-light tracking-widest text-slate-400 lowercase -mt-1">ai camera</p>
          </div>
        </div>

        {/* System Health Indicators & Server Config */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsServerModalOpen(true)}
            className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-3.5 py-2 rounded-full text-xs text-blue-400 transition-all active:scale-95 cursor-pointer backdrop-blur-md"
            title="Configure Backend Server Host IP"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span className="font-semibold">Server IP</span>
          </button>

          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] px-4 py-2 rounded-full text-xs backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">{dbStatus.mode}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-blue-400 animate-pulse" /> 24 Feeds Live
            </span>
          </div>
        </div>
      </header>

      {/* Main Selection Body */}
      <main className="relative z-10 my-auto py-12 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
              Select Dedicated Application
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Our architecture provides two dedicated independent applications. Choose the application tailored for your role:
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Admin Infrastructure Application */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="relative group rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-amber-500/20 hover:border-amber-500/50 p-8 flex flex-col justify-between transition-all duration-300 shadow-2xl hover:shadow-amber-500/10 backdrop-blur-xl overflow-hidden"
          >
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />

            <div>
              {/* Badge & Icon */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  APPLICATION 1 • SYSTEM ADMIN
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                Admin Control & Infrastructure Portal
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Dedicated system control environment for IT administrators and security officers.
              </p>

              {/* Specific Functions Checklist */}
              <div className="space-y-3 mb-8">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80">Specific Functions:</p>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Camera Node Management</strong>: Add/remove nodes & RTSP settings</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Security & Audit Logs</strong>: Real-time IP logs & auth audit trail</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>User & Role Directory</strong>: Control faculty permissions & status</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Database & Health Monitor</strong>: MySQL latency, backup & stats</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Emergency Alert Dispatcher</strong>: Broadcast campus alarms</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => onSelectPortal('admin-auth')}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer group-hover:gap-3"
            >
              <span>Launch Admin Application</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Card 2: Faculty & User Application */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="relative group rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-blue-500/20 hover:border-blue-500/50 p-8 flex flex-col justify-between transition-all duration-300 shadow-2xl hover:shadow-blue-500/10 backdrop-blur-xl overflow-hidden"
          >
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />

            <div>
              {/* Badge & Icon */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <School className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  APPLICATION 2 • FACULTY & USERS
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                Faculty Surveillance & Workspace Portal
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Dedicated classroom monitoring and collaboration workspace for professors and faculty members.
              </p>

              {/* Specific Functions Checklist */}
              <div className="space-y-3 mb-8">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400/80">Specific Functions:</p>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4 text-blue-400 shrink-0" />
                    <span><strong>Classroom & Exam Live Feeds</strong>: CSE, Mech & 20 Exam Rooms</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                    <span><strong>Captured Images & Search</strong>: Search photos, HD view & downloads</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                    <span><strong>Incident Reporter</strong>: Submit classroom faults & alerts to Admin</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
                    <span><strong>Campus Faculty Chat</strong>: Real-time faculty collaboration channel</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => onSelectPortal('user-auth')}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer group-hover:gap-3"
            >
              <span>Launch Faculty Application</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </main>

      {/* Footer System Stats */}
      <footer className="relative z-10 border-t border-white/[0.07] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="flex items-center gap-4">
          <span>SmartEye Architecture v2.4</span>
          <span>•</span>
          <span>Dual Independent Apps</span>
          <span>•</span>
          <span>Active Nodes: 24</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Terminal className="w-3.5 h-3.5" />
          <span>Evaluation Panel Demo Mode Ready</span>
        </div>
      </footer>

      {/* Backend Server Configuration Modal for Mobile */}
      <ServerConfigModal
        isOpen={isServerModalOpen}
        onClose={() => {
          setIsServerModalOpen(false);
          apiFetch('/api/db-status')
            .then(res => res.json())
            .then(data => setDbStatus(data))
            .catch(() => setDbStatus({ connected: false, mode: 'Standalone Mode' }));
        }}
        isDarkMode={true}
      />
    </div>
  );
}
