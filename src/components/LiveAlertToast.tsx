import React from 'react';
import { useElection } from '../context/ElectionContext';
import { Sparkles, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LiveAlertToast: React.FC = () => {
  const { liveNotifications, clearNotification } = useElection();

  if (liveNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      <AnimatePresence>
        {liveNotifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="pointer-events-auto bg-slate-900/95 text-white border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md flex items-start justify-between space-x-3"
          >
            <div className="flex items-start space-x-3 min-w-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shrink-0 text-sm shadow-sm"
                style={{ backgroundColor: notif.partyColor }}
              >
                #{notif.candidateNumber}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-medium mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>อัปเดตคะแนนใหม่ ({notif.timestamp})</span>
                </div>
                <div className="font-semibold text-sm text-slate-100 truncate">
                  {notif.candidateName} <span className="text-xs text-slate-400 font-normal">({notif.partyName})</span>
                </div>
                <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-1">
                  <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    +{notif.votesAdded} คะแนน
                  </span>
                  <span className="text-slate-400">• {notif.stationName}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => clearNotification(notif.id)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              title="ปิดการแจ้งเตือน"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
