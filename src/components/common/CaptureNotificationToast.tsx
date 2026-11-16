import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Eye, X, Volume2, VolumeX, Smartphone } from 'lucide-react';
import { getImageUrl } from '../../api';

interface CaptureNotificationToastProps {
  alert: {
    id: number | string;
    loc?: string;
    room?: string;
    type?: string;
    detection?: string;
    time?: string;
    timestamp?: string;
    imageUrl?: string;
    image_url?: string;
    confidence?: string;
  } | null;
  onClose: () => void;
  onView: (alert: any) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function CaptureNotificationToast({
  alert,
  onClose,
  onView,
  soundEnabled,
  onToggleSound
}: CaptureNotificationToastProps) {
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => {
      onClose();
    }, 8000);
    return () => clearTimeout(timer);
  }, [alert, onClose]);

  if (!alert) return null;

  const rawImg = alert.image_url || alert.imageUrl || '';
  const imgUrl = getImageUrl(rawImg);
  const location = alert.loc || alert.room || 'Examination Hall';
  const time = alert.time || alert.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const detectionText = alert.detection || alert.type || 'Unauthorized Phone Detected';
  const confidence = alert.confidence ? `${Math.round(parseFloat(alert.confidence) * 100)}%` : '96%';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 pointer-events-auto"
      >
        <div className="relative rounded-2xl bg-[#0c101d]/95 backdrop-blur-xl border border-rose-500/50 shadow-[0_10px_35px_-5px_rgba(244,63,94,0.4)] p-4 text-white overflow-hidden">
          {/* Pulsing Alert Top Bar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Smartphone size={13} />
                LIVE SURVEILLANCE ALERT
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleSound}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title={soundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
              >
                {soundEnabled ? <Volume2 size={14} className="text-amber-400" /> : <VolumeX size={14} />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex gap-3 items-center">
            {/* Thumbnail Preview */}
            <div
              onClick={() => {
                onView(alert);
                onClose();
              }}
              className="relative w-20 h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 cursor-pointer group"
            >
              <img
                src={imgUrl}
                alt={location}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedFallback) {
                    target.dataset.triedFallback = 'true';
                    target.src = getImageUrl(rawImg, true);
                  }
                }}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors flex items-center justify-center">
                <Eye size={16} className="text-white drop-shadow opacity-80 group-hover:opacity-100" />
              </div>
            </div>

            {/* Alert Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-white truncate leading-snug">
                {detectionText}
              </h4>
              <p className="text-xs text-rose-300 font-medium truncate mt-0.5">
                📍 {location}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                <span>{time}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">Conf: {confidence}</span>
              </div>

              {/* View Action Button */}
              <button
                type="button"
                onClick={() => {
                  onView(alert);
                  onClose();
                }}
                className="mt-2 w-full py-1.5 px-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Eye size={12} />
                <span>Inspect Captured Photo</span>
              </button>
            </div>
          </div>

          {/* Auto-dismiss progress bar */}
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 8, ease: 'linear' }}
            className="absolute bottom-0 left-0 h-0.5 bg-rose-500"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
