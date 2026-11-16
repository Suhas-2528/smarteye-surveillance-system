import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  School, 
  MonitorPlay, 
  Image as ImageIcon, 
  MessageSquare, 
  ShieldAlert, 
  LogOut, 
  Search, 
  Download, 
  Check, 
  Camera, 
  Radio, 
  AlertCircle, 
  Send, 
  ArrowLeft, 
  Maximize2, 
  Sparkles, 
  Eye, 
  X,
  SlidersHorizontal,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Bell,
  LayoutDashboard,
  User,
  Settings,
  Sun,
  Moon,
  Wifi,
  Server,
  Save,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Phone,
  FileText,
  AlertTriangle,
  Lock,
  HardDrive
} from 'lucide-react';
import { 
  CapturedPicture, 
  SavedPicture, 
  AlertRecord, 
  IncidentReport, 
  MobileTab 
} from '../../types';
import { apiFetch, getImageUrl, apiUrl } from '../../api';
import Chat from '../Chat';
import MobileHeader from '../mobile/MobileHeader';
import MobileNavBar from '../mobile/MobileNavBar';
import MobileDrawer from '../mobile/MobileDrawer';
import ServerConfigModal from '../mobile/ServerConfigModal';
import CaptureNotificationToast from '../common/CaptureNotificationToast';
import { 
  playDetectionAlertSound, 
  triggerHapticFeedback, 
  sendSystemNotification, 
  requestNotificationPermission 
} from '../../utils/notifications';

interface UserDashboardProps {
  facultyName: string;
  onLogout: () => void;
  onSwitchPortal: () => void;
}

