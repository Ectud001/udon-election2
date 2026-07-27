import React from 'react';
import { ElectionProvider, useElection } from './context/ElectionContext';
import { Header } from './components/Header';
import { LiveAlertToast } from './components/LiveAlertToast';
import { PublicDashboard } from './components/PublicDashboard';
import { VoteEntryPage } from './components/VoteEntryPage';
import { AdminSettingsPage } from './components/AdminSettingsPage';
import { EctLogo } from './components/EctLogo';
import { ShieldCheck, Globe, Phone, Building2, ExternalLink } from 'lucide-react';

const MainContent: React.FC = () => {
  const { viewMode } = useElection();

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      <Header />
      <LiveAlertToast />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 flex-1 w-full">
        {viewMode === 'public' && <PublicDashboard />}
        {viewMode === 'vote' && <VoteEntryPage />}
        {viewMode === 'admin' && <AdminSettingsPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#18533d] bg-[#1e5d46] text-emerald-100 py-8 text-xs relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-800/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-800/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-[#28795b]/60 items-center">
            {/* Left Col: Office Info */}
            <div className="flex items-center space-x-3">
              <EctLogo size={44} className="w-11 h-11 shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>สำนักงานคณะกรรมการการเลือกตั้งประจำจังหวัดอุดรธานี</span>
                </h4>
                <p className="text-[11px] text-emerald-200/90 mt-0.5">
                  ระบบรายงานผลการเลือกตั้งอย่างไม่เป็นทางการเรียลไทม์ (Realtime Election Counter)
                </p>
              </div>
            </div>

            {/* Middle Col: Website Link */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center md:justify-center gap-2">
              <a
                href="https://www.ect.go.th/th/udonthani"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#174b38] hover:bg-[#20674d] text-emerald-100 hover:text-white border border-[#2d8a68]/60 transition-all shadow-xs group"
              >
                <Globe className="w-4 h-4 text-amber-300 group-hover:text-amber-200" />
                <span className="font-semibold text-xs tracking-wide">ect.go.th/th/udonthani</span>
                <ExternalLink className="w-3 h-3 text-emerald-300" />
              </a>
            </div>

            {/* Right Col: Hotline Contact */}
            <div className="flex items-center md:justify-end space-x-2">
              <div className="p-2 bg-[#174b38] rounded-xl border border-[#2d8a68]/60 text-amber-300">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-amber-300 uppercase tracking-wider font-extrabold">
                  สอบถามข้อมูลเพิ่มเติม
                </div>
                <div className="font-extrabold text-white text-xs sm:text-sm tracking-tight">
                  042 211 116-7{' '}
                  <span className="text-[11px] font-normal text-emerald-200/90">
                    (สายด่วน กกต. 1444)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar copyright & live info */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-400/80 text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium">
                ข้อมูลอัปเดตอัตโนมัติสดจากทุกหน่วยเลือกตั้งในจังหวัดอุดรธานี
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5 text-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>ศูนย์ประสานงานการเลือกตั้ง อบจ. / ส.ส. อุดรธานี</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ElectionProvider>
      <MainContent />
    </ElectionProvider>
  );
}
