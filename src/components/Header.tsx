import React, { useState } from 'react';
import { useElection } from '../context/ElectionContext';
import { ViewMode } from '../types';
import { EctLogo } from './EctLogo';
import {
  BarChart3,
  Edit3,
  Settings,
  Radio,
  Share2,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { electionTitle, viewMode, setViewMode, isAutoSimulationActive, setIsAutoSimulationActive } = useElection();
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const getFullUrlForView = (mode: ViewMode) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?view=${mode}`;
  };

  const copyToClipboard = (mode: ViewMode) => {
    const url = getFullUrlForView(mode);
    navigator.clipboard.writeText(url);
    setCopiedLink(mode);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  return (
    <>
      <header className="sticky top-0 z-40 shadow-md shadow-emerald-950/20 bg-[#2d8a68] text-white border-b border-[#237054]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="relative group flex items-center justify-center p-0.5 rounded-full bg-amber-300 shadow-md shadow-amber-500/20">
            <div className="bg-white rounded-full p-1 flex items-center justify-center shadow-inner">
              <EctLogo size={38} className="w-9 h-9" />
            </div>
          </div>
          <div className="hidden min-[380px]:block">
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight truncate max-w-[190px] sm:max-w-xs drop-shadow-xs">
                {electionTitle}
              </h1>
              <span className="bg-red-500/30 border border-red-400/50 text-red-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center space-x-1 animate-pulse shrink-0">
                <Radio className="w-2.5 h-2.5 text-red-200" />
                <span>LIVE</span>
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/90 font-medium truncate max-w-[260px]">
              สำนักงานคณะกรรมการการเลือกตั้งประจำจังหวัดอุดรธานี
            </p>
          </div>
        </div>

        {/* View Mode Tabs (Desktop & Tablet) */}
        <nav className="flex items-center bg-[#1e5d46] p-1 rounded-xl border border-[#184d3a] text-xs sm:text-sm font-medium shadow-inner">
          <button
            onClick={() => setViewMode('public')}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'public'
                ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md shadow-amber-400/20'
                : 'text-emerald-100 hover:text-white hover:bg-[#28795b]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard สรุปผล</span>
          </button>

          <button
            onClick={() => setViewMode('vote')}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'vote'
                ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md shadow-amber-400/20'
                : 'text-emerald-100 hover:text-white hover:bg-[#28795b]'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>กรอกคะแนน</span>
          </button>

          <button
            onClick={() => setViewMode('admin')}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'admin'
                ? 'bg-[#154333] text-amber-300 font-bold border border-[#2a7a5d] shadow-sm'
                : 'text-emerald-100 hover:text-white hover:bg-[#28795b]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">ตั้งค่าแอดมิน</span>
            <span className="md:hidden">แอดมิน</span>
          </button>
        </nav>

        {/* Right Action buttons */}
        <div className="flex items-center space-x-2">
          {/* Auto Simulation Toggle */}
          <button
            onClick={() => setIsAutoSimulationActive((prev) => !prev)}
            className={`hidden lg:flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all cursor-pointer ${
              isAutoSimulationActive
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold animate-pulse'
                : 'bg-[#1e5d46] text-emerald-100 border-[#2a7a5d] hover:bg-[#28795b]'
            }`}
            title="เปิด/ปิด การส่งคะแนนเข้าจำลองอัตโนมัติเพื่อทดสอบ Real-time"
          >
            <Zap className={`w-3.5 h-3.5 ${isAutoSimulationActive ? 'text-slate-950 fill-slate-950' : 'text-amber-300'}`} />
            <span>{isAutoSimulationActive ? 'จำลองคะแนนสด...' : 'จำลองคะแนนสด'}</span>
          </button>

          {/* Share links button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="p-2 bg-[#1e5d46] hover:bg-[#28795b] text-emerald-100 hover:text-white border border-[#2a7a5d] rounded-lg transition-colors flex items-center space-x-1 text-xs cursor-pointer"
            title="คัดลอกลิ้งก์แยกตามบทบาท"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">แชร์ลิ้งก์</span>
          </button>
        </div>
      </div>
    </header>

      {/* Share / Copy Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-white">ลิ้งก์ระบบนับคะแนนเลือกตั้ง</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              คุณสามารถส่งลิ้งก์แยกตามบทบาทการใช้งานให้กับบุคคลต่างๆ ได้ทันที:
            </p>

            <div className="space-y-3">
              {/* Public Link */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    1. ลิ้งก์ Dashboard สำหรับผู้ใช้งานทั่วไป (ดูได้อย่างเดียว)
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={getFullUrlForView('public')}
                    className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 flex-1 font-mono select-all"
                  />
                  <button
                    onClick={() => copyToClipboard('public')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 shrink-0"
                  >
                    {copiedLink === 'public' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอก</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Vote Entry Link */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                    2. ลิ้งก์สำหรับเจ้าหน้าที่กรอกคะแนนเลือกตั้ง
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={getFullUrlForView('vote')}
                    className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 flex-1 font-mono select-all"
                  />
                  <button
                    onClick={() => copyToClipboard('vote')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 shrink-0"
                  >
                    {copiedLink === 'vote' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอก</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Admin Link */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    3. ลิ้งก์สำหรับผู้ดูแลระบบ (Admin Settings)
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={getFullUrlForView('admin')}
                    className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 flex-1 font-mono select-all"
                  />
                  <button
                    onClick={() => copyToClipboard('admin')}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 shrink-0"
                  >
                    {copiedLink === 'admin' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอก</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