const sampleClassrooms = [
  { id: 'cs-101', room: 'Room 101', dept: 'Computer Science', type: 'Lecture Hall', status: 'In Session', instructor: 'Dr. Vance', students: 48, feedUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80' },
  { id: 'cs-102', room: 'Room 102', dept: 'Computer Science', type: 'AI & Robotics Lab', status: 'In Session', instructor: 'Prof. Jenkins', students: 32, feedUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80' },
  { id: 'cs-103', room: 'Room 103', dept: 'Computer Science', type: 'Seminar Hall', status: 'Available', instructor: 'None', students: 0, feedUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80' },
  { id: 'me-201', room: 'Room 201', dept: 'Mechanical Eng.', type: 'Fluid Dynamics Lab', status: 'In Session', instructor: 'Dr. Michael Chen', students: 26, feedUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80' },
  { id: 'me-202', room: 'Room 202', dept: 'Mechanical Eng.', type: 'CAD Design Center', status: 'In Session', instructor: 'Prof. Davis', students: 38, feedUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80' },
  { id: 'exam-01', room: 'Assessment Room 1', dept: 'Assessment Center', type: 'Main Exam Hall', status: 'Exam In Progress', instructor: 'Invigilator Team A', students: 60, feedUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' },
  { id: 'exam-05', room: 'Assessment Room 5', dept: 'Assessment Center', type: 'Special Evaluation', status: 'Exam In Progress', instructor: 'Invigilator Team B', students: 40, feedUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80' },
  { id: 'exam-12', room: 'Assessment Room 12', dept: 'Assessment Center', type: 'Quiet Center', status: 'Available', instructor: 'None', students: 0, feedUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80' }
];

const sampleDefaultAlerts: AlertRecord[] = [
  { id: 101, room: 'Assessment Room 1', detection: 'Mobile Phone Detected', confidence: '0.96', timestamp: '10:44 AM', imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80', severity: 'Critical', status: 'Active', dept: 'Assessment Center' },
  { id: 102, room: 'Room 101', detection: 'Chit/Paper Detected', confidence: '0.91', timestamp: '10:18 AM', imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80', severity: 'High', status: 'Active', dept: 'Computer Science' },
  { id: 103, room: 'Room 202', detection: 'Sleeping Detected', confidence: '0.88', timestamp: '09:35 AM', imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80', severity: 'Medium', status: 'Resolved', dept: 'Mechanical Eng.' },
  { id: 104, room: 'Assessment Room 5', detection: 'Malpractice Detected', confidence: '0.94', timestamp: '09:12 AM', imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80', severity: 'Critical', status: 'Active', dept: 'Assessment Center' }
];

export default function UserDashboard({ facultyName, onLogout, onSwitchPortal }: UserDashboardProps) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<MobileTab>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Data Stores
  const [pictures, setPictures] = useState<CapturedPicture[]>([]);
  const [savedPictures, setSavedPictures] = useState<SavedPicture[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>(sampleDefaultAlerts);
  const [facultyIncidents, setFacultyIncidents] = useState<IncidentReport[]>([]);

  // Filtering & Search
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [imageDeptFilter, setImageDeptFilter] = useState<string>('All');
  const [alertFilter, setAlertFilter] = useState<string>('All');
  const [globalSearch, setGlobalSearch] = useState('');

  // Modals & Feedback
  const [snapshotFeedback, setSnapshotFeedback] = useState<string | null>(null);
  const [zoomedFeed, setZoomedFeed] = useState<any | null>(null);
  const [selectedViewImage, setSelectedViewImage] = useState<CapturedPicture | SavedPicture | null>(null);
  const [savedAlertFeedback, setSavedAlertFeedback] = useState<string | null>(null);

  // Incident Form
  const [reportTitle, setReportTitle] = useState('');
  const [reportLocation, setReportLocation] = useState('Room 101');
  const [reportSeverity, setReportSeverity] = useState<'Low' | 'Medium' | 'Critical'>('Medium');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Settings State
  const [settingsResolution, setSettingsResolution] = useState('1080p');
  const [settingsPushAlerts, setSettingsPushAlerts] = useState(true);
  const [settingsSoundAlerts, setSettingsSoundAlerts] = useState(true);
  const [settingsVibration, setSettingsVibration] = useState(true);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  // Real-Time Notification Toast
  const [latestAlertToast, setLatestAlertToast] = useState<any | null>(null);
  const prevPicIdsRef = useRef<Set<number | string>>(new Set());
  const isFirstPicLoadRef = useRef<boolean>(true);

  // Initial load & real-time polling
  useEffect(() => {
    requestNotificationPermission();
    fetchPictures();
    fetchSavedPictures();
    fetchAlerts();
    fetchFacultyIncidents();

    const interval = setInterval(() => {
      fetchPictures();
      fetchSavedPictures();
      fetchAlerts();
    }, 3000);

    return () => clearInterval(interval);
  }, [settingsSoundAlerts, settingsVibration, settingsPushAlerts]);

  const fetchPictures = () => {
    apiFetch('/api/pictures')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPictures(data);

          if (isFirstPicLoadRef.current) {
            data.forEach(p => prevPicIdsRef.current.add(p.id));
            isFirstPicLoadRef.current = false;
          } else {
            const newCaptures = data.filter(p => !prevPicIdsRef.current.has(p.id));
            if (newCaptures.length > 0) {
              newCaptures.forEach(p => prevPicIdsRef.current.add(p.id));
              const newest = newCaptures[0];

              if (settingsSoundAlerts) {
                playDetectionAlertSound();
              }
              if (settingsVibration) {
                triggerHapticFeedback();
              }
              if (settingsPushAlerts) {
                sendSystemNotification('🚨 SmartEye: Phone Detected!', {
                  body: `${newest.loc || 'Exam Hall'}: ${newest.type || 'Phone Detected'} at ${newest.time}`,
                  icon: '/favicon.ico'
                });
              }
              setLatestAlertToast(newest);
            }
          }
        }
      })
      .catch(err => console.error('fetchPictures err:', err));
  };

  const fetchSavedPictures = () => {
    apiFetch('/api/saved-pictures')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSavedPictures(data);
      })
      .catch(err => console.error('fetchSavedPictures err:', err));
  };

  const fetchAlerts = () => {
    apiFetch('/api/alerts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAlerts(data);
        }
      })
      .catch(err => console.error('fetchAlerts err:', err));
  };

  const fetchFacultyIncidents = () => {
    apiFetch('/api/incidents')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setFacultyIncidents(data);
      })
      .catch(err => console.error('fetchIncidents err:', err));
  };

  // Snapshot capture from camera feed
  const handleCaptureSnapshot = (classroom: any) => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    apiFetch('/api/pictures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loc: classroom.room,
        dept: classroom.dept,
        type: classroom.type,
        time: timeString,
        imageUrl: classroom.feedUrl
      })
    })
      .then(res => res.json())
      .then(saved => {
        setPictures(prev => [saved, ...prev]);
        setSnapshotFeedback(`Snapshot archived for ${classroom.room}`);
        setTimeout(() => setSnapshotFeedback(null), 3000);
      })
      .catch(err => console.error('Snapshot capture err:', err));
  };

  // Save image to Saved Images collection
  const handleSavePicture = (pic: CapturedPicture | AlertRecord) => {
    const targetImageUrl = pic.imageUrl || (pic as any).image_url;
    const targetRoom = (pic as any).loc || (pic as any).room || 'Room 101';
    const targetDept = (pic as any).dept || 'Surveillance';
    const targetType = (pic as any).type || (pic as any).detection || 'Saved Evidence';
    const targetTime = (pic as any).time || (pic as any).timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    apiFetch('/api/saved-pictures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pictureId: pic.id,
        loc: targetRoom,
        dept: targetDept,
        type: targetType,
        time: targetTime,
        imageUrl: targetImageUrl
      })
    })
      .then(res => res.json())
      .then(saved => {
        setSavedPictures(prev => [saved, ...prev]);
        setSavedAlertFeedback(`Image saved to Saved Images collection!`);
        setTimeout(() => setSavedAlertFeedback(null), 3000);
      })
      .catch(err => console.error('Save picture err:', err));
  };

  // Delete saved picture
  const handleDeleteSavedPicture = (id: string | number) => {
    apiFetch(`/api/saved-pictures/${id}`, { method: 'DELETE' })
      .then(() => {
        setSavedPictures(prev => prev.filter(p => String(p.id) !== String(id)));
        setSavedAlertFeedback(`Removed from Saved Images`);
        setTimeout(() => setSavedAlertFeedback(null), 2500);
      })
      .catch(err => console.error('Delete saved err:', err));
  };

  // Download photo file
  const handleDownloadPhoto = async (url: string, filename: string) => {
    try {
      const fullUrl = getImageUrl(url);
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'smarteye_evidence.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(getImageUrl(url), '_blank');
    }
  };

  // Incident submission
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle || !reportDesc) return;

    apiFetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: reportTitle,
        location: reportLocation,
        reportedBy: facultyName,
        severity: reportSeverity,
        description: reportDesc
      })
    })
      .then(res => res.json())
      .then(newInc => {
        setFacultyIncidents(prev => [newInc, ...prev]);
        setReportSuccess(true);
        setReportTitle('');
        setReportDesc('');
        setTimeout(() => setReportSuccess(false), 3500);
      });
  };

  // Filtered cameras
  const filteredClassrooms = sampleClassrooms.filter(c => {
    const matchesDept = selectedDept === 'All' || c.dept === selectedDept;
    const matchesSearch = c.room.toLowerCase().includes(feedSearchQuery.toLowerCase()) || 
                          c.instructor.toLowerCase().includes(feedSearchQuery.toLowerCase()) ||
                          c.dept.toLowerCase().includes(feedSearchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Filtered captured pictures
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

  // Filtered alerts
  const filteredAlerts = alerts.filter(a => {
    if (alertFilter === 'All') return true;
    if (alertFilter === 'Active') return a.status !== 'Resolved';
    if (alertFilter === 'Resolved') return a.status === 'Resolved';
    if (alertFilter === 'Critical') return a.severity === 'Critical';
    if (alertFilter === 'Phone') return a.detection.toLowerCase().includes('phone');
    if (alertFilter === 'Paper') return a.detection.toLowerCase().includes('chit') || a.detection.toLowerCase().includes('paper');
    if (alertFilter === 'Sleeping') return a.detection.toLowerCase().includes('sleep');
    return a.severity === alertFilter || a.detection.toLowerCase().includes(alertFilter.toLowerCase());
  });

  // Global search results across cameras and archives
  const searchResultsCameras = sampleClassrooms.filter(c => 
    !globalSearch || 
    c.room.toLowerCase().includes(globalSearch.toLowerCase()) ||
    c.dept.toLowerCase().includes(globalSearch.toLowerCase()) ||
    c.type.toLowerCase().includes(globalSearch.toLowerCase()) ||
    c.instructor.toLowerCase().includes(globalSearch.toLowerCase())
  );

  const searchResultsPictures = pictures.filter(p =>
    globalSearch && (
      p.loc?.toLowerCase().includes(globalSearch.toLowerCase()) ||
      p.dept?.toLowerCase().includes(globalSearch.toLowerCase()) ||
      p.type?.toLowerCase().includes(globalSearch.toLowerCase())
    )
  );

  // Active alerts count
  const activeAlertCount = alerts.filter(a => a.status !== 'Resolved').length;

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors select-none ${
      isDarkMode ? 'bg-[#060911] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Toast Feedbacks */}
      <AnimatePresence>
        {(snapshotFeedback || savedAlertFeedback) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2 border border-blue-400/40"
          >
            <CheckCircle2 size={16} />
            <span>{snapshotFeedback || savedAlertFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Server Configuration Modal */}
      <ServerConfigModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Real-time Detection Alert Toast */}
      <CaptureNotificationToast
        alert={latestAlertToast}
        onClose={() => setLatestAlertToast(null)}
        onView={(alert) => {
          setSelectedViewImage(alert);
          setActiveTab('images');
        }}
        soundEnabled={settingsSoundAlerts}
        onToggleSound={() => setSettingsSoundAlerts(!settingsSoundAlerts)}
      />

      {/* Mobile Top App Bar */}
      <MobileHeader
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenServerConfig={() => setIsServerModalOpen(true)}
        onOpenSearch={() => setActiveTab('search')}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        alertCount={activeAlertCount}
        onSwitchPortal={onSwitchPortal}
      />

      {/* Mobile Slide-out Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        facultyName={facultyName}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenServerConfig={() => setIsServerModalOpen(true)}
        onLogout={onLogout}
        onSwitchPortal={onSwitchPortal}
        alertCount={activeAlertCount}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto pb-20 md:pb-6">
        
        {/* Desktop Sidebar (visible on md: screens and above) */}
        <aside className={`hidden md:flex flex-col justify-between w-64 p-4 border-r ${
          isDarkMode ? 'border-white/10 bg-[#090d16]' : 'border-slate-200 bg-white'
        }`}>
          <div>
            {/* Desktop Brand */}
            <div className="flex items-center gap-3 px-3 py-3 mb-6">
              <img src="/logo-icon-light.png" alt="SmartEye" className="w-8 h-8 object-contain drop-shadow" />
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  Smart<span className="text-teal-400">Eye</span>
                </h2>
                <p className="text-[10px] text-teal-400 font-semibold tracking-wider uppercase">Faculty Station</p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="space-y-1">
              {[
                { id: 'dashboard' as MobileTab, label: 'Dashboard', icon: LayoutDashboard },
                { id: 'live' as MobileTab, label: 'Live Monitoring', icon: MonitorPlay },
                { id: 'alerts' as MobileTab, label: 'Alerts', icon: ShieldAlert, badge: activeAlertCount },
                { id: 'captured' as MobileTab, label: 'Captured Images', icon: ImageIcon },
                { id: 'saved' as MobileTab, label: 'Saved Images', icon: Bookmark, badge: savedPictures.length },
                { id: 'search' as MobileTab, label: 'Search Cameras', icon: Search },
                { id: 'chat' as MobileTab, label: 'AI Assistant', icon: MessageSquare },
                { id: 'incident' as MobileTab, label: 'Report Incident', icon: AlertCircle },
                { id: 'profile' as MobileTab, label: 'Faculty Profile', icon: User },
                { id: 'settings' as MobileTab, label: 'Settings', icon: Settings },
              ].map(item => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : isDarkMode
                        ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={isActive ? 'text-white' : 'opacity-70'} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.id === 'alerts' ? 'bg-rose-500 text-white' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Desktop Footer Actions */}
          <div className="space-y-2 pt-4 border-t border-white/10">
            <button
              onClick={() => setIsServerModalOpen(true)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border ${
                isDarkMode ? 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5' : 'border-cyan-300 text-cyan-700 bg-cyan-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Server size={15} />
                <span>Server Setup</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium border ${
                isDarkMode ? 'border-white/10 text-slate-300 bg-white/5' : 'border-slate-200 text-slate-700 bg-slate-50'
              }`}
            >
              {isDarkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
            >
              <LogOut size={16} />
              <span>Logout Faculty</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-5xl mx-auto w-full">

          {/* 1. DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Welcome Banner */}
              <div className={`p-5 rounded-3xl border relative overflow-hidden ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-950/60 to-[#0c1222] border-blue-500/30 shadow-xl' 
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 shadow-sm'
              }`}>
                <div className="relative z-10">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    Smart AI Surveillance
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold mt-2">
                    Welcome, {facultyName || 'Faculty Member'} 👋
                  </h2>
                  <p className="text-xs opacity-70 mt-1 max-w-lg">
                    Autonomous AI camera feeds, real-time malpractice detection, and evidence snapshots active.
                  </p>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Total Cameras */}
                <div 
                  onClick={() => setActiveTab('live')}
                  className={`p-4 rounded-2xl border transition-all active:scale-98 cursor-pointer ${
                    isDarkMode ? 'bg-[#0c101c] border-white/10 hover:border-blue-500/40' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold opacity-70">Total Cameras</span>
                    <Camera size={16} className="text-blue-400" />
                  </div>
                  <p className="text-2xl font-extrabold">{sampleClassrooms.length}</p>
                  <p className="text-[10px] text-emerald-400 mt-1">● 100% Monitored</p>
                </div>

                {/* Active Cameras */}
                <div 
                  onClick={() => setActiveTab('live')}
                  className={`p-4 rounded-2xl border transition-all active:scale-98 cursor-pointer ${
                    isDarkMode ? 'bg-[#0c101c] border-white/10 hover:border-blue-500/40' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold opacity-70">Active Cameras</span>
                    <Radio size={16} className="text-emerald-400" />
                  </div>
                  <p className="text-2xl font-extrabold">6</p>
                  <p className="text-[10px] text-blue-400 mt-1">2 in standby</p>
                </div>

                {/* Recent Alerts */}
                <div 
                  onClick={() => setActiveTab('alerts')}
                  className={`p-4 rounded-2xl border transition-all active:scale-98 cursor-pointer ${
                    isDarkMode ? 'bg-[#0c101c] border-rose-500/30 bg-rose-950/10' : 'bg-rose-50 border-rose-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-rose-400">Recent Alerts</span>
                    <ShieldAlert size={16} className="text-rose-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-rose-400">{alerts.length}</p>
                  <p className="text-[10px] text-rose-400 mt-1">{activeAlertCount} active</p>
                </div>

                {/* Captured Images */}
                <div 
                  onClick={() => setActiveTab('captured')}
                  className={`p-4 rounded-2xl border transition-all active:scale-98 cursor-pointer ${
                    isDarkMode ? 'bg-[#0c101c] border-white/10 hover:border-blue-500/40' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold opacity-70">Captured Images</span>
                    <ImageIcon size={16} className="text-purple-400" />
                  </div>
                  <p className="text-2xl font-extrabold">{pictures.length}</p>
                  <p className="text-[10px] text-purple-400 mt-1">Live AI snapshots</p>
                </div>

                {/* Saved Images */}
                <div 
                  onClick={() => setActiveTab('saved')}
                  className={`p-4 rounded-2xl border col-span-2 sm:col-span-1 transition-all active:scale-98 cursor-pointer ${
                    isDarkMode ? 'bg-[#0c101c] border-amber-500/30 bg-amber-950/10' : 'bg-amber-50 border-amber-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-amber-400">Saved Images</span>
                    <Bookmark size={16} className="text-amber-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-amber-400">{savedPictures.length}</p>
                  <p className="text-[10px] text-amber-400 mt-1">Bookmarked</p>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2.5">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => setActiveTab('live')}
                    className={`p-3.5 rounded-2xl border text-left transition-all active:scale-98 flex items-center gap-3 ${
                      isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <MonitorPlay size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Live Monitoring</p>
                      <p className="text-[10px] opacity-60">View all 8 feeds</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('alerts')}
                    className={`p-3.5 rounded-2xl border text-left transition-all active:scale-98 flex items-center gap-3 ${
                      isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Review Alerts</p>
                      <p className="text-[10px] opacity-60">{activeAlertCount} active items</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`p-3.5 rounded-2xl border text-left transition-all active:scale-98 flex items-center gap-3 ${
                      isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Bookmark size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Saved Evidence</p>
                      <p className="text-[10px] opacity-60">{savedPictures.length} archived</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('incident')}
                    className={`p-3.5 rounded-2xl border text-left transition-all active:scale-98 flex items-center gap-3 ${
                      isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Report Incident</p>
                      <p className="text-[10px] opacity-60">Log violation</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Alerts Feed */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">
                    Recent AI Malpractice Alerts
                  </h3>
                  <button 
                    onClick={() => setActiveTab('alerts')}
                    className="text-xs text-blue-400 font-bold hover:underline"
                  >
                    See all ({alerts.length})
                  </button>
                </div>

                <div className="space-y-2.5">
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        isDarkMode ? 'bg-[#0a0e1a] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10">
                          <img
                            src={getImageUrl(alert.imageUrl || (alert as any).image_url)}
                            alt={alert.detection}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-rose-400">{alert.detection}</p>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                              {alert.severity || 'Critical'}
                            </span>
                          </div>
                          <p className="text-[11px] opacity-70 mt-0.5">{alert.room} • {alert.timestamp}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSavePicture(alert)}
                        title="Save to Saved Images"
                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-amber-500/20 hover:text-amber-400 transition-colors active:scale-95"
                      >
                        <Bookmark size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. LIVE MONITORING VIEW */}
          {activeTab === 'live' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">Live Camera Monitoring</h2>
                  <p className="text-xs opacity-60">High-definition AI camera streams from all lecture halls.</p>
                </div>

                {/* Search in Live */}
                <div className="relative w-full sm:w-60">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    value={feedSearchQuery}
                    onChange={(e) => setFeedSearchQuery(e.target.value)}
                    placeholder="Search room or instructor..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-blue-500 ${
                      isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Department Filter Chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['All', 'Computer Science', 'Mechanical Eng.', 'Assessment Center'].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                      selectedDept === dept
                        ? 'bg-blue-600 text-white shadow-md'
                        : isDarkMode
                        ? 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                        : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              {/* Camera Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredClassrooms.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-2xl border overflow-hidden transition-all ${
                      isDarkMode ? 'bg-[#090d16] border-white/10 hover:border-blue-500/40' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    {/* Video / Feed Header & Badge */}
                    <div className="relative aspect-video bg-black overflow-hidden group">
                      <img
                        src={c.feedUrl}
                        alt={c.room}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Radar scanline aesthetic */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none animate-pulse" />

                      {/* Live Badge */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span>LIVE</span>
                      </div>

                      {/* Status Tag */}
                      <div className="absolute top-2.5 right-2.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border ${
                          c.status === 'In Session'
                            ? 'bg-blue-500/30 border-blue-400/40 text-blue-300'
                            : c.status === 'Exam In Progress'
                            ? 'bg-amber-500/30 border-amber-400/40 text-amber-300'
                            : 'bg-emerald-500/30 border-emerald-400/40 text-emerald-300'
                        }`}>
                          {c.status}
                        </span>
                      </div>

                      {/* Tap to Zoom trigger */}
                      <button
                        onClick={() => setZoomedFeed(c)}
                        aria-label="Enlarge Feed"
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-xs transition-opacity"
                      >
                        <div className="p-3 rounded-full bg-white/20 text-white backdrop-blur-md">
                          <Maximize2 size={22} />
                        </div>
                      </button>
                    </div>

                    {/* Camera Info & Controls */}
                    <div className="p-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-sm">{c.room}</h3>
                          <p className="text-[11px] opacity-60">{c.dept} • {c.type}</p>
                        </div>
                        <p className="text-xs font-semibold text-blue-400">{c.instructor}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleCaptureSnapshot(c)}
                          className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <Camera size={14} />
                          <span>Capture Snapshot</span>
                        </button>

                        <button
                          onClick={() => setZoomedFeed(c)}
                          className={`p-2 rounded-xl border font-bold text-xs flex items-center justify-center transition-all active:scale-95 ${
                            isDarkMode ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Maximize2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. ALERTS VIEW */}
          {activeTab === 'alerts' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">AI Surveillance Alerts</h2>
                  <p className="text-xs opacity-60">Malpractice and prohibited activity detections logged in real time.</p>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {['All', 'Active', 'Critical', 'Phone', 'Paper', 'Sleeping'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAlertFilter(filter)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                        alertFilter === filter
                          ? 'bg-rose-600 text-white shadow-md'
                          : isDarkMode
                          ? 'bg-white/5 border border-white/10 text-slate-300'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alert Cards */}
              <div className="space-y-3">
                {filteredAlerts.length === 0 ? (
                  <div className={`p-8 rounded-3xl border text-center ${
                    isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white'
                  }`}>
                    <ShieldAlert size={36} className="mx-auto text-emerald-400 mb-2 opacity-80" />
                    <h3 className="font-bold text-sm">No alerts matching filter</h3>
                    <p className="text-xs opacity-60 mt-1">All monitored classrooms currently compliant.</p>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        alert.status === 'Resolved'
                          ? isDarkMode ? 'bg-[#080c14]/60 border-white/5 opacity-75' : 'bg-slate-50 border-slate-200 opacity-75'
                          : isDarkMode ? 'bg-[#0a0e1a] border-rose-500/30' : 'bg-white border-rose-200 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div 
                            onClick={() => setSelectedViewImage(alert as any)}
                            className="w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 cursor-pointer relative group"
                          >
                            <img
                              src={getImageUrl(alert.imageUrl || (alert as any).image_url)}
                              alt={alert.detection}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye size={16} className="text-white" />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-rose-400">{alert.detection}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300">
                                {alert.severity || 'High'}
                              </span>
                            </div>
                            <p className="text-xs font-semibold opacity-80 mt-1">
                              {alert.room} • {alert.timestamp}
                            </p>
                            <p className="text-[11px] opacity-50">
                              Confidence: {alert.confidence ? `${Math.round(Number(alert.confidence) * 100)}%` : '95%'}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                          <button
                            onClick={() => handleSavePicture(alert)}
                            className="py-2 px-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-500/30 active:scale-95 transition-all"
                          >
                            <Bookmark size={14} />
                            <span>Save</span>
                          </button>

                          <button
                            onClick={() => {
                              setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: a.status === 'Resolved' ? 'Active' : 'Resolved' } : a));
                            }}
                            className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all active:scale-95 ${
                              alert.status === 'Resolved'
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                : isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            {alert.status === 'Resolved' ? 'Resolved ✓' : 'Mark Resolved'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. CAPTURED IMAGES VIEW */}
          {activeTab === 'captured' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">Captured Snapshot Archive</h2>
                  <p className="text-xs opacity-60">Automatic and manual snapshots archived by faculty & AI engine.</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-60">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    value={imageSearchQuery}
                    onChange={(e) => setImageSearchQuery(e.target.value)}
                    placeholder="Search captured images..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-blue-500 ${
                      isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Department Filter Chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['All', 'Computer Science', 'Mechanical Eng.', 'Assessment Center', 'YOLO AI Detection'].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setImageDeptFilter(dept)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                      imageDeptFilter === dept
                        ? 'bg-blue-600 text-white shadow-md'
                        : isDarkMode
                        ? 'bg-white/5 border border-white/10 text-slate-300'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              {/* Captured Images Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPictures.length === 0 ? (
                  <div className={`col-span-full p-8 rounded-3xl border text-center ${
                    isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white'
                  }`}>
                    <ImageIcon size={36} className="mx-auto opacity-40 mb-2" />
                    <p className="text-xs opacity-60">No captured images found.</p>
                  </div>
                ) : (
                  filteredPictures.map((pic) => (
                    <div
                      key={pic.id}
                      className={`rounded-2xl border overflow-hidden transition-all flex flex-col justify-between ${
                        isDarkMode ? 'bg-[#090d16] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div 
                        onClick={() => setSelectedViewImage(pic)}
                        className="relative aspect-video bg-black cursor-pointer group overflow-hidden"
                      >
                        <img
                          src={getImageUrl(pic.imageUrl || pic.image_url)}
                          alt={pic.loc}
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.triedFallback) {
                              target.dataset.triedFallback = 'true';
                              target.src = getImageUrl(pic.imageUrl || pic.image_url, true);
                            }
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye size={22} className="text-white" />
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white">
                          {pic.time}
                        </div>
                      </div>

                      <div className="p-3.5 space-y-3">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs">{pic.loc}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                              {pic.type}
                            </span>
                          </div>
                          <p className="text-[11px] opacity-60 mt-0.5">{pic.dept}</p>
                        </div>

                        {/* Save & Download Actions */}
                        <div className="flex gap-2 pt-1 border-t border-white/10">
                          <button
                            onClick={() => handleSavePicture(pic)}
                            className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          >
                            <Bookmark size={14} />
                            <span>Save</span>
                          </button>

                          <button
                            onClick={() => handleDownloadPhoto(pic.imageUrl || (pic as any).image_url, `capture_${pic.id}.jpg`)}
                            className={`p-2 rounded-xl border font-bold text-xs flex items-center justify-center transition-all active:scale-95 ${
                              isDarkMode ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 5. SAVED IMAGES VIEW */}
          {activeTab === 'saved' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <Bookmark className="text-amber-400" size={20} />
                    Saved Images Collection
                  </h2>
                  <p className="text-xs opacity-60">Evidence and snapshots bookmarked for records and investigation.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {savedPictures.length} Saved
                </span>
              </div>

              {/* Saved Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPictures.length === 0 ? (
                  <div className={`col-span-full p-10 rounded-3xl border text-center ${
                    isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white'
                  }`}>
                    <Bookmark size={40} className="mx-auto text-amber-400/50 mb-2" />
                    <h3 className="font-bold text-sm">No Saved Images Yet</h3>
                    <p className="text-xs opacity-60 mt-1 max-w-sm mx-auto">
                      Tap the &quot;Save&quot; button on any alert or captured snapshot to bookmark it permanently here.
                    </p>
                  </div>
                ) : (
                  savedPictures.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all ${
                        isDarkMode ? 'bg-[#090d16] border-amber-500/30 shadow-lg' : 'bg-white border-amber-200 shadow-sm'
                      }`}
                    >
                      <div 
                        onClick={() => setSelectedViewImage(item as any)}
                        className="relative aspect-video bg-black cursor-pointer group overflow-hidden"
                      >
                        <img
                          src={getImageUrl(item.imageUrl || item.image_url)}
                          alt={item.loc}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-extrabold text-[9px]">
                          SAVED
                        </div>
                      </div>

                      <div className="p-3.5 space-y-3">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs">{item.loc}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-[11px] opacity-60 mt-0.5">{item.dept} • {item.time}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-1 border-t border-white/10">
                          <button
                            onClick={() => handleDownloadPhoto(item.imageUrl || (item as any).image_url, `saved_${item.id}.jpg`)}
                            className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSavedPicture(item.id)}
                            title="Remove from Saved"
                            className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 6. SEARCH VIEW */}
          {activeTab === 'search' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Search Surveillance Network</h2>
                <p className="text-xs opacity-60">Instantly lookup lecture halls, cameras, faculty, and detections.</p>
              </div>

              {/* Big Touch-Friendly Search Input */}
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Type department, room (e.g. Room 101), instructor..."
                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode ? 'bg-white/5 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                  }`}
                />
                {globalSearch && (
                  <button
                    onClick={() => setGlobalSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 opacity-70 hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Quick Suggestion Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['Room 101', 'Assessment Room 1', 'Computer Science', 'Mechanical Eng.', 'Exam Hall', 'Dr. Vance'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setGlobalSearch(tag)}
                    className={`px-3 py-1 rounded-full text-xs border whitespace-nowrap active:scale-95 ${
                      isDarkMode ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    🔍 {tag}
                  </button>
                ))}
              </div>

              {/* Camera Search Results */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">
                  Matching Cameras ({searchResultsCameras.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResultsCameras.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setZoomedFeed(c)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all active:scale-98 ${
                        isDarkMode ? 'bg-[#0a0e1a] border-white/10 hover:border-blue-500/40' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0">
                          <img src={c.feedUrl} alt={c.room} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{c.room}</p>
                          <p className="text-[11px] opacity-60">{c.dept} • {c.instructor}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. PROFILE VIEW */}
          {activeTab === 'profile' && (
            <div className="space-y-5 animate-in fade-in duration-300 max-w-xl mx-auto">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Faculty Member Profile</h2>
                <p className="text-xs opacity-60">Verified credential and active surveillance session details.</p>
              </div>

              {/* Profile Card */}
              <div className={`p-6 rounded-3xl border text-center relative overflow-hidden ${
                isDarkMode ? 'bg-[#0a0e18] border-blue-500/30 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 mb-3">
                  {facultyName ? facultyName.charAt(0).toUpperCase() : 'F'}
                </div>
                <h3 className="text-lg font-bold">{facultyName || 'Faculty Member'}</h3>
                <p className="text-xs text-blue-400 font-semibold">Faculty Invigilator / Proctor</p>
                <p className="text-[11px] opacity-60 mt-0.5">faculty.surveillance@university.edu</p>

                {/* Details List */}
                <div className="mt-6 space-y-2.5 text-left text-xs">
                  <div className={`p-3 rounded-xl border flex justify-between ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                    <span className="opacity-60">Faculty ID</span>
                    <span className="font-mono font-bold">FAC-2026-8841</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex justify-between ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                    <span className="opacity-60">Assigned Department</span>
                    <span className="font-bold">Computer Science & Engineering</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex justify-between ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                    <span className="opacity-60">Active Monitored Rooms</span>
                    <span className="font-bold text-emerald-400">8 Classrooms</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex justify-between ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                    <span className="opacity-60">Security Level</span>
                    <span className="font-bold text-blue-400">Level 2 Proctor</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    onClick={onLogout}
                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-98 transition-all"
                  >
                    <LogOut size={16} />
                    <span>Logout from SmartEye</span>
                  </button>

                  <button
                    onClick={onSwitchPortal}
                    className={`w-full py-2.5 rounded-xl border text-xs font-semibold ${
                      isDarkMode ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Switch to Application Hub
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 8. SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="space-y-5 animate-in fade-in duration-300 max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">Application & System Settings</h2>
                  <p className="text-xs opacity-60">Configure video feeds, network backend, and device preferences.</p>
                </div>

                <button
                  onClick={() => {
                    setSettingsSaveSuccess(true);
                    setTimeout(() => setSettingsSaveSuccess(false), 2500);
                  }}
                  className="py-2 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Save size={14} />
                  <span>{settingsSaveSuccess ? 'Saved!' : 'Save'}</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* 1. Server Network IP Setting */}
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#090d16] border-cyan-500/30' : 'bg-white border-cyan-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Server size={17} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">Backend Server Connection (Mobile IP)</h4>
                        <p className="text-[11px] opacity-60">Connect Android device to PC server via Wi-Fi</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsServerModalOpen(true)}
                      className="py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs active:scale-95 transition-all"
                    >
                      Configure IP
                    </button>
                  </div>
                </div>

                {/* 2. Camera Stream Settings */}
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#090d16] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h4 className="font-bold text-xs mb-3 flex items-center gap-2">
                    <Camera size={16} className="text-blue-400" />
                    Camera Stream Settings
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold opacity-70 mb-1">Default Stream Resolution</label>
                      <select
                        value={settingsResolution}
                        onChange={(e) => setSettingsResolution(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                          isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="720p">720p HD (Low Bandwidth)</option>
                        <option value="1080p">1080p Full HD (Recommended)</option>
                        <option value="4k">4K Ultra HD (High Resolution)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Notification Settings */}
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#090d16] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h4 className="font-bold text-xs mb-3 flex items-center gap-2">
                    <Bell size={16} className="text-amber-400" />
                    Notification & Alert Preferences
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Push alerts on Malpractice</span>
                      <input
                        type="checkbox"
                        checked={settingsPushAlerts}
                        onChange={(e) => setSettingsPushAlerts(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Sound Chime on Critical Alert</span>
                      <input
                        type="checkbox"
                        checked={settingsSoundAlerts}
                        onChange={(e) => setSettingsSoundAlerts(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Vibrate Phone on Mobile Detection</span>
                      <input
                        type="checkbox"
                        checked={settingsVibration}
                        onChange={(e) => setSettingsVibration(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </label>
                  </div>
                </div>

                {/* 4. Theme & Appearance */}
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#090d16] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h4 className="font-bold text-xs mb-3 flex items-center gap-2">
                    {isDarkMode ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
                    Appearance & Theme
                  </h4>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">Active Theme</p>
                      <p className="text-[11px] opacity-60">{isDarkMode ? 'Dark Mode (OLED optimized)' : 'Light Mode'}</p>
                    </div>

                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      Toggle to {isDarkMode ? 'Light' : 'Dark'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 9. AI CHAT ASSISTANT */}
          {activeTab === 'chat' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Sparkles size={20} className="text-blue-400" />
                  SmartEye AI Assistant
                </h2>
                <p className="text-xs opacity-60">Ask questions about camera coverage, exam security, or incident policies.</p>
              </div>
              <Chat userName={facultyName || 'Faculty Member'} />
            </div>
          )}

          {/* 10. INCIDENT REPORTING */}
          {activeTab === 'incident' && (
            <div className="space-y-5 animate-in fade-in duration-300 max-w-xl mx-auto">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Report Proctoring Incident</h2>
                <p className="text-xs opacity-60">Log official violation report directly to the surveillance database.</p>
              </div>

              {reportSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Incident successfully submitted and dispatched to Admin.</span>
                </div>
              )}

              <form onSubmit={handleReportSubmit} className={`p-5 rounded-3xl border space-y-4 ${
                isDarkMode ? 'bg-[#090d16] border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1.5">
                    Incident Title
                  </label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="e.g. Mobile phone malpractice during CS101 exam"
                    className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-blue-500 ${
                      isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1.5">
                      Room / Hall
                    </label>
                    <select
                      value={reportLocation}
                      onChange={(e) => setReportLocation(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none ${
                        isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      {sampleClassrooms.map(c => (
                        <option key={c.id} value={c.room}>{c.room}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1.5">
                      Severity Level
                    </label>
                    <select
                      value={reportSeverity}
                      onChange={(e) => setReportSeverity(e.target.value as any)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none ${
                        isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="Low">Low (Warning)</option>
                      <option value="Medium">Medium (Violation)</option>
                      <option value="Critical">Critical (Severe Malpractice)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1.5">
                    Description & Observations
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="Provide details on student seat number, time observed, and confiscated materials..."
                    className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-blue-500 ${
                      isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-98 transition-all"
                >
                  <Send size={15} />
                  <span>Submit Incident Report</span>
                </button>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        alertCount={activeAlertCount}
        isDarkMode={isDarkMode}
      />

      {/* Lightbox Modal for Zoomed Live Feed */}
      <AnimatePresence>
        {zoomedFeed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl rounded-3xl bg-[#090d16] border border-blue-500/30 overflow-hidden shadow-2xl text-white"
            >
              <div className="relative aspect-video bg-black">
                <img src={zoomedFeed.feedUrl} alt={zoomedFeed.room} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>LIVE FEED: {zoomedFeed.room}</span>
                </div>
                <button
                  onClick={() => setZoomedFeed(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/80 backdrop-blur-md text-white hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{zoomedFeed.room} ({zoomedFeed.dept})</h3>
                  <p className="text-xs opacity-60">Status: {zoomedFeed.status} • Instructor: {zoomedFeed.instructor}</p>
                </div>
                <button
                  onClick={() => {
                    handleCaptureSnapshot(zoomedFeed);
                    setZoomedFeed(null);
                  }}
                  className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <Camera size={15} />
                  <span>Snapshot</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal for Images */}
      <AnimatePresence>
        {selectedViewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-3xl bg-[#090d16] border border-blue-500/30 overflow-hidden shadow-2xl text-white"
            >
              <div className="relative aspect-video bg-black">
                <img
                  src={getImageUrl(selectedViewImage.imageUrl || selectedViewImage.image_url)}
                  alt={selectedViewImage.loc || (selectedViewImage as any).room}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true';
                      target.src = getImageUrl(selectedViewImage.imageUrl || selectedViewImage.image_url, true);
                    }
                  }}
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => setSelectedViewImage(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/80 backdrop-blur-md text-white hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{selectedViewImage.loc || (selectedViewImage as any).room}</h3>
                  <p className="text-xs opacity-60">{selectedViewImage.type || (selectedViewImage as any).detection} • {selectedViewImage.time || (selectedViewImage as any).timestamp}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSavePicture(selectedViewImage as any)}
                    className="py-2 px-3 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-500/30 active:scale-95"
                  >
                    <Bookmark size={14} />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => handleDownloadPhoto(selectedViewImage.imageUrl || selectedViewImage.image_url || '', 'image.jpg')}
                    className="py-2 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
