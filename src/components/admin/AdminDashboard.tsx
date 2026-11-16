import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Cpu, 
  Users, 
  Activity, 
  Database, 
  AlertTriangle, 
  MessageSquare, 
  LogOut, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Sliders, 
  Camera, 
  HardDrive, 
  CheckCircle, 
  XCircle, 
  Radio, 
  Search, 
  Save, 
  Send, 
  BellRing, 
  Layers, 
  Globe, 
  Check, 
  ArrowLeft,
  Settings,
  Image as ImageIcon,
  Eye,
  Download,
  X,
  Menu,
  ChevronRight,
  Wifi,
  Bell,
  Volume2,
  VolumeX
} from 'lucide-react';
import { CameraNode, UserRecord, AuditLog, IncidentReport, CapturedPicture } from '../../types';
import { apiFetch, getImageUrl } from '../../api';
import Chat from '../Chat';
import ServerConfigModal from '../mobile/ServerConfigModal';
import CaptureNotificationToast from '../common/CaptureNotificationToast';
import { 
  playDetectionAlertSound, 
  triggerHapticFeedback, 
  sendSystemNotification, 
  requestNotificationPermission 
} from '../../utils/notifications';

interface AdminDashboardProps {
  adminName: string;
  onLogout: () => void;
  onSwitchPortal: () => void;
}

const initialCameraNodes: CameraNode[] = [
  { id: 'cse-101', number: 'Room 101', dept: 'Computer Science', type: 'Lecture Hall', status: 'Online', resolution: '1080p', fps: 30, ipAddress: '192.168.1.101', streamUrl: 'rtsp://192.168.1.101/live' },
  { id: 'cse-102', number: 'Room 102', dept: 'Computer Science', type: 'AI Lab', status: 'Online', resolution: '4K UHD', fps: 60, ipAddress: '192.168.1.102', streamUrl: 'rtsp://192.168.1.102/live' },
  { id: 'cse-103', number: 'Room 103', dept: 'Computer Science', type: 'Seminar Hall', status: 'Offline', resolution: '1080p', fps: 30, ipAddress: '192.168.1.103', streamUrl: 'rtsp://192.168.1.103/live' },
  { id: 'me-201', number: 'Room 201', dept: 'Mechanical Eng.', type: 'CAD Lab', status: 'Online', resolution: '1080p', fps: 30, ipAddress: '192.168.2.201', streamUrl: 'rtsp://192.168.2.201/live' },
  { id: 'me-202', number: 'Room 202', dept: 'Mechanical Eng.', type: 'Robotics Workshop', status: 'Maintenance', resolution: '1080p', fps: 30, ipAddress: '192.168.2.202', streamUrl: 'rtsp://192.168.2.202/live' },
  { id: 'exam-01', number: 'Exam Room 1', dept: 'Assessment Center', type: 'Test Center', status: 'Online', resolution: '4K UHD', fps: 60, ipAddress: '192.168.3.1', streamUrl: 'rtsp://192.168.3.1/live' },
  { id: 'exam-02', number: 'Exam Room 2', dept: 'Assessment Center', type: 'Test Center', status: 'Online', resolution: '1080p', fps: 30, ipAddress: '192.168.3.2', streamUrl: 'rtsp://192.168.3.2/live' },
  { id: 'exam-05', number: 'Exam Room 5', dept: 'Assessment Center', type: 'Main Hall', status: 'Offline', resolution: '1080p', fps: 30, ipAddress: '192.168.3.5', streamUrl: 'rtsp://192.168.3.5/live' }
];

