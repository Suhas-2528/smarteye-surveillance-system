import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, Bell, Settings, LogOut, Search, Bookmark, Download, Check, Upload, X, Eye, EyeOff,
  Camera, ShieldAlert, MonitorPlay, Users, CheckCircle, Sun, Moon, Link, Image, School, BookOpen,
  Mail, Phone, MapPin, BadgeInfo, ChevronDown, ChevronRight, Globe, Save, Database, ShieldCheck, Sliders, RefreshCw, HardDrive, Shield, Plus, Trash2, Volume2, BellRing, ArrowLeft,
  Radio, Zap, MessageSquare
} from 'lucide-react';
import { UserRole } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import Chat from './Chat';
import { getImageUrl } from '../api';

function SidebarMenuNode({ item, activeTab, setActiveTab, expandedItems, toggleExpand, isDarkMode, level = 0 }: any) {
  const isExpanded = expandedItems[item.id] || false;
  const hasSubItems = item.subItems && item.subItems.length > 0;

  return (
    <div className="w-full">
      <button
        onClick={(e) => {
          if (hasSubItems) {
            toggleExpand(item.id, e);
          } else {
            setActiveTab(item.id);
          }
        }}
        style={{ paddingLeft: `${1 + level * 1.5}rem` }}
        className={`w-full flex items-center justify-between py-2.5 pr-4 rounded-xl transition-all group ${(!hasSubItems && activeTab === item.id)
          ? (isDarkMode ? 'bg-blue-500/20 text-blue-400 font-bold' : 'bg-white text-[#004f87] font-bold')
          : (isDarkMode ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-blue-100 hover:text-white hover:bg-white/10')
          } ${hasSubItems && level === 0 ? 'font-semibold text-[14px]' : 'text-[13px]'}`}
      >
        <div className="flex items-center gap-3">
          {item.icon && <item.icon size={level === 0 ? 20 : 16} className={activeTab === item.id ? '' : 'opacity-70'} />}
          {!item.icon && level > 0 && <div className="w-1.5 h-1.5 rounded-full border border-current opacity-50" />}
          <span className="text-left">{item.label}</span>
        </div>
        {hasSubItems && (
          <div className="opacity-50">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}
      </button>

      {hasSubItems && (
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden flex flex-col gap-0.5 mt-0.5"
            >
              {item.subItems.map((subItem: any) => (
                <SidebarMenuNode
                  key={subItem.id}
                  item={subItem}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  expandedItems={expandedItems}
                  toggleExpand={toggleExpand}
                  isDarkMode={isDarkMode}
                  level={level + 1}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function SystemSettingsComponent({ isDarkMode }: { isDarkMode: boolean }) {
  const inputClassName = `w-full bg-white/[0.03] border ${isDarkMode ? 'border-white/[0.08]' : 'border-slate-300'} rounded-xl px-4 py-3 ${isDarkMode ? 'text-white' : 'text-slate-900'} focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all`;
  const labelClassName = `block text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} uppercase tracking-wider mb-1.5`;
  const sectionClassName = `p-6 rounded-2xl border ${isDarkMode ? 'glass-dark border-white/5' : 'bg-white border-slate-200 shadow-sm'} space-y-6 flex flex-col justify-between`;
  const sectionTitleClassName = `text-lg font-bold flex items-center gap-2 mb-4 pb-4 border-b ${isDarkMode ? 'border-white/5 text-white' : 'border-slate-100 text-slate-800'}`;
  const toggleClassName = `w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors`;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full pt-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>System Settings</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Configure your infrastructure, security, and global parameters.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 w-fit">
          <Save size={18} />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. General Settings */}
        <div className={sectionClassName}>
          <div className="space-y-6">
            <div className={sectionTitleClassName}>
              <Globe size={20} className="text-blue-500" />
              General Settings
            </div>
            <div>
              <label className={labelClassName}>System Name</label>
              <input type="text" defaultValue="SmartEye Core System" className={inputClassName} />
            </div>
            <div>
              <label className={labelClassName}>Language Selection</label>
              <select className={inputClassName}>
                <option>English</option>
                <option>French</option>
                <option>Spanish</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Theme Mode</p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dark or light interface</p>
            </div>
            <div className={`${toggleClassName} bg-blue-500 justify-end`}>
              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>

        {/* 2. Camera Settings */}
        <div className={sectionClassName}>
          <div className="space-y-6">
            <div className={sectionTitleClassName}>
              <Camera size={20} className="text-purple-500" />
              Camera Settings
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClassName}>Connected Cameras</label>
                <button className={`text-xs font-bold text-blue-500 flex items-center gap-1 hover:text-blue-400 transition-colors`}>
                  <Plus size={14} /> Add new
                </button>
              </div>
              <div className={`p-3 rounded-xl border ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'} space-y-3 max-h-[120px] overflow-y-auto`}>
                <div className="flex justify-between items-center text-sm"><span className="text-emerald-500 font-medium">🟢 Cam 01 (Lobby)</span><button aria-label="Remove Camera"><Trash2 size={16} className="text-slate-500 hover:text-rose-500 transition-colors cursor-pointer" /></button></div>
                <div className="flex justify-between items-center text-sm"><span className="text-emerald-500 font-medium">🟢 Cam 02 (CS-101)</span><button aria-label="Remove Camera"><Trash2 size={16} className="text-slate-500 hover:text-rose-500 transition-colors cursor-pointer" /></button></div>
              </div>
            </div>
            <div>
              <label className={labelClassName}>Default Resolution</label>
              <select className={inputClassName}>
                <option>720p</option>
                <option selected>1080p</option>
                <option>4K</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Live Streaming</p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Enable network-wide stream broadcast</p>
            </div>
            <div className={`${toggleClassName} bg-blue-500 justify-end`}>
              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>

        {/* 3. Notifications */}
        <div className={sectionClassName}>
          <div className="space-y-6">
            <div className={sectionTitleClassName}>
              <BellRing size={20} className="text-amber-500" />
              Notifications
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Email Alerts</p>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Receive critical alerts via email</p>
              </div>
              <div className={`${toggleClassName} bg-emerald-500 justify-end`}>
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>SMS Alerts</p>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Receive alerts directly on phone</p>
              </div>
              <div className={`${toggleClassName} ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'} justify-start`}>
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <div className="flex gap-3">
              <Volume2 className="text-slate-400 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Sound Alerts</p>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Play audio chime on new event</p>
              </div>
            </div>
            <div className={`${toggleClassName} bg-blue-500 justify-end flex-shrink-0`}>
              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>

        {/* 4. Security Settings */}
        <div className={sectionClassName}>
          <div className="space-y-6">
            <div className={sectionTitleClassName}>
              <ShieldCheck size={20} className="text-rose-500" />
              Security Settings
            </div>
            <div className="space-y-3">
              <label className={labelClassName}>Change Admin Password</label>
              <input type="password" placeholder="Current Password" className={inputClassName} />
              <input type="password" placeholder="New Password" className={inputClassName} />
            </div>
            <div>
              <label className={labelClassName}>Alert Sensitivity</label>
              <select className={inputClassName}>
                <option>Low (Major events only)</option>
                <option selected>Medium (Standard)</option>
                <option>High (All movements)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className={`font-semibold tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Two-Factor Auth</p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Require 2FA for admin login</p>
            </div>
            <div className={`${toggleClassName} bg-emerald-500 justify-end flex-shrink-0`}>
              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>

        {/* 5. Storage Settings */}
        <div className={sectionClassName}>
          <div className="space-y-6">
            <div className={sectionTitleClassName}>
              <Database size={20} className="text-indigo-500" />
              Storage Settings
            </div>
            <div>
              <label className={labelClassName}>Storage Destination</label>
              <select className={inputClassName}>
                <option>Local Network Attached Storage (NAS)</option>
                <option>Cloud Storage (AWS S3)</option>
                <option>Hybrid (Local + Cloud Backup)</option>
              </select>
            </div>
            <div>
              <label className={labelClassName}>Auto-Delete Footage Schedule</label>
              <select className={inputClassName}>
                <option>Every 7 Days</option>
                <option selected>Every 30 Days</option>
                <option>Every 90 Days</option>
                <option>Never Delete (Warning: Requires max storage space)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 6. System Controls */}
        <div className={sectionClassName}>
          <div className="space-y-6">
            <div className={sectionTitleClassName}>
              <Sliders size={20} className="text-teal-500" />
              System Controls
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button className={`p-4 rounded-xl border flex flex-col gap-3 items-center justify-center transition-colors group ${isDarkMode ? 'border-white/10 hover:bg-white/5 bg-white/[0.02]' : 'border-slate-200 hover:bg-slate-50 bg-white'}`}>
                <RefreshCw size={24} className="text-blue-500 group-hover:rotate-180 transition-transform duration-500" />
                <span className={`text-sm font-semibold mt-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Restart System</span>
              </button>
              <button className={`p-4 rounded-xl border flex flex-col gap-3 items-center justify-center transition-colors group ${isDarkMode ? 'border-white/10 hover:bg-white/5 bg-white/[0.02]' : 'border-slate-200 hover:bg-slate-50 bg-white'}`}>
                <HardDrive size={24} className="text-emerald-500 group-hover:-translate-y-1 transition-transform duration-300" />
                <span className={`text-sm font-semibold mt-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Backup Data</span>
              </button>
              <button className={`p-4 rounded-xl border flex flex-col gap-3 items-center justify-center transition-colors group sm:col-span-2 ${isDarkMode ? 'border-white/10 hover:bg-rose-500/10 bg-white/[0.02]' : 'border-slate-200 hover:bg-rose-50 bg-white'}`}>
                <Shield size={24} className="text-rose-500 group-hover:scale-110 transition-transform duration-300" />
                <span className={`text-sm font-semibold mt-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Restore Factory Defaults</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function CameraFeedView({ activeTab, isDarkMode, onCapture }: { activeTab: string; isDarkMode: boolean; onCapture?: () => void }) {
  const [isNightVision, setIsNightVision] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [resolution, setResolution] = useState('1080p Full HD');
  const [capturedNotice, setCapturedNotice] = useState(false);
  const [timeString, setTimeString] = useState(new Date().toLocaleString());

  React.useEffect(() => {
    const timer = setInterval(() => setTimeString(new Date().toLocaleString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTakeSnapshot = () => {
    setCapturedNotice(true);
    if (onCapture) onCapture();
    setTimeout(() => setCapturedNotice(false), 2500);
  };

  const camName = activeTab.replace(/[-_]/g, ' ').toUpperCase();

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full pt-2 w-full animate-in fade-in duration-300">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{camName} STREAM</h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              HARDWARE CONNECTED
            </span>
          </div>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>IP: 192.168.1.104 • 30 FPS • Bitrate 4.2 Mbps</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsNightVision(!isNightVision)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
              isNightVision 
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20' 
                : isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}
          >
            <Zap size={14} />
            {isNightVision ? 'Night Vision ON' : 'Night Vision OFF'}
          </button>

          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
              isRecording 
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-lg shadow-rose-500/20' 
                : isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}
          >
            <Radio size={14} />
            {isRecording ? 'RECORDING...' : 'Start Record'}
          </button>

          <button
            onClick={handleTakeSnapshot}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <Camera size={14} />
            Take Snapshot
          </button>
        </div>
      </div>

      {/* Snapshot Toast Notice */}
      <AnimatePresence>
        {capturedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} /> Snapshot captured and saved to Captured Pictures!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Feed Screen Frame */}
      <div className={`relative aspect-video w-full max-h-[520px] rounded-2xl overflow-hidden border shadow-2xl transition-all ${
        isNightVision ? 'bg-emerald-950/90 border-emerald-500/50' : 'bg-slate-950 border-white/10'
      }`}>
        {/* HUD Corner Brackets */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-400/80 pointer-events-none z-20" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-emerald-400/80 pointer-events-none z-20" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-emerald-400/80 pointer-events-none z-20" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-400/80 pointer-events-none z-20" />

        {/* Video Background / Stream Simulation Canvas */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${
          isNightVision ? 'contrast-125 saturate-50 bg-emerald-950/80' : 'bg-gradient-to-br from-slate-900 via-black to-slate-950'
        }`}>
          {/* Scanning Grid Overlay */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Dynamic Motion Box Overlay */}
          <motion.div
            animate={{ scale: [1, 1.02, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-[28%] left-[35%] w-[30%] h-[40%] border-2 border-emerald-400 rounded-lg bg-emerald-500/10 pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
          >
            <div className="flex justify-between items-center bg-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300 font-bold">
              <span>AI DETECTED TARGET</span>
              <span>98.4% CONF</span>
            </div>
            <div className="text-[9px] font-mono text-emerald-400 bg-black/60 px-1.5 py-0.5 rounded w-fit">
              ID: ROOM_FEED_ACTIVE
            </div>
          </motion.div>

          <Camera size={72} className={`mb-3 opacity-30 ${isNightVision ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">AI OPTICAL CAMERA HARDWARE LINK STANDBY</p>
        </div>

        {/* Top Video HUD Info */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30 pointer-events-none">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-black/60 border border-white/10 text-rose-500 font-mono text-xs font-bold flex items-center gap-2 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              LIVE
            </span>
            <span className="px-2.5 py-1 rounded bg-black/60 border border-white/10 text-white font-mono text-xs font-bold backdrop-blur-md">
              {camName}
            </span>
          </div>

          <div className="px-3 py-1 rounded bg-black/60 border border-white/10 text-emerald-400 font-mono text-xs font-bold backdrop-blur-md">
            {timeString}
          </div>
        </div>

        {/* Bottom Video Controls HUD */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-30 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-black/60 border border-white/10 text-slate-300 font-mono text-[11px]">
              RES: {resolution}
            </span>
            <span className="px-2.5 py-1 rounded bg-black/60 border border-white/10 text-slate-300 font-mono text-[11px]">
              CODEC: H.265 AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsCenterView({ isDarkMode }: { isDarkMode: boolean }) {
  const [alerts, setAlerts] = useState([
    { id: '1', title: 'Unidentified Object Detected: Room 101', dept: 'Computer Science', time: 'Just now', severity: 'Critical', resolved: false },
    { id: '2', title: 'Camera 04 Connectivity Alert: Exam Hall A', dept: 'Exam Center', time: '5 mins ago', severity: 'Warning', resolved: false },
    { id: '3', title: 'Motion After Hours: Room 202', dept: 'Mechanical Eng.', time: '22 mins ago', severity: 'Warning', resolved: true },
    { id: '4', title: 'Routine AI System Integrity Check Passed', dept: 'Main Core', time: '1 hour ago', severity: 'Info', resolved: true },
  ]);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('all');

  const toggleResolve = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: !a.resolved } : a));
  };

  const filteredAlerts = alerts.filter(a => filter === 'unresolved' ? !a.resolved : true);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full pt-2 w-full animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Security Alerts Center</h2>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Real-time automated incident detection and response logs.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilter(filter === 'all' ? 'unresolved' : 'all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
              filter === 'unresolved' 
                ? 'bg-amber-500 text-black border-amber-400' 
                : isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}
          >
            {filter === 'unresolved' ? 'Showing Unresolved Only' : 'Show All Alerts'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.map(alert => (
          <div
            key={alert.id}
            className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all ${
              alert.resolved
                ? isDarkMode ? 'bg-white/[0.02] border-white/5 opacity-60' : 'bg-slate-50 border-slate-200 opacity-70'
                : isDarkMode ? 'glass-dark border-rose-500/30 shadow-lg shadow-rose-900/10' : 'bg-white border-rose-200 shadow-md'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                alert.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400' :
                alert.severity === 'Warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                <ShieldAlert size={24} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{alert.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    alert.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400' :
                    alert.severity === 'Warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{alert.dept} • {alert.time}</p>
              </div>
            </div>

            <button
              onClick={() => toggleResolve(alert.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                alert.resolved
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-white text-black hover:bg-slate-200 border-white'
              }`}
            >
              {alert.resolved ? '✓ Resolved' : 'Mark as Resolved'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DashboardProps {
  role: UserRole;
  name: string;
  onLogout: () => void;
}

const mockAlerts = [
  { id: '1', title: 'Motion Detected: Classroom 204', date: 'Just now' },
  { id: '2', title: 'Camera 04 Offline: Exam Hall A', date: '2 mins ago' },
  { id: '3', title: 'Unauthorized Access: Classroom 101', date: '15 mins ago' }
];

const credentialsList = [
  {
    title: 'Online Classes - Teams Credentials:',
    items: [
      'Username: FACULTY@university.onmicrosoft.com',
      'Password: ••••••••'
    ]
  },
  {
    title: 'Internet Captive Portal:',
    items: [
      'Username: FACULTY-ID',
      'Password: ••••••••'
    ]
  },
  {
    title: 'MRD Block Wifi SSID Credentials:',
    items: [
      'Username: SECURE-WIFI',
      'Password: ••••••••'
    ]
  }
];

const roleConfig = {
  Faculty: {
    theme: 'from-blue-600 to-indigo-600',
    accent: 'text-blue-400',
    bgAccent: 'bg-blue-400/10',
    borderAccent: 'border-blue-500/20',
    sidebar: [
      { id: 'dashboard', icon: Home, label: 'Home' },
      { id: 'cameras', icon: MonitorPlay, label: 'Live Feeds' },
      { id: 'alerts', icon: ShieldAlert, label: 'Alerts' },
      { id: 'photos', icon: Image, label: 'Captured Pictures' },
      { id: 'chat', icon: MessageSquare, label: 'Campus Chat' },
      { id: 'classrooms', icon: School, label: 'Class Rooms' },
      { id: 'examhalls', icon: BookOpen, label: 'Exam Halls' },
      { id: 'settings', icon: Settings, label: 'Settings' }
    ],
    welcome: 'Faculty Portal',
    description: 'Access campus surveillance feeds, your portal credentials, and recent announcements.'
  },
  Admin: {
    theme: 'from-slate-700 to-slate-900',
    accent: 'text-amber-400',
    bgAccent: 'bg-amber-400/10',
    borderAccent: 'border-amber-500/20',
    sidebar: [
      { id: 'dashboard', icon: Home, label: 'System Home' },
      {
        id: 'live-camera',
        icon: Camera,
        label: 'Live Camera',
        subItems: [
          {
            id: 'classrooms-section',
            label: 'Classrooms',
            subItems: [
              {
                id: 'dept-cse',
                label: 'Computer Science',
                subItems: [
                  { id: 'cse-room-101', label: 'Room 101' },
                  { id: 'cse-room-102', label: 'Room 102' },
                  { id: 'cse-room-103', label: 'Room 103' }
                ]
              },
              {
                id: 'dept-me',
                label: 'Mechanical Eng.',
                subItems: [
                  { id: 'me-room-201', label: 'Room 201' },
                  { id: 'me-room-202', label: 'Room 202' }
                ]
              }
            ]
          },
          {
            id: 'assessment',
            label: 'Assessment Center',
            subItems: Array.from({ length: 20 }, (_, i) => ({
              id: `assessment-room-${i + 1}`,
              label: `Room ${i + 1}`
            }))
          }
        ]
      },
      { id: 'captured-pictures', icon: Image, label: 'Captured Pictures' },
      { id: 'alerts', icon: ShieldAlert, label: 'Security Alerts' },
      { id: 'chat', icon: MessageSquare, label: 'System Chat' },
      { id: 'settings', icon: Settings, label: 'System Settings' }
    ],
    welcome: 'Infrastructure & System Control',
    description: 'Monitor global infrastructure health and active camera nodes.'
  }
};

const allCameras = [
  { id: 'cse-room-101', number: 'Room 101', dept: 'Computer Science', status: 'Online', parentIds: ['live-camera', 'classrooms-section', 'dept-cse'] },
  { id: 'cse-room-102', number: 'Room 102', dept: 'Computer Science', status: 'Online', parentIds: ['live-camera', 'classrooms-section', 'dept-cse'] },
  { id: 'cse-room-103', number: 'Room 103', dept: 'Computer Science', status: 'Offline', parentIds: ['live-camera', 'classrooms-section', 'dept-cse'] },
  { id: 'me-room-201', number: 'Room 201', dept: 'Mechanical Eng.', status: 'Online', parentIds: ['live-camera', 'classrooms-section', 'dept-me'] },
  { id: 'me-room-202', number: 'Room 202', dept: 'Mechanical Eng.', status: 'Offline', parentIds: ['live-camera', 'classrooms-section', 'dept-me'] },
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `assessment-room-${i + 1}`,
    number: `Room ${i + 1}`,
    dept: 'Assessment Center',
    status: (i === 4 || i === 11) ? 'Offline' : 'Online',
    parentIds: ['live-camera', 'assessment']
  }))
];

export default function Dashboard({ role, name, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mockPictures, setMockPictures] = useState<any[]>([]);

  React.useEffect(() => {
    const loadPictures = () => {
      fetch('/api/pictures')
        .then(res => res.json())
        .then(data => setMockPictures(data))
        .catch(err => console.error("Error fetching pictures:", err));
    };

    loadPictures();
    const interval = setInterval(loadPictures, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'surveillance_capture.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = filename || 'surveillance_capture.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const simulateCapture = async () => {
    try {
      const sampleImages = [
        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
      ];
      const resp = await fetch('/api/pictures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loc: 'Room ' + Math.floor(Math.random() * 500 + 1),
          dept: Math.random() > 0.5 ? 'Computer Science' : 'Mechanical Eng.',
          type: Math.random() > 0.5 ? 'Classroom' : 'Assessment Center',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          imageUrl: sampleImages[Math.floor(Math.random() * sampleImages.length)]
        })
      });
      const newPic = await resp.json();
      setMockPictures(prev => [newPic, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const [savedPictures, setSavedPictures] = useState<number[]>([]);
  const [pictureFilter, setPictureFilter] = useState<'all' | 'saved'>('all');
  const [pictureSearchQuery, setPictureSearchQuery] = useState('');
  const [pictureSortOrder, setPictureSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [pictureActivityFilter, setPictureActivityFilter] = useState<'all' | 'Classroom' | 'Assessment Center'>('all');
  const [selectedPictureForModal, setSelectedPictureForModal] = useState<any | null>(null);

  const toggleSavePicture = (id: number) => {
    setSavedPictures(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: name,
    email: name.toLowerCase().replace(' ', '.') + '@university.edu',
    phone: '+1 (555) 012-3456',
    password: 'securepassword123',
  });
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  
  const handleProfileSave = async () => {
    if (profileForm.name.trim().length < 2) {
      setProfileError('Name must be at least 2 characters');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      setProfileError('Invalid email format');
      return;
    }
    if (profileForm.password.length < 8) {
      setProfileError('Password must be at least 8 characters');
      return;
    }

    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone
        });
      }
    } catch (error) {
      console.error("Error updating profile", error);
      setProfileError('Failed to update profile to database');
      return;
    }

    setProfileError('');
    setProfileSuccessMessage('Profile updated successfully');
    
    setTimeout(() => {
      setProfileSuccessMessage('');
      setIsEditProfileOpen(false);
    }, 1500);
  };

  const filteredCameras = allCameras.filter(cam =>
    cam.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cam.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCamera = (cam: typeof allCameras[0]) => {
    setActiveTab(cam.id);
    const newExpanded = { ...expandedItems };
    cam.parentIds.forEach(pid => newExpanded[pid] = true);
    setExpandedItems(newExpanded);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const config = roleConfig[role];
  const sidebarItems = config.sidebar;

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-[#0a0a0c] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <aside className={`w-64 border-r flex flex-col ${isDarkMode ? 'glass-dark border-white/5' : 'bg-[#004f87] text-white border-[#004f87]'}`}>
        <div className="p-6 flex items-center justify-center border-b border-white/10 bg-white/5">
          <div className="flex flex-col items-center gap-0 text-center">
            <div className="flex items-start">
              <h1 className="text-3xl font-medium tracking-tight lowercase">smarteye</h1>
              <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="-mt-3 -ml-2">
                <path d="M55 20 L85 30 L60 50 Z" fill="#F97316" />
                <path d="M48 45 L25 60 L55 65 Z" fill="#3B82F6" />
                <path d="M62 55 L85 85 L52 78 Z" fill="#4ADE80" />
              </svg>
            </div>
            <p className="text-sm font-light tracking-widest lowercase -mt-1">ai camera</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {sidebarItems.map((item: any) => (
            <SidebarMenuNode
              key={item.id}
              item={item}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              isDarkMode={isDarkMode}
            />
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`h-20 border-b px-8 flex items-center justify-between z-20 ${isDarkMode ? 'glass-dark border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              onClick={() => {
                if (activeTab !== 'dashboard') {
                  setActiveTab('dashboard');
                } else {
                  onLogout();
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all group shrink-0 ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title={activeTab !== 'dashboard' ? "Back to Dashboard Home" : "Back to Landing Page"}
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>{activeTab !== 'dashboard' ? 'Back' : 'Back'}</span>
            </button>

            <div className="relative w-full group">
              <Search className={`absolute left-4 top-1/2 hover:cursor-pointer -translate-y-1/2 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search classrooms, exam halls..."
                className={`w-full pl-12 pr-4 py-2.5 rounded-xl border focus:outline-none transition-all duration-300 shadow-sm ${isDarkMode
                    ? 'bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/5'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white'
                  }`}
              />
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                <span className="text-[10px]">Ctrl</span> K
              </div>

              <AnimatePresence>
                {isSearchFocused && searchQuery.trim() !== '' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-xl z-50 overflow-hidden ${isDarkMode ? 'glass-dark border-white/10' : 'bg-white border-slate-200'}`}
                  >
                    <div className="max-h-80 overflow-y-auto p-2" style={{ scrollbarWidth: 'thin' }}>
                      {filteredCameras.length > 0 ? (
                        filteredCameras.map((cam) => (
                          <button
                            key={cam.id}
                            onMouseDown={() => handleSelectCamera(cam)}
                            className={`w-full text-left flex items-center justify-between p-3 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                          >
                            <div>
                              <p className={`font-semibold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{cam.number}</p>
                              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{cam.dept}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              {cam.status === 'Online' ? (
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>Online</span>
                              ) : (
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'}`}>Offline</span>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className={`p-4 text-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          No matching rooms found
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 transition-colors rounded-xl ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className={`relative flex items-center gap-3 pl-6 border-l ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none"
              >
                <div className="text-right">
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{profileForm.name}</p>
                  <p className="text-xs text-slate-500">{role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] overflow-hidden">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileForm.name}`}
                    alt="Avatar"
                    className={`w-full h-full rounded-full object-cover ${isDarkMode ? 'bg-[#0a0a0c]' : 'bg-white'}`}
                  />
                </div>
              </button>


              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute top-full right-12 mt-4 w-72 rounded-2xl border shadow-xl z-50 overflow-hidden ${isDarkMode ? 'glass-dark border-white/10' : 'bg-white border-slate-200'}`}
                  >
                    <div className={`p-5 border-b flex items-center gap-4 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] shrink-0 overflow-hidden">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileForm.name}`}
                          alt="Avatar"
                          className={`w-full h-full rounded-full object-cover ${isDarkMode ? 'bg-[#0a0a0c]' : 'bg-white'}`}
                        />
                      </div>
                      <div>
                        <h4 className={`font-bold text-lg leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{profileForm.name}</h4>
                        <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                          {role}
                        </span>
                      </div>
                    </div>
                    <div className="p-2">
                      <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <BadgeInfo size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold opacity-70">Employee ID</span>
                          <span className="text-sm font-medium">FA-{(name.length * 123) % 9000 + 1000}</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <School size={16} className={isDarkMode ? 'text-purple-400' : 'text-purple-600'} />
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold opacity-70">Department</span>
                          <span className="text-sm font-medium">Computer Science</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <Mail size={16} className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} />
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold opacity-70">Email Address</span>
                          <span className="text-sm font-medium truncate max-w-[180px]">{profileForm.email}</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <Phone size={16} className={isDarkMode ? 'text-rose-400' : 'text-rose-600'} />
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold opacity-70">Emergency Contact</span>
                          <span className="text-sm font-medium">{profileForm.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`p-2 border-t flex flex-col gap-1 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                      <button
                        onClick={() => { setIsEditProfileOpen(true); setIsProfileOpen(false); }}
                        className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <Settings size={18} />
                        <span className="text-sm font-bold">Edit Profile</span>
                      </button>
                      <button
                        onClick={onLogout}
                        className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-colors ${isDarkMode ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-600 hover:bg-rose-50'}`}
                      >
                        <LogOut size={18} />
                        <span className="text-sm font-bold">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-black/5">
          {activeTab === 'dashboard' && (
            <div className="flex flex-col max-w-4xl mx-auto h-full pt-6 w-full gap-10">
              <div className="pl-2">
                <h1 className={`text-4xl font-bold mb-3 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'} drop-shadow-sm`}>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Welcome back, Admin</span>
                </h1>
                <p className={`text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Here’s what’s happening today</p>
              </div>

              <div className={`overflow-hidden rounded-[24px] border transition-all duration-500 hover:shadow-2xl ${isDarkMode ? 'glass-dark border-white/10 hover:shadow-blue-900/20' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-blue-500/10'}`}>
                <div className={`p-8 border-b font-bold text-2xl flex items-center gap-4 ${isDarkMode ? 'border-white/5 text-white bg-white/5' : 'border-slate-100 text-slate-800 bg-slate-50'}`}>
                  <div className="p-3 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl shadow-lg shadow-rose-500/20">
                    <ShieldAlert size={28} className="text-white flex-shrink-0" />
                  </div>
                  Live Security Alerts
                </div>
                <div className="p-6 space-y-4">
                  {mockAlerts.map((alert) => (
                    <div key={alert.id} className={`p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl border ${isDarkMode ? 'bg-black/20 border-white/5 hover:bg-gradient-to-r hover:from-blue-900/30 hover:to-purple-900/30 hover:border-blue-500/30' : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-200'}`}>
                      <span className={`text-lg font-semibold tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{alert.title}</span>
                      <span className={`text-xs px-4 py-2 rounded-xl font-bold md:min-w-fit uppercase tracking-widest transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {alert.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'captured-pictures' || activeTab === 'photos' || activeTab === 'pictures') && (
            <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full pt-4 w-full">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{pictureFilter === 'saved' ? 'Saved Images' : 'Captured Pictures'}</h2>
                <div className={`flex items-center p-1 rounded-xl w-full sm:w-auto ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-200/50 border border-slate-200'}`}>
                  <button
                    onClick={() => setPictureFilter('all')}
                    className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${pictureFilter === 'all' ? (isDarkMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-blue-600 shadow-sm') : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
                  >
                    All Pictures
                  </button>
                  <button
                    onClick={() => setPictureFilter('saved')}
                    className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${pictureFilter === 'saved' ? (isDarkMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-blue-600 shadow-sm') : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
                  >
                    <Bookmark size={14} className={pictureFilter === 'saved' ? 'fill-current' : ''} /> Saved ({savedPictures.length})
                  </button>
                  <button
                    onClick={simulateCapture}
                    className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600`}
                  >
                    <Camera size={14} /> Simulate Capture
                  </button>
                </div>
              </div>

              {/* Search and Filters Bar */}
              <div className={`flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border shadow-sm transition-colors ${isDarkMode ? 'glass-dark border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="relative flex-1 w-full group">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} size={18} />
                  <input
                    type="text"
                    value={pictureSearchQuery}
                    onChange={(e) => setPictureSearchQuery(e.target.value)}
                    placeholder="Search by filename, date, activity or tags..."
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl border focus:outline-none transition-all duration-300 ${isDarkMode
                        ? 'bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/5'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white'
                      }`}
                  />
                </div>
                
                <div className="flex w-full sm:w-auto items-center gap-4">
                  <select
                    value={pictureActivityFilter}
                    onChange={(e) => setPictureActivityFilter(e.target.value as any)}
                    className={`px-4 py-2.5 rounded-xl border focus:outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-black/20 border-white/10 text-white focus:border-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500/50'}`}
                  >
                    <option value="all">All Activities</option>
                    <option value="Classroom">Classroom</option>
                    <option value="Assessment Center">Assessment Center</option>
                  </select>

                  <select
                    value={pictureSortOrder}
                    onChange={(e) => setPictureSortOrder(e.target.value as any)}
                    className={`px-4 py-2.5 rounded-xl border focus:outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-black/20 border-white/10 text-white focus:border-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500/50'}`}
                  >
                    <option value="latest">Latest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                {mockPictures
                  .filter(pic => {
                    if (pictureFilter === 'saved' && !savedPictures.includes(pic.id)) return false;
                    if (pictureActivityFilter !== 'all' && pic.type !== pictureActivityFilter) return false;
                    
                    if (pictureSearchQuery.trim() !== '') {
                      const q = pictureSearchQuery.toLowerCase();
                      const matchesLoc = pic.loc?.toLowerCase().includes(q);
                      const matchesDept = pic.dept?.toLowerCase().includes(q);
                      const matchesTime = pic.time?.toLowerCase().includes(q);
                      const matchesType = pic.type?.toLowerCase().includes(q);
                      return matchesLoc || matchesDept || matchesTime || matchesType;
                    }
                    return true;
                  })
                  .sort((a, b) => pictureSortOrder === 'latest' ? b.id - a.id : a.id - b.id)
                  .map((pic) => {
                    const isSaved = savedPictures.includes(pic.id);
                    const rawUrl = pic.imageUrl || (pic as any).image_url || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80';
                    const imgUrl = getImageUrl(rawUrl);
                    return (
                      <div
                        key={pic.id}
                        onClick={() => setSelectedPictureForModal(pic)}
                        className={`rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer group hover:shadow-xl ${isDarkMode ? 'glass-dark hover:border-blue-500/40' : 'bg-white shadow-sm hover:border-blue-300'} ${isSaved ? (isDarkMode ? 'border-blue-500/50 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]' : 'border-blue-300 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]') : (isDarkMode ? 'border-white/10' : 'border-slate-200')}`}
                      >
                        <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
                          <img
                            src={imgUrl}
                            alt={pic.loc}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white font-bold text-xs backdrop-blur-[2px]">
                            <Eye size={24} className="text-white drop-shadow-md" />
                            <span>Click to View Image</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
                          <div className="absolute bottom-2 left-3 flex items-center gap-1.5 opacity-90 z-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] text-white font-mono">{pic.time}</span>
                          </div>

                          {/* Floating actions */}
                          <div className="absolute top-2 right-2 flex flex-row items-center gap-1.5 z-20" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleSavePicture(pic.id)}
                              className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-lg transition-all duration-300 ${isSaved ? 'bg-blue-600 text-white' : 'bg-black/60 text-white hover:bg-blue-600 backdrop-blur-sm'}`}
                            >
                              {isSaved ? <><Check size={12} /> Saved</> : <><Bookmark size={12} /> Save</>}
                            </button>
                            <button
                              onClick={() => downloadFile(imgUrl, `smarteye_capture_${pic.id}_${(pic.loc || 'room').replace(/\s+/g, '_')}.jpg`)}
                              className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all duration-300"
                              title="Download to your Downloads folder"
                            >
                              <Download size={12} /> Download
                            </button>
                          </div>
                        </div>
                        <div className="p-4 relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${pic.type === 'Classroom' ? 'text-blue-500' : 'text-amber-500'}`}>{pic.type}</span>
                            <span className="text-[10px] text-blue-400 font-semibold group-hover:underline">View ↗</span>
                          </div>
                          <p className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{pic.loc}</p>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{pic.dept}</p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {activeTab === 'settings' && <SystemSettingsComponent isDarkMode={isDarkMode} />}

          {activeTab === 'alerts' && <AlertsCenterView isDarkMode={isDarkMode} />}

          {activeTab === 'chat' && (
            <div className="max-w-7xl mx-auto h-full w-full pt-2">
              <Chat userName={profileForm.name || name} />
            </div>
          )}

          {activeTab !== 'dashboard' && activeTab !== 'captured-pictures' && activeTab !== 'photos' && activeTab !== 'settings' && activeTab !== 'chat' && activeTab !== 'alerts' && (
            <CameraFeedView activeTab={activeTab} isDarkMode={isDarkMode} onCapture={simulateCapture} />
          )}
        </div>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ ease: "easeOut", duration: 0.2 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border flex flex-col ${isDarkMode ? 'bg-[#111] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
            >
              <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                <h3 className="font-bold text-lg">Edit Admin Profile</h3>
                <button onClick={() => setIsEditProfileOpen(false)} className="hover:opacity-70 transition-opacity">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto max-h-[70vh]" style={{ scrollbarWidth: 'thin' }}>
                {profileSuccessMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium text-center flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> {profileSuccessMessage}
                  </div>
                )}
                {profileError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium text-center">
                    {profileError}
                  </div>
                )}
                
                <div className="flex flex-col items-center gap-3 mb-6">
                  <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] overflow-hidden">
                       <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileForm.name}`}
                          alt="Avatar Preview"
                          className={`w-full h-full rounded-full object-cover ${isDarkMode ? 'bg-[#0a0a0c]' : 'bg-white'}`}
                       />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold backdrop-blur-sm">
                      <Upload size={20} className="mb-1" />
                      Upload
                    </div>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Click avatar to change image</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                    <input 
                      type="text" 
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full bg-transparent border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'border-white/10 text-white' : 'border-slate-200 text-slate-800'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</label>
                    <input 
                      type="email" 
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full bg-transparent border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'border-white/10 text-white' : 'border-slate-200 text-slate-800'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone Number</label>
                    <input 
                      type="text" 
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full bg-transparent border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'border-white/10 text-white' : 'border-slate-200 text-slate-800'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Password</label>
                    <div className="relative">
                      <input 
                        type={showProfilePassword ? "text" : "password"}
                        value={profileForm.password}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, password: e.target.value }))}
                        className={`w-full bg-transparent border rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'border-white/10 text-white' : 'border-slate-200 text-slate-800'}`}
                      />
                      <button type="button" onClick={() => setShowProfilePassword(!showProfilePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
                        {showProfilePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`p-5 flex items-center justify-end gap-3 border-t bg-black/10 ${isDarkMode ? 'border-white/10' : 'border-slate-100 bg-slate-50'}`}>
                <button 
                  onClick={() => setIsEditProfileOpen(false)}
                  className={`px-5 py-2.5 rounded-xl font-bold transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleProfileSave}
                  className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Fullscreen Picture View Modal */}
      <AnimatePresence>
        {selectedPictureForModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPictureForModal(null)}
            className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Top Header */}
              <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Camera size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{selectedPictureForModal.loc}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedPictureForModal.type === 'Classroom' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {selectedPictureForModal.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedPictureForModal.dept} • Captured at {selectedPictureForModal.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSavePicture(selectedPictureForModal.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                      savedPictures.includes(selectedPictureForModal.id)
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                    }`}
                  >
                    <Bookmark size={14} />
                    {savedPictures.includes(selectedPictureForModal.id) ? 'Saved ✓' : 'Save'}
                  </button>

                  <button
                    onClick={() => downloadFile(
                      selectedPictureForModal.imageUrl || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
                      `smarteye_capture_${selectedPictureForModal.id}_${(selectedPictureForModal.loc || 'room').replace(/\s+/g, '_')}.jpg`
                    )}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
                  >
                    <Download size={14} />
                    Download Picture
                  </button>

                  <button
                    onClick={() => setSelectedPictureForModal(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Image Body */}
              <div className="flex-1 bg-black flex items-center justify-center overflow-hidden p-2 sm:p-4 relative">
                <img
                  src={getImageUrl(selectedPictureForModal.imageUrl || (selectedPictureForModal as any).image_url || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80')}
                  alt={selectedPictureForModal.loc}
                  className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
