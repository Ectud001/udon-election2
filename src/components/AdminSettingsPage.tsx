import React, { useState } from 'react';
import { useElection } from '../context/ElectionContext';
import { Candidate, PollingStation, District, Zone } from '../types';
import {
  Settings,
  Users,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Download,
  Upload,
  Check,
  CheckCircle,
  Building2,
  Image as ImageIcon,
  Save,
  Sparkles,
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
];

export const AdminSettingsPage: React.FC = () => {
  const {
    electionTitle,
    updateElectionTitle,
    candidates,
    parties,
    districts,
    zones,
    pollingStations,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    addParty,
    updateParty,
    deleteParty,
    addPollingStation,
    updatePollingStation,
    deletePollingStation,
    addDistrict,
    addZone,
    toggleStationCompletion,
    toggleZoneCompletion,
    toggleDistrictCompletion,
    resetToDefaultData,
    votes,
  } = useElection();

  const [activeTab, setActiveTab] = useState<'candidates' | 'parties' | 'stations' | 'system'>('candidates');

  // Election Title Form State
  const [titleInput, setTitleInput] = useState<string>(electionTitle);

  // Party Form State
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [partyNameInput, setPartyNameInput] = useState<string>('');
  const [partyShortNameInput, setPartyShortNameInput] = useState<string>('');
  const [partyColorInput, setPartyColorInput] = useState<string>('#FF6600');

  // Candidate form state
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [candNumber, setCandNumber] = useState<number>(candidates.length + 1);
  const [candName, setCandName] = useState<string>('');
  const [candPartyId, setCandPartyId] = useState<string>(parties[0]?.id || 'p1');
  const [candPhotoUrl, setCandPhotoUrl] = useState<string>(AVATAR_PRESETS[0]);
  const [candBio, setCandBio] = useState<string>('');

  // Station form state
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [stName, setStName] = useState<string>('');
  const [stNumber, setStNumber] = useState<number>(1);
  const [stDistrictId, setStDistrictId] = useState<string>(districts[0]?.id || '');
  const [stZoneId, setStZoneId] = useState<string>(zones[0]?.id || '');
  const [stVoters, setStVoters] = useState<number>(1000);

  // New District / Zone modal forms
  const [newDistrictName, setNewDistrictName] = useState<string>('');
  const [newZoneName, setNewZoneName] = useState<string>('');
  const [newZoneDistrictId, setNewZoneDistrictId] = useState<string>(districts[0]?.id || '');

  // Handle Photo File Upload
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCandPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Candidate Form
  const handleSaveCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName.trim()) return;

    const selectedParty = parties.find((p) => p.id === candPartyId) || parties[0];

    if (editingCandidateId) {
      updateCandidate(editingCandidateId, {
        number: candNumber,
        name: candName,
        partyId: selectedParty.id,
        partyName: selectedParty.name,
        partyColor: selectedParty.color,
        photoUrl: candPhotoUrl,
        bio: candBio,
      });
      setEditingCandidateId(null);
    } else {
      addCandidate({
        number: candNumber,
        name: candName,
        partyId: selectedParty.id,
        partyName: selectedParty.name,
        partyColor: selectedParty.color,
        photoUrl: candPhotoUrl,
        bio: candBio,
      });
    }

    // Reset form
    setCandName('');
    setCandBio('');
    setCandNumber(candidates.length + 2);
  };

  const startEditCandidate = (c: Candidate) => {
    setEditingCandidateId(c.id);
    setCandNumber(c.number);
    setCandName(c.name);
    setCandPartyId(c.partyId);
    setCandPhotoUrl(c.photoUrl);
    setCandBio(c.bio || '');
  };

  // Submit Station Form
  const handleSaveStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stName.trim()) return;

    if (editingStationId) {
      updatePollingStation(editingStationId, {
        name: stName,
        stationNumber: stNumber,
        districtId: stDistrictId,
        zoneId: stZoneId,
        totalEligibleVoters: stVoters,
      });
      setEditingStationId(null);
    } else {
      addPollingStation({
        name: stName,
        stationNumber: stNumber,
        districtId: stDistrictId,
        zoneId: stZoneId,
        totalEligibleVoters: stVoters,
        status: 'pending',
      });
    }

    setStName('');
    setStNumber((prev) => prev + 1);
  };

  // Save Party Form
  const handleSaveParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyNameInput.trim()) return;

    if (editingPartyId) {
      updateParty(editingPartyId, {
        name: partyNameInput.trim(),
        shortName: partyShortNameInput.trim() || partyNameInput.trim(),
        color: partyColorInput,
      });
      setEditingPartyId(null);
    } else {
      addParty({
        name: partyNameInput.trim(),
        shortName: partyShortNameInput.trim() || partyNameInput.trim(),
        color: partyColorInput,
      });
    }

    setPartyNameInput('');
    setPartyShortNameInput('');
    setPartyColorInput('#FF6600');
  };

  const startEditParty = (p: any) => {
    setEditingPartyId(p.id);
    setPartyNameInput(p.name);
    setPartyShortNameInput(p.shortName);
    setPartyColorInput(p.color);
  };

  // Submit Election Title Form
  const handleSaveElectionTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim()) {
      updateElectionTitle(titleInput.trim());
      alert('บันทึกหัวข้อการเลือกตั้งเรียบร้อยแล้ว!');
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Candidate Number,Candidate Name,Party,Total Votes\n';

    candidates.forEach((cand) => {
      const candTotal = votes.reduce((sum, v) => sum + (v.candidateVotes[cand.id] || 0), 0);
      csvContent += `"${cand.number}","${cand.name}","${cand.partyName}",${candTotal}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `election_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2d8a68] via-[#247558] to-[#1b5b44] text-white rounded-3xl p-5 sm:p-6 border border-[#1d634a] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shrink-0">
            <Settings className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">ตั้งค่าผู้ดูแลระบบ (Admin Panel)</h2>
            <p className="text-xs text-emerald-200 mt-0.5">
              กำหนดตัวผู้สมัคร พรรคการเมือง รูปถ่าย กำหนดอำเภอ เขต และหน่วยเลือกตั้ง
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-emerald-950 p-1 rounded-xl border border-emerald-800 text-xs font-semibold w-full sm:w-auto overflow-x-auto relative z-10">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'candidates' ? 'bg-amber-400 text-emerald-950 font-black shadow-sm' : 'text-emerald-200 hover:text-white'
            }`}
          >
            จัดการผู้สมัคร
          </button>
          <button
            onClick={() => setActiveTab('parties')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'parties' ? 'bg-amber-400 text-emerald-950 font-black shadow-sm' : 'text-emerald-200 hover:text-white'
            }`}
          >
            แก้ไขชื่อพรรค
          </button>
          <button
            onClick={() => setActiveTab('stations')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'stations' ? 'bg-amber-400 text-emerald-950 font-black shadow-sm' : 'text-emerald-200 hover:text-white'
            }`}
          >
            อำเภอ/เขต/หน่วย
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'system' ? 'bg-amber-400 text-emerald-950 font-black shadow-sm' : 'text-emerald-200 hover:text-white'
            }`}
          >
            ตั้งค่าเลือกตั้ง/ระบบ
          </button>
        </div>
      </div>

      {/* TAB 1: CANDIDATES MANAGEMENT */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          {/* Add/Edit Candidate Form */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Users className="w-4 h-4 text-orange-500" />
              <span>
                {editingCandidateId ? 'แก้ไขข้อมูลผู้สมัคร' : 'เพิ่มผู้สมัครรับเลือกตั้งคนใหม่'}
              </span>
            </h3>

            <form onSubmit={handleSaveCandidate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Candidate Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หมายเลขประจำตัวผู้สมัคร (เบอร์):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={candNumber}
                    onChange={(e) => setCandNumber(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                {/* Candidate Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อ-นามสกุล ผู้สมัคร:
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น นายกิตติศักดิ์ พัฒนชัย"
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                {/* Party Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สังกัดพรรคการเมือง:
                  </label>
                  <select
                    value={candPartyId}
                    onChange={(e) => setCandPartyId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-orange-500"
                  >
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.shortName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photo Upload & Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  รูปถ่ายผู้สมัคร (อัปโหลดรูปภาพ หรือเลือกรูปตัวอย่าง):
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-400 shrink-0 shadow-xs">
                    <img
                      src={candPhotoUrl}
                      alt="Candidate Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดรูปจากเครื่อง</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
                    <span className="text-[11px] text-slate-400">หรือเลือกจากคลัง:</span>
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCandPhotoUrl(preset)}
                        className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                          candPhotoUrl === preset
                            ? 'border-orange-500 scale-105 shadow-sm'
                            : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Candidate Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประวัติผู้สมัครโดยย่อ (สโลแกน / ผลงาน):
                </label>
                <input
                  type="text"
                  placeholder="เช่น นโยบายยกระดับเศรษฐกิจและการศึกษา..."
                  value={candBio}
                  onChange={(e) => setCandBio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                {editingCandidateId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCandidateId(null);
                      setCandName('');
                      setCandBio('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    ยกเลิกการแก้ไข
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingCandidateId ? 'บันทึกการแก้ไข' : 'เพิ่มผู้สมัคร'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Candidate List Table */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              รายชื่อผู้สมัครรับเลือกตั้งปัจจุบัน ({candidates.length} คน)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={candidate.photoUrl}
                        alt={candidate.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded text-[10px] font-bold text-white flex items-center justify-center"
                        style={{ backgroundColor: candidate.partyColor }}
                      >
                        #{candidate.number}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-sm">{candidate.name}</div>
                      <div className="text-xs text-slate-500">{candidate.partyName}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEditCandidate(candidate)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                      title="แก้ไข"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`คุณต้องการลบผู้สมัคร "${candidate.name}" หรือไม่?`)) {
                          deleteCandidate(candidate.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTIES MANAGEMENT (แก้ไขชื่อพรรค) */}
      {activeTab === 'parties' && (
        <div className="space-y-6">
          {/* Add/Edit Party Form */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-orange-500" />
              <span>
                {editingPartyId ? 'แก้ไขข้อมูลและชื่อพรรคการเมือง' : 'เพิ่มพรรคการเมืองใหม่'}
              </span>
            </h3>

            <form onSubmit={handleSaveParty} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Party Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อพรรคการเมือง (เช่น พรรคประชาชน / พรรคเพื่อไทย):
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น พรรคก้าวหน้า"
                    value={partyNameInput}
                    onChange={(e) => setPartyNameInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                {/* Short Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อย่อพรรค (เช่น ปชช. / พท.):
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น กก."
                    value={partyShortNameInput}
                    onChange={(e) => setPartyShortNameInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สีประจำพรรคการเมือง:
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={partyColorInput}
                      onChange={(e) => setPartyColorInput(e.target.value)}
                      className="w-10 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      value={partyColorInput}
                      onChange={(e) => setPartyColorInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  * เมื่อแก้ไขชื่อหรือสีพรรค ระบบจะอัปเดตชื่อพรรคของผู้สมัครที่สังกัดพรรคนี้โดยอัตโนมัติ
                </span>

                <div className="flex items-center space-x-2">
                  {editingPartyId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPartyId(null);
                        setPartyNameInput('');
                        setPartyShortNameInput('');
                        setPartyColorInput('#FF6600');
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      ยกเลิก
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingPartyId ? 'บันทึกการแก้ไขพรรค' : 'เพิ่มพรรคการเมือง'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Party List */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              พรรคการเมืองในระบบทั้งหมด ({parties.length} พรรค)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {parties.map((party) => {
                const partyCandidateCount = candidates.filter((c) => c.partyId === party.id).length;

                return (
                  <div
                    key={party.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-xs"
                        style={{ backgroundColor: party.color }}
                      >
                        {party.shortName}
                      </div>

                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{party.name}</span>
                          <span className="text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                            {party.shortName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          จำนวนผู้สมัครสังกัด: <span className="font-semibold text-slate-700">{partyCandidateCount} คน</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => startEditParty(party)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                        title="แก้ไขชื่อพรรค"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`คุณต้องการลบพรรค "${party.name}" หรือไม่?`)) {
                            deleteParty(party.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                        title="ลบพรรค"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOCATIONS & POLLING STATIONS */}
      {activeTab === 'stations' && (
        <div className="space-y-6">
          {/* Create District & Zone Quick Add Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Add District */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>เพิ่มอำเภอใหม่</span>
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ชื่ออำเภอ เช่น อำเภอฝาง"
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newDistrictName.trim()) {
                      addDistrict({ name: newDistrictName, code: 'D_' + Date.now() });
                      setNewDistrictName('');
                    }
                  }}
                  className="bg-indigo-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-indigo-700"
                >
                  เพิ่มอำเภอ
                </button>
              </div>
            </div>

            {/* Add Zone */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>เพิ่มเขตเลือกตั้งใหม่</span>
              </h4>
              <div className="flex gap-2">
                <select
                  value={newZoneDistrictId}
                  onChange={(e) => setNewZoneDistrictId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2 py-1.5"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="เช่น เขตเลือกตั้งที่ 4"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newZoneName.trim()) {
                      addZone({
                        name: newZoneName,
                        zoneNumber: zones.length + 1,
                        districtId: newZoneDistrictId,
                      });
                      setNewZoneName('');
                    }
                  }}
                  className="bg-orange-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-orange-600"
                >
                  เพิ่มเขต
                </button>
              </div>
            </div>
          </div>

          {/* Add/Edit Station Form */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>
                {editingStationId ? 'แก้ไขหน่วยเลือกตั้ง' : 'เพิ่มหน่วยเลือกตั้งใหม่'}
              </span>
            </h3>

            <form onSubmit={handleSaveStation} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">อำเภอ:</label>
                <select
                  value={stDistrictId}
                  onChange={(e) => setStDistrictId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เขตเลือกตั้ง:</label>
                <select
                  value={stZoneId}
                  onChange={(e) => setStZoneId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อหน่วยเลือกตั้ง:
                </label>
                <input
                  type="text"
                  placeholder="เช่น หน่วยที่ 1 วัดหางดง"
                  value={stName}
                  onChange={(e) => setStName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ผู้มีสิทธิเลือกตั้ง (คน):
                </label>
                <input
                  type="number"
                  min="1"
                  value={stVoters}
                  onChange={(e) => setStVoters(parseInt(e.target.value) || 1000)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  required
                />
              </div>

              <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingStationId ? 'บันทึกการแก้ไขหน่วย' : 'เพิ่มหน่วยเลือกตั้ง'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Zone & District Completion Toggle Panel (ติ๊กช่องนับเสร็จรายเขต) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>สถานะและช่องติ๊กนับคะแนนเสร็จสิ้น รายเขตเลือกตั้ง (Zone Status)</span>
              </span>
              <span className="text-xs text-slate-500 font-normal">
                (ติ๊กเพื่อตั้งสถานะให้นับคะแนนเสร็จครบทุกหน่วยในเขตนั้น)
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {zones.map((zone) => {
                const dObj = districts.find((d) => d.id === zone.districtId);
                const zoneStations = pollingStations.filter((s) => s.zoneId === zone.id);
                const completedCount = zoneStations.filter((s) => s.status === 'completed').length;
                const isAllDone = zoneStations.length > 0 && completedCount === zoneStations.length;

                return (
                  <label
                    key={zone.id}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
                      isAllDone
                        ? 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100/70'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isAllDone}
                      onChange={(e) => toggleZoneCompletion(zone.id, e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer accent-emerald-600 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-xs flex items-center justify-between gap-1">
                        <span className="truncate">{zone.name}</span>
                        {isAllDone ? (
                          <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full shrink-0">
                            นับเสร็จแล้ว 100%
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                            {completedCount}/{zoneStations.length} หน่วย
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {dObj?.name || 'อำเภอ'} • รวม {zoneStations.length} หน่วยเลือกตั้ง
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Station List Table (ติ๊กช่องนับเสร็จรายหน่วย) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>หน่วยเลือกตั้งทั้งหมด ({pollingStations.length} หน่วย)</span>
              <span className="text-xs text-slate-500 font-normal">
                นับเสร็จแล้ว: {pollingStations.filter((s) => s.status === 'completed').length} / {pollingStations.length} หน่วย
              </span>
            </h3>

            <div className="space-y-2">
              {pollingStations.map((station) => {
                const dName = districts.find((d) => d.id === station.districtId)?.name;
                const zName = zones.find((z) => z.id === station.zoneId)?.name;
                const isCompleted = station.status === 'completed';

                return (
                  <div
                    key={station.id}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                      isCompleted
                        ? 'bg-emerald-50/50 border-emerald-200/80'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Interactive Checkbox for each station */}
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={(e) => toggleStationCompletion(station.id, e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 shrink-0"
                        title="ติ๊กเพื่อเปลี่ยนสถานะนับคะแนนเสร็จ"
                      />

                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{station.name}</span>
                          {isCompleted ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ นับเสร็จแล้ว
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                              กำลังนับ
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {dName} • {zName} • ผู้มีสิทธิ:{' '}
                          <span className="font-semibold text-slate-800">
                            {station.totalEligibleVoters.toLocaleString()} คน
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <label className="text-xs text-slate-600 font-medium flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={(e) => toggleStationCompletion(station.id, e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                        />
                        <span>{isCompleted ? 'นับเสร็จสิ้น' : 'ติ๊กนับเสร็จ'}</span>
                      </label>

                      <button
                        onClick={() => {
                          if (confirm(`คุณต้องการลบหน่วย "${station.name}" หรือไม่?`)) {
                            deletePollingStation(station.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                        title="ลบหน่วย"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ELECTION TITLE & SYSTEM RESET & EXPORT */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Election Title Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>กำหนดหัวข้อ / ชนิดการเลือกตั้ง (Election Title)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดชื่อการเลือกตั้งที่จะแสดงบนหน้า Dashboard สรุปผลเรียลไทม์ และหัวข้อรายงาน
              </p>
            </div>

            <form onSubmit={handleSaveElectionTitle} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่องานเลือกตั้ง (แสดงทุกหน้าของระบบ):
                </label>
                <input
                  type="text"
                  placeholder="เช่น การเลือกตั้งนายกเทศมนตรีนครเชียงใหม่, การเลือกตั้งสมาชิกสภาผู้แทนราษฎร 2568"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Title Quick Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-500 font-medium">ตัวอย่างรวดเร็ว:</span>
                {[
                  'การเลือกตั้งสมาชิกสภาผู้แทนราษฎร 2568',
                  'การเลือกตั้งนายกองค์การบริหารส่วนจังหวัด (นายก อบจ.)',
                  'การเลือกตั้งนายกเทศมนตรี และสมาชิกสภาเทศบาล',
                  'การเลือกตั้งผู้ว่าราชการกรุงเทพมหานคร',
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTitleInput(preset)}
                    className="text-[11px] bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-medium transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกหัวข้อการเลือกตั้ง</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-700" />
                <span>การจัดการและสำรองข้อมูลระบบ</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ส่งออกรายงานสรุป หรือรีเซ็ตข้อมูลคะแนนเพื่อเริ่มการเลือกตั้งรอบใหม่
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export CSV Card */}
            <div className="p-5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm">
                <Download className="w-5 h-5 text-indigo-600" />
                <span>ส่งออกรายงานคะแนน (Export CSV)</span>
              </div>
              <p className="text-xs text-slate-600">
                ดาวน์โหลดไฟล์สรุปคะแนนผู้สมัครทุกพรรคแยกตามลำดับ สำหรับนำไปประมวลผลต่อใน Excel
              </p>
              <button
                onClick={handleExportCSV}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดรายงานสรุปคะแนน CSV</span>
              </button>
            </div>

            {/* Reset Data Card */}
            <div className="p-5 bg-red-50/70 border border-red-100 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-red-900 font-bold text-sm">
                <RotateCcw className="w-5 h-5 text-red-600" />
                <span>รีเซ็ตข้อมูลเลือกตั้ง (Reset Default)</span>
              </div>
              <p className="text-xs text-slate-600">
                ล้างข้อมูลคะแนนที่กรอกทั้งหมด และโหลดชุดข้อมูลตัวอย่างการเลือกตั้งเริ่มต้น
              </p>
              <button
                onClick={() => {
                  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตคะแนนทั้งหมดกลับเป็นค่าเริ่มต้น?')) {
                    resetToDefaultData();
                    alert('รีเซ็ตข้อมูลการเลือกตั้งเรียบร้อยแล้ว!');
                  }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>ล้างคะแนนและโหลดค่าเริ่มต้น</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