export default function AdminDashboard({ adminName, onLogout, onSwitchPortal }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'nodes' | 'images' | 'users' | 'logs' | 'database' | 'alerts' | 'chat'>('nodes');
  const [cameraNodes, setCameraNodes] = useState<CameraNode[]>(initialCameraNodes);
  const [pictures, setPictures] = useState<CapturedPicture[]>([]);
  const [selectedViewImage, setSelectedViewImage] = useState<CapturedPicture | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [dbStatus, setDbStatus] = useState<any>({ connected: false, mode: 'Loading...' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Image Search and Filter State
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [imageDeptFilter, setImageDeptFilter] = useState<string>('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isRefreshingPics, setIsRefreshingPics] = useState(false);

  // Real-Time Notification & Alert State
  const [latestAlertToast, setLatestAlertToast] = useState<any | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const prevPicIdsRef = useRef<Set<number | string>>(new Set());
  const isFirstPicLoadRef = useRef<boolean>(true);

  const navModules = [
    { id: 'nodes' as const, label: 'Camera Nodes & Streams', icon: Cpu, badge: cameraNodes.length },
    { id: 'images' as const, label: 'Captured Images', icon: ImageIcon, badge: pictures.length },
    { id: 'users' as const, label: 'User & Role Controls', icon: Users, badge: users.length },
    { id: 'logs' as const, label: 'Security Audit Trail', icon: Activity, badge: logs.length },
    { id: 'database' as const, label: 'Database & Health', icon: Database, isDot: true },
    { id: 'alerts' as const, label: 'Alert Dispatcher', icon: AlertTriangle, badge: incidents.length, isAlert: true },
    { id: 'chat' as const, label: 'Operator Comms', icon: MessageSquare },
  ];
  
  // New Camera Node Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNode, setNewNode] = useState({
    number: '',
    dept: 'Computer Science',
    type: 'Classroom',
    resolution: '1080p',
    fps: 30,
    ipAddress: '192.168.1.150'
  });

  // Emergency Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'Low' | 'Medium' | 'Critical'>('Critical');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);

  // Delete Image Modal & Loading State (Admin Only)
  const [imageToDelete, setImageToDelete] = useState<CapturedPicture | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/pictures/${imageToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPictures(prev => prev.filter(p => String(p.id) !== String(imageToDelete.id)));
        if (selectedViewImage && String(selectedViewImage.id) === String(imageToDelete.id)) {
          setSelectedViewImage(null);
        }
        setDeleteFeedback(`Captured image #${imageToDelete.id} permanently deleted.`);
        setTimeout(() => setDeleteFeedback(null), 4000);
      } else {
        alert(data.error || 'Failed to delete captured image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Network error occurred while attempting to delete image');
    } finally {
      setIsDeleting(false);
      setImageToDelete(null);
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    fetchUsers();
    fetchLogs();
    fetchIncidents();
    fetchDbStatus();
    fetchPictures();

    const interval = setInterval(() => {
      fetchPictures();
      fetchDbStatus();
    }, 2500);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  const fetchPictures = (manual = false) => {
    if (manual) setIsRefreshingPics(true);
    apiFetch('/api/pictures')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPictures(data);

          // Real-time Detection Alert & Notification Dispatcher
          if (isFirstPicLoadRef.current) {
            data.forEach(p => prevPicIdsRef.current.add(p.id));
            isFirstPicLoadRef.current = false;
          } else {
            const newCaptures = data.filter(p => !prevPicIdsRef.current.has(p.id));
            if (newCaptures.length > 0) {
              newCaptures.forEach(p => prevPicIdsRef.current.add(p.id));
              const newest = newCaptures[0];

              // 1. Audible Security Alert Chime
              if (soundEnabled) {
                playDetectionAlertSound();
              }

              // 2. Physical Mobile Phone Vibration
              triggerHapticFeedback();

              // 3. System / Push Notification
              sendSystemNotification('🚨 SmartEye: Phone Detected!', {
                body: `${newest.loc || 'Exam Hall'}: ${newest.type || 'Unauthorized Phone Detected'} at ${newest.time}`,
                icon: '/favicon.ico'
              });

              // 4. In-App Visual Alert Toast with Captured Image Preview
              setLatestAlertToast(newest);
            }
          }
        }
      })
      .catch(err => console.error('Admin fetchPictures err:', err))
      .finally(() => {
        if (manual) {
          setTimeout(() => setIsRefreshingPics(false), 500);
        }
      });
  };

  const fetchUsers = () => {
    apiFetch('/api/admin/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  };

  const fetchLogs = () => {
    apiFetch('/api/admin/logs')
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.error(err));
  };

  const fetchIncidents = () => {
    apiFetch('/api/incidents')
      .then(res => res.json())
      .then(data => setIncidents(data))
      .catch(err => console.error(err));
  };

  const fetchDbStatus = () => {
    apiFetch('/api/db-status')
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(err => console.error(err));
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNode.number) return;
    const created: CameraNode = {
      id: `cam-${Date.now()}`,
      number: newNode.number,
      dept: newNode.dept,
      type: newNode.type,
      status: 'Online',
      resolution: newNode.resolution,
      fps: Number(newNode.fps),
      ipAddress: newNode.ipAddress,
      streamUrl: `rtsp://${newNode.ipAddress}/live`
    };
    setCameraNodes([created, ...cameraNodes]);
    setShowAddModal(false);
    setNewNode({
      number: '',
      dept: 'Computer Science',
      type: 'Classroom',
      resolution: '1080p',
      fps: 30,
      ipAddress: '192.168.1.150'
    });
  };

  const handleDeleteNode = (id: string) => {
    setCameraNodes(cameraNodes.filter(n => n.id !== id));
  };

  const handleToggleNodeStatus = (id: string) => {
    setCameraNodes(cameraNodes.map(n => {
      if (n.id === id) {
        const nextStatus = n.status === 'Online' ? 'Offline' : n.status === 'Offline' ? 'Maintenance' : 'Online';
        return { ...n, status: nextStatus };
      }
      return n;
    }));
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    apiFetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `[EMERGENCY DISPATCH] ${broadcastTitle}`,
        location: 'All Campus Sectors',
        reportedBy: 'System Administrator (Broadcast)',
        severity: broadcastSeverity,
        description: broadcastMessage
      })
    })
      .then(res => res.json())
      .then(data => {
        setIncidents([data, ...incidents]);
        setBroadcastSuccess(true);
        setBroadcastTitle('');
        setBroadcastMessage('');
        setTimeout(() => setBroadcastSuccess(false), 3000);
      });
  };

  const handleBackupDatabase = () => {
    setBackupFeedback('Generating SQL Snapshot & Exporting...');
    setTimeout(() => {
      setBackupFeedback(`Backup completed successfully at ${new Date().toLocaleTimeString()} (smarteye_dump_${Date.now().toString().slice(-6)}.sql)`);
      setTimeout(() => setBackupFeedback(null), 4000);
    }, 1200);
  };

  const handleDownloadPhoto = async (url: string, filename: string) => {
    try {
      const fullUrl = getImageUrl(url);
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'captured_image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('Direct photo download fallback:', err);
      window.open(getImageUrl(url), '_blank');
    }
  };

  const filteredNodes = cameraNodes.filter(n => 
    n.number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPictures = pictures.filter((pic: any) => {
    const query = imageSearchQuery.toLowerCase().trim();
    const matchesDept = imageDeptFilter === 'All' || pic.dept === imageDeptFilter;
    const matchesSearch = !query || 
                          pic.loc?.toLowerCase().includes(query) ||
                          pic.dept?.toLowerCase().includes(query) ||
                          pic.type?.toLowerCase().includes(query) ||
                          pic.time?.toLowerCase().includes(query) ||
                          String(pic.id).includes(query);
    return matchesDept && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Admin Header */}
      <header className="bg-[#0b0e17] border-b border-amber-500/20 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 select-none">
            <img src="/logo-icon-light.png" alt="SmartEye" className="w-8 h-8 object-contain drop-shadow" />
            <div className="flex flex-col items-start">
              <span className="text-xl font-bold tracking-tight text-white leading-tight">
                Smart<span className="text-teal-400">Eye</span>
              </span>
              <p className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase -mt-0.5">ai surveillance</p>
            </div>
          </div>
          <div className="h-6 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 hidden sm:inline">Admin Control</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
              APP 1
            </span>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Alert Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playDetectionAlertSound();
            }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
            title={soundEnabled ? 'Alert Sound Enabled (Click to Mute)' : 'Alert Sound Muted (Click to Enable)'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[10px]">{soundEnabled ? 'Audio ON' : 'Muted'}</span>
          </button>

          {/* Live Capture Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationMenuOpen(!isNotificationMenuOpen)}
              className="relative flex items-center justify-center p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
              title="Real-Time Detection Alerts"
            >
              <Bell className="w-4 h-4 text-rose-400" />
              {pictures.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-bold shadow-md shadow-rose-500/50 animate-pulse">
                  {pictures.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            <AnimatePresence>
              {isNotificationMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0d1220] border border-white/15 shadow-2xl p-4 z-50 text-white"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span className="font-bold text-xs uppercase tracking-wider text-rose-400">
                        Live Alert Notifications
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {pictures.length} Captures
                    </span>
                  </div>

                  {/* Notifications List */}
                  <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {pictures.slice(0, 5).map((pic: any) => {
                      const raw = pic.image_url || pic.imageUrl || '';
                      const img = getImageUrl(raw);
                      return (
                        <div
                          key={pic.id}
                          onClick={() => {
                            setSelectedViewImage(pic);
                            setIsNotificationMenuOpen(false);
                          }}
                          className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-black overflow-hidden shrink-0 border border-white/10">
                            <img
                              src={img}
                              alt={pic.loc}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.dataset.triedFallback) {
                                  target.dataset.triedFallback = 'true';
                                  target.src = getImageUrl(raw, true);
                                }
                              }}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{pic.type || 'Unauthorized Phone Detected'}</p>
                            <p className="text-[11px] text-rose-300 truncate">📍 {pic.loc}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{pic.time}</p>
                          </div>
                          <Eye className="w-4 h-4 text-slate-400 group-hover:text-amber-400 shrink-0" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/10 flex justify-between items-center text-xs">
                    <button
                      onClick={() => {
                        setActiveTab('images');
                        setIsNotificationMenuOpen(false);
                      }}
                      className="text-amber-400 hover:underline font-bold text-xs cursor-pointer"
                    >
                      View All in Captured Images →
                    </button>
                    <button
                      onClick={() => setIsNotificationMenuOpen(false)}
                      className="text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Server IP Quick Config Modal Trigger */}
          <button
            onClick={() => setIsServerModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Configure Backend Server IP"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden xs:inline text-[11px]">Server IP</span>
          </button>

          {/* Mobile System Modules Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
            aria-label="Open System Modules Menu"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[11px]">Modules</span>
          </button>

          <div className="hidden md:flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 rounded-xl text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-mono text-[11px]">{dbStatus.database || 'smarteye'} ({dbStatus.mode})</span>
          </div>

          <button
            onClick={onSwitchPortal}
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
            title="Return to the dual-application selector"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">App Hub</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container with Sidebar Navigation */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar (Desktop) */}
        <aside className="w-64 bg-[#090c14] border-r border-white/[0.06] p-4 flex flex-col justify-between shrink-0 hidden md:flex">
          <div className="space-y-1.5">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-3 mb-2">
              System Modules
            </div>

            {navModules.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      item.isAlert && item.badge > 0
                        ? 'bg-rose-500/20 text-rose-300 font-bold'
                        : 'bg-white/[0.06]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.isDot && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Admin User Info Card */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                AD
              </div>
              <div>
                <p className="font-bold text-white leading-tight">{adminName}</p>
                <p className="text-[10px] text-amber-400">Master Level 5</p>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Session ID: adm-sec-884</div>
          </div>
        </aside>

        {/* Mobile Slide-out Drawer for System Modules */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              />

              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative z-10 w-4/5 max-w-xs bg-[#090c14] border-r border-amber-500/20 h-full flex flex-col justify-between p-5 text-white shadow-2xl"
              >
                <div className="overflow-y-auto">
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Admin Control</h3>
                        <p className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">System Modules</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-3 mb-2">
                      System Modules
                    </div>
                    {navModules.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              item.isAlert && item.badge > 0
                                ? 'bg-rose-500/20 text-rose-300 font-bold'
                                : 'bg-white/[0.08] text-slate-300'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          {item.isDot && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.08] space-y-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                        AD
                      </div>
                      <div>
                        <p className="font-bold text-xs text-white leading-tight">{adminName}</p>
                        <p className="text-[10px] text-amber-400">Master Level 5</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-slate-400">{dbStatus.mode || 'Ready'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsServerModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-blue-300 bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-blue-400" />
                      <span>Configure Server Host IP</span>
                    </div>
                    <span className="text-[10px] text-emerald-400">Live</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onSwitchPortal();
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-white/10"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>App Hub</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-500/20"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 md:pb-6 bg-[#06080d]">
          {/* TAB 1: CAMERA NODES MANAGEMENT */}
          {activeTab === 'nodes' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                    <Cpu className="w-6 h-6 text-amber-400" />
                    Camera Node & Stream Infrastructure
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure high-throughput RTSP video endpoints, frame rates, and camera status across departments.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search camera nodes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Camera</span>
                  </button>
                </div>
              </div>

              {/* Node Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Nodes</p>
                  <p className="text-2xl font-black text-white mt-1">{cameraNodes.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Online Streams</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    {cameraNodes.filter(n => n.status === 'Online').length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                  <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Offline Nodes</p>
                  <p className="text-2xl font-black text-rose-400 mt-1">
                    {cameraNodes.filter(n => n.status === 'Offline').length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">In Maintenance</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">
                    {cameraNodes.filter(n => n.status === 'Maintenance').length}
                  </p>
                </div>
              </div>

              {/* Camera Nodes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNodes.map(node => (
                  <div
                    key={node.id}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400">{node.dept}</span>
                        <button
                          onClick={() => handleToggleNodeStatus(node.id)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border cursor-pointer ${
                            node.status === 'Online'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : node.status === 'Offline'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                          title="Click to toggle status"
                        >
                          {node.status}
                        </button>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                        {node.number}
                      </h3>
                      <p className="text-xs text-slate-400 mb-4">{node.type}</p>

                      <div className="space-y-1.5 text-[11px] font-mono text-slate-400 bg-black/40 p-3 rounded-xl border border-white/[0.04]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">IP Endpoint:</span>
                          <span className="text-slate-300">{node.ipAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Stream Spec:</span>
                          <span className="text-slate-300">{node.resolution} @ {node.fps}fps</span>
                        </div>
                        <div className="flex justify-between truncate">
                          <span className="text-slate-500">RTSP URI:</span>
                          <span className="text-amber-400/80 truncate ml-2">{node.streamUrl}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.05]">
                      <button
                        onClick={() => handleToggleNodeStatus(node.id)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Toggle Stream
                      </button>
                      <button
                        onClick={() => handleDeleteNode(node.id)}
                        className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CAPTURED IMAGES ARCHIVE (ADMIN VIEW) */}
          {activeTab === 'images' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                    <ImageIcon className="w-6 h-6 text-amber-400" />
                    Captured Images Inspection Console
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Search and inspect surveillance snapshots stored across all campus zones.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-80">
                    <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search photos by Room, Dept, Time or ID..."
                      value={imageSearchQuery}
                      onChange={(e) => setImageSearchQuery(e.target.value)}
                      className="w-full bg-[#0a0d16] border border-amber-500/30 focus:border-amber-400 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 shadow-inner"
                    />
                    {imageSearchQuery && (
                      <button
                        onClick={() => setImageSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => fetchPictures(true)}
                    disabled={isRefreshingPics}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-all cursor-pointer shrink-0 disabled:opacity-60"
                    title="Fetch latest captured images from database"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPics ? 'animate-spin' : ''}`} />
                    <span>Sync Images</span>
                  </button>
                </div>
              </div>

              {/* Department Filters & Counter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.05]">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                  {['All', 'Computer Science', 'Mechanical Eng.', 'Assessment Center', 'Main Block'].map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setImageDeptFilter(dept)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer ${
                        imageDeptFilter === dept
                          ? 'bg-amber-500 text-black font-bold shadow-sm'
                          : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
                      }`}
                    >
                      {dept === 'All' ? 'All Departments' : dept}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-slate-400 font-mono shrink-0">
                  Showing <strong className="text-amber-400">{filteredPictures.length}</strong> of {pictures.length} photos
                </div>
              </div>

              {/* Delete Feedback Message */}
              {deleteFeedback && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2.5 font-semibold">
                    <CheckCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{deleteFeedback}</span>
                  </div>
                  <button onClick={() => setDeleteFeedback(null)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {filteredPictures.length === 0 ? (
                <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/[0.06] text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] text-slate-400 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">No captured photos found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No images match &ldquo;{imageSearchQuery}&rdquo;.
                  </p>
                  <button
                    onClick={() => { setImageSearchQuery(''); setImageDeptFilter('All'); }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Reset Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPictures.map((pic: any) => {
                    const rawImg = pic.image_url || pic.imageUrl || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80';
                    const img = getImageUrl(rawImg);
                    return (
                      <div
                        key={pic.id}
                        className="rounded-2xl bg-white/[0.02] border border-white/[0.08] overflow-hidden group shadow-lg flex flex-col justify-between hover:border-amber-500/40 transition-all"
                      >
                        <div
                          onClick={() => setSelectedViewImage(pic)}
                          className="relative aspect-video bg-black overflow-hidden cursor-pointer"
                        >
                          <img
                            src={img}
                            alt={pic.loc}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.triedFallback) {
                                target.dataset.triedFallback = 'true';
                                target.src = getImageUrl(rawImg, true);
                              }
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-white">
                            {pic.loc} • {pic.time}
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-amber-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                            <div className="px-3.5 py-1.5 rounded-full bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg">
                              <Eye className="w-3.5 h-3.5" />
                              <span>Click to View Image</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-white text-sm">{pic.loc}</h4>
                              <p className="text-[11px] text-slate-400">{pic.dept} • {pic.type}</p>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">ID #{pic.id}</span>
                          </div>

                          {/* Action Buttons: View, Download & Delete (Admin Only) */}
                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            <button
                              onClick={() => setSelectedViewImage(pic)}
                              className="py-2 px-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black text-xs font-bold rounded-xl border border-amber-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
                              title="View Full Resolution"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => handleDownloadPhoto(img, `${pic.loc.replace(/\s+/g, '_')}_capture.jpg`)}
                              className="py-2 px-2 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-bold rounded-xl border border-white/[0.08] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              title="Download Image"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </button>

                            <button
                              onClick={() => setImageToDelete(pic)}
                              className="py-2 px-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-bold rounded-xl border border-rose-500/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              title="Delete captured image permanently (Admin only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: USER & ACCESS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                    <Users className="w-6 h-6 text-amber-400" />
                    User Directory & Role Permissions
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage registered faculty members, administrative operators, and authorization levels.
                  </p>
                </div>
                <button
                  onClick={fetchUsers}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold rounded-xl border border-white/[0.08] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh List
                </button>
              </div>

              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.04] text-slate-400 uppercase font-extrabold text-[10px] tracking-wider border-b border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-4">User Details</th>
                      <th className="px-6 py-4">Email Address</th>
                      <th className="px-6 py-4">Assigned Role</th>
                      <th className="px-6 py-4">Last Login</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {users.map((user, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-xs">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <span>{user.name || 'Faculty Member'}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-mono text-[11px]">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            user.role === 'Admin'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-[11px]">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : 'Recently active'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY AUDIT TRAIL */}
          {activeTab === 'logs' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                    <Activity className="w-6 h-6 text-amber-400" />
                    Security Audit Trail & Access Logs
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Real-time authentication records, IP addresses, and user-agent forensics.
                  </p>
                </div>
                <button
                  onClick={fetchLogs}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold rounded-xl border border-white/[0.08] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reload Logs
                </button>
              </div>

              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.04] text-slate-400 uppercase font-extrabold text-[10px] tracking-wider border-b border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">User / Email</th>
                      <th className="px-6 py-4">Action Event</th>
                      <th className="px-6 py-4">IP Address</th>
                      <th className="px-6 py-4">Client Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {logs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                          {log.login_time ? new Date(log.login_time).toLocaleTimeString() : 'Just now'}
                        </td>
                        <td className="px-6 py-4 font-bold text-white">{log.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'Warning'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {log.action || 'User Access Verified'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-amber-300/80 font-mono text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                        <td className="px-6 py-4 text-slate-400 truncate max-w-xs">{log.user_agent || 'Chrome / Windows'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: DATABASE & HEALTH */}
          {activeTab === 'database' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                  <Database className="w-6 h-6 text-amber-400" />
                  Database Engine & Infrastructure Health
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Active connection pool status, schema health checks, and database dump triggers.
                </p>
              </div>

              {/* Status Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 to-blue-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      MySQL Core Database: <span className="text-emerald-400">{dbStatus.database || 'smarteye'}</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">Status: {dbStatus.mode} • Host: {dbStatus.host || 'localhost'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBackupDatabase}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Backup Database</span>
                  </button>
                </div>
              </div>

              {backupFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{backupFeedback}</span>
                </motion.div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Tables</p>
                  <p className="text-3xl font-black text-white mt-2">3</p>
                  <p className="text-[11px] text-slate-500 mt-1">pictures, users, login_logs</p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Registered Accounts</p>
                  <p className="text-3xl font-black text-white mt-2">{users.length}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Synchronized with auth pool</p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Audit Trail Entries</p>
                  <p className="text-3xl font-black text-white mt-2">{logs.length}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Retained login logs</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY ALERT DISPATCHER */}
          {activeTab === 'alerts' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  Security Alert Dispatcher & Incident Management
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Broadcast emergency warnings across all faculty portals and resolve reported campus incidents.
                </p>
              </div>

              {/* Broadcast Alert Form */}
              <div className="p-6 rounded-3xl bg-amber-500/[0.04] border border-amber-500/20 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <BellRing className="w-4 h-4" />
                  <span>Broadcast Campus Emergency Advisory</span>
                </div>

                {broadcastSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    ✓ Global Emergency Alert Dispatched to all faculty screens!
                  </div>
                )}

                <form onSubmit={handleSendBroadcast} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Advisory Headline
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Unauthorized movement reported in Lab 202"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Severity Level
                    </label>
                    <select
                      value={broadcastSeverity}
                      onChange={(e: any) => setBroadcastSeverity(e.target.value)}
                      className="w-full bg-[#0e121b] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="Critical">Critical Priority</option>
                      <option value="Medium">Medium Warning</option>
                      <option value="Low">Informational</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Alert</span>
                    </button>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Advisory Details & Instructions
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Provide safety instructions or evacuation notices for staff..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </form>
              </div>

              {/* Incidents List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Active Incident Queue ({incidents.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {incidents.map(inc => (
                    <div
                      key={inc.id}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            inc.severity === 'Critical'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : inc.severity === 'Medium'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {inc.severity}
                          </span>
                          <span className="text-xs font-mono text-slate-500">{inc.id}</span>
                          <span className="text-xs text-slate-400">• {inc.timestamp}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm">{inc.title}</h4>
                        <p className="text-xs text-slate-400">{inc.description}</p>
                        <p className="text-[11px] text-amber-400/80">Location: {inc.location} • Reported by: {inc.reportedBy}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setIncidents(incidents.map(i => i.id === inc.id ? { ...i, status: 'Resolved' } : i));
                          }}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                            inc.status === 'Resolved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-white/[0.04] text-slate-300 hover:text-white border-white/[0.08]'
                          }`}
                        >
                          {inc.status === 'Resolved' ? '✓ Resolved' : 'Mark Resolved'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: OPERATOR COMMS CHAT */}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col max-w-5xl mx-auto">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                  <MessageSquare className="w-6 h-6 text-amber-400" />
                  System Operator Communications
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  High-priority real-time dispatch channel with faculty members and security patrols.
                </p>
              </div>
              <div className="flex-1 bg-[#090c14] border border-white/[0.08] rounded-3xl overflow-hidden min-h-[500px]">
                <Chat userName={adminName} />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Camera Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0e121b] border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-400" />
                  Register New Camera Node
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-500 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddNode} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-1">Room / Node Identifier</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 104 or Exam Center 21"
                    value={newNode.number}
                    onChange={(e) => setNewNode({ ...newNode, number: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-1">Department</label>
                  <select
                    value={newNode.dept}
                    onChange={(e) => setNewNode({ ...newNode, dept: e.target.value })}
                    className="w-full bg-[#0e121b] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option>Computer Science</option>
                    <option>Mechanical Eng.</option>
                    <option>Assessment Center</option>
                    <option>Main Administration</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Resolution</label>
                    <select
                      value={newNode.resolution}
                      onChange={(e) => setNewNode({ ...newNode, resolution: e.target.value })}
                      className="w-full bg-[#0e121b] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white focus:outline-none"
                    >
                      <option>1080p Full HD</option>
                      <option>4K UHD</option>
                      <option>720p HD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Frame Rate (FPS)</label>
                    <input
                      type="number"
                      value={newNode.fps}
                      onChange={(e) => setNewNode({ ...newNode, fps: Number(e.target.value) })}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-1">IP Address</label>
                  <input
                    type="text"
                    value={newNode.ipAddress}
                    onChange={(e) => setNewNode({ ...newNode, ipAddress: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    Deploy Node
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High-Definition Captured Image View Modal / Lightbox */}
      <AnimatePresence>
        {selectedViewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-[#090c14] border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 sm:px-6 bg-[#0c101c] flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                      {selectedViewImage.loc}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-normal">
                        {selectedViewImage.type}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Department: {selectedViewImage.dept} • Captured at: {selectedViewImage.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const rawImg = (selectedViewImage as any).image_url || selectedViewImage.imageUrl || '';
                      handleDownloadPhoto(getImageUrl(rawImg), `${selectedViewImage.loc.replace(/\s+/g, '_')}_capture.jpg`);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download HD</span>
                  </button>

                  <button
                    onClick={() => setImageToDelete(selectedViewImage)}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold rounded-xl border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Delete this captured image (Admin only)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>

                  <button
                    onClick={() => setSelectedViewImage(null)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Image Viewport */}
              <div className="relative bg-black flex items-center justify-center p-2 min-h-[360px] max-h-[70vh] overflow-hidden">
                <img
                  src={getImageUrl((selectedViewImage as any).image_url || selectedViewImage.imageUrl || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80')}
                  alt={selectedViewImage.loc}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true';
                      const raw = (selectedViewImage as any).image_url || selectedViewImage.imageUrl || '';
                      target.src = getImageUrl(raw, true);
                    }
                  }}
                  className="max-h-[65vh] w-auto object-contain rounded-xl shadow-2xl"
                />
              </div>

              {/* Modal Footer Info Bar */}
              <div className="p-4 bg-[#0a0d16] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                  <span>Resolution: <strong className="text-white">1920x1080 Full HD</strong></span>
                  <span>•</span>
                  <span>Format: <strong className="text-white">JPEG / Lossless</strong></span>
                  <span>•</span>
                  <span>Storage: <strong className="text-emerald-400">MySQL Database (Archived)</strong></span>
                </div>

                <button
                  onClick={() => setSelectedViewImage(null)}
                  className="px-4 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-bold rounded-xl border border-white/10 cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION MODAL FOR ADMIN DELETION */}
      <AnimatePresence>
        {imageToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#0d111d] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3.5 text-rose-400">
                <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Captured Image</h3>
                  <p className="text-[11px] text-rose-400/90 font-mono">Admin Authorization Required</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-slate-100 font-semibold leading-relaxed">
                  Are you sure you want to delete this captured image?
                </p>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-mono">Image ID:</span>
                    <span className="font-mono text-amber-400 font-bold">#{imageToDelete.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-semibold text-slate-200">{imageToDelete.loc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Detection Type:</span>
                    <span className="text-slate-200">{imageToDelete.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Timestamp:</span>
                    <span className="text-slate-200">{imageToDelete.time}</span>
                  </div>
                </div>

                <p className="text-[11px] text-rose-300/80 leading-normal flex items-start gap-1.5">
                  <span>⚠️</span>
                  <span>This action is permanent and will delete the database record, alert log, and physical file from server storage.</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setImageToDelete(null)}
                  className="px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-bold rounded-xl border border-white/[0.08] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Image'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav 
        aria-label="Admin Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#090c14]/95 border-t border-amber-500/20 backdrop-blur-xl px-2 pt-2 pb-1"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab('nodes')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all cursor-pointer ${
              activeTab === 'nodes' ? 'text-amber-400 font-bold' : 'text-slate-400 opacity-70'
            }`}
          >
            <Cpu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Nodes</span>
          </button>

          <button
            onClick={() => setActiveTab('images')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all cursor-pointer ${
              activeTab === 'images' ? 'text-amber-400 font-bold' : 'text-slate-400 opacity-70'
            }`}
          >
            <ImageIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Images</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all cursor-pointer ${
              activeTab === 'users' ? 'text-amber-400 font-bold' : 'text-slate-400 opacity-70'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Users</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all cursor-pointer ${
              activeTab === 'alerts' ? 'text-amber-400 font-bold' : 'text-slate-400 opacity-70'
            }`}
          >
            <div className="relative">
              <AlertTriangle className="w-5 h-5 mb-0.5" />
              {incidents.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 rounded-full min-w-[15px] text-center">
                  {incidents.length}
                </span>
              )}
            </div>
            <span className="text-[10px]">Alerts</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-amber-400/90 hover:text-amber-300 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">All (7)</span>
          </button>
        </div>
      </nav>

      {/* Backend Server Configuration Modal for Mobile Sync */}
      <ServerConfigModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        isDarkMode={true}
      />

      {/* Real-Time Live Capture Notification Banner */}
      <CaptureNotificationToast
        alert={latestAlertToast}
        onClose={() => setLatestAlertToast(null)}
        onView={(alert) => {
          setSelectedViewImage(alert);
          setActiveTab('images');
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          if (next) playDetectionAlertSound();
        }}
      />
    </div>
  );
}
