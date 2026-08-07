import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useElection } from '../context/ElectionContext';
import { Candidate, PollingStation, District, Zone } from '../types';
import { downloadLocationExcelTemplate, parseLocationExcelFile, LocationExcelRow } from '../utils/excelUtils';
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
  FileSpreadsheet,
  UploadCloud,
  FileCheck,
  AlertCircle,
  X,
  FileText,
  CheckCircle2,
  RefreshCw,
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
    subDistricts,
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
    deleteDistrict,
    addSubDistrict,
    updateSubDistrict,
    deleteSubDistrict,
    addZone,
    deleteZone,
    toggleStationCompletion,
    toggleZoneCompletion,
    toggleDistrictCompletion,
    resetToDefaultData,
    clearAllVotes,
    clearAllData,
    votes,
    importExcelLocationData,
    deduplicatePollingStationsBySubDistrict,
  } = useElection();

  const safeParties = Array.isArray(parties) ? parties : [];

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'candidates' | 'parties' | 'stations' | 'system'>('candidates');

  // Station SubDistrict Filter State
  const [stationSubFilter, setStationSubFilter] = useState<string>('all');

  const handleRunDeduplication = () => {
    const { removedCount } = deduplicatePollingStationsBySubDistrict();
    if (removedCount > 0) {
      showToast(`ทำความสะอาดสำเร็จ! ลบหน่วยเลือกตั้งซ้ำซ้อนออก ${removedCount} รายการ (ยึดตำบลเป็นหลัก)`);
    } else {
      showToast(`ไม่พบหน่วยเลือกตั้งซ้ำในระบบ ข้อมูลถูกต้องตามตำบลแล้ว`);
    }
  };

  // Excel Import States
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const [excelRows, setExcelRows] = useState<LocationExcelRow[]>([]);
  const [showExcelModal, setShowExcelModal] = useState<boolean>(false);
  const [isParsingExcel, setIsParsingExcel] = useState<boolean>(false);
  const [excelError, setExcelError] = useState<string | null>(null);

  const handleLocationFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setExcelError(null);

    try {
      const parsed = await parseLocationExcelFile(file);
      if (!parsed || parsed.length === 0) {
        setExcelError('ไม่พบข้อมูลหน่วยเลือกตั้งในไฟล์ Excel หรือรูปแบบคอลัมน์ไม่ถูกต้อง');
      } else {
        setExcelRows(parsed);
        setShowExcelModal(true);
      }
    } catch (err: any) {
      setExcelError(err?.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel');
    } finally {
      setIsParsingExcel(false);
      if (excelFileInputRef.current) excelFileInputRef.current.value = '';
    }
  };

  const handleConfirmExcelImport = () => {
    if (excelRows.length === 0) return;

    const res = importExcelLocationData(excelRows);
    setShowExcelModal(false);
    setExcelRows([]);
    showToast(
      `นำเข้าสำเร็จ! สร้างอำเภอ ${res.createdDistricts} แห่ง, ตำบล ${res.createdSubDistricts} แห่ง, เขต ${res.createdZones} เขต, หน่วยเลือกตั้ง ${res.createdStations} หน่วย (${res.updatedStations} อัปเดต)`
    );
  };

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
  const [candPartyId, setCandPartyId] = useState<string>(safeParties[0]?.id || 'p1');
  const [candPhotoUrl, setCandPhotoUrl] = useState<string>(AVATAR_PRESETS[0]);
  const [candBio, setCandBio] = useState<string>('');

  // Station form state
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [stName, setStName] = useState<string>('');
  const [stNumber, setStNumber] = useState<number>(1);
  const [stDistrictId, setStDistrictId] = useState<string>(districts[0]?.id || '');
  const [stSubDistrictId, setStSubDistrictId] = useState<string>(subDistricts[0]?.id || '');
  const [stZoneId, setStZoneId] = useState<string>(zones[0]?.id || '');
  const [stVoters, setStVoters] = useState<number>(1000);

  // New District / SubDistrict / Zone modal forms
  const [newDistrictName, setNewDistrictName] = useState<string>('');
  const [newSubDistrictName, setNewSubDistrictName] = useState<string>('');
  const [newSubDistrictDistrictId, setNewSubDistrictDistrictId] = useState<string>(districts[0]?.id || '');
  const [newZoneName, setNewZoneName] = useState<string>('');
  const [newZoneDistrictId, setNewZoneDistrictId] = useState<string>(districts[0]?.id || '');

  // Keep district dropdown selections synced to a valid existing district
  useEffect(() => {
    if (districts.length > 0) {
      if (!newSubDistrictDistrictId || !districts.some((d) => d.id === newSubDistrictDistrictId)) {
        setNewSubDistrictDistrictId(districts[0].id);
      }
      if (!newZoneDistrictId || !districts.some((d) => d.id === newZoneDistrictId)) {
        setNewZoneDistrictId(districts[0].id);
      }
      if (!stDistrictId || !districts.some((d) => d.id === stDistrictId)) {
        setStDistrictId(districts[0].id);
      }
    }
  }, [districts, newSubDistrictDistrictId, newZoneDistrictId, stDistrictId]);

  // Filter available subDistricts for station creation form with graceful fallback
  const availableSubDistrictsForStationForm = useMemo(() => {
    if (!subDistricts || subDistricts.length === 0) return [];
    if (!stDistrictId) return subDistricts;

    const matched = subDistricts.filter((sd) => !sd.districtId || sd.districtId === stDistrictId);
    return matched.length > 0 ? matched : subDistricts;
  }, [subDistricts, stDistrictId]);

  // Confirmation Modal & Toast state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionText: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

    const selectedParty = safeParties.find((p) => p.id === candPartyId) || safeParties[0];

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

    if (stSubDistrictId && stDistrictId) {
      const sub = subDistricts.find((sd) => sd.id === stSubDistrictId);
      if (sub && (!sub.districtId || sub.districtId !== stDistrictId)) {
        updateSubDistrict(stSubDistrictId, { districtId: stDistrictId });
      }
    }

    if (editingStationId) {
      updatePollingStation(editingStationId, {
        name: stName.trim(),
        stationNumber: stNumber,
        districtId: stDistrictId,
        subDistrictId: stSubDistrictId,
        zoneId: stZoneId,
        totalEligibleVoters: stVoters,
      });
      setEditingStationId(null);
      showToast(`อัปเดตข้อมูลหน่วยเลือกตั้ง "${stName}" เรียบร้อยแล้ว`);
    } else {
      // Check if station already exists in this sub-district
      const existingInSub = pollingStations.find(
        (s) => s.subDistrictId === stSubDistrictId && s.name.trim() === stName.trim()
      );

      if (existingInSub) {
        updatePollingStation(existingInSub.id, {
          districtId: stDistrictId,
          subDistrictId: stSubDistrictId,
          zoneId: stZoneId,
          totalEligibleVoters: stVoters,
        });
        showToast(`หน่วย "${stName.trim()}" มีอยู่แล้วในตำบลนี้ — อัปเดตข้อมูลผู้มีสิทธิเรียบร้อยแล้ว`);
      } else {
        addPollingStation({
          name: stName.trim(),
          stationNumber: stNumber,
          districtId: stDistrictId,
          subDistrictId: stSubDistrictId,
          zoneId: stZoneId,
          totalEligibleVoters: stVoters,
          status: 'pending',
        });
        showToast(`เพิ่มหน่วยเลือกตั้ง "${stName.trim()}" เรียบร้อยแล้ว`);
      }
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
      showToast('บันทึกหัวข้อการเลือกตั้งเรียบร้อยแล้ว!');
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
                    {safeParties.map((p) => (
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
                      type="button"
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'ยืนยันการลบผู้สมัคร',
                          message: `คุณต้องการลบผู้สมัคร "${candidate.name}" (หมายเลข ${candidate.number}) ออกจากระบบใช่หรือไม่?`,
                          actionText: 'ลบผู้สมัคร',
                          isDanger: true,
                          onConfirm: () => {
                            deleteCandidate(candidate.id);
                            showToast(`ลบผู้สมัคร "${candidate.name}" เรียบร้อยแล้ว`);
                          },
                        });
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
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
              พรรคการเมืองในระบบทั้งหมด ({safeParties.length} พรรค)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {safeParties.map((party) => {
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
                        type="button"
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'ยืนยันการลบพรรคการเมือง',
                            message: `คุณต้องการลบพรรค "${party.name}" (${party.shortName}) ออกจากระบบใช่หรือไม่?`,
                            actionText: 'ลบพรรค',
                            isDanger: true,
                            onConfirm: () => {
                              deleteParty(party.id);
                              showToast(`ลบพรรค "${party.name}" เรียบร้อยแล้ว`);
                            },
                          });
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
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
          {/* Excel Import & Template Download Section (เมนูนำส่ง Excel) */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                    Excel Batch Import
                  </span>
                  <span className="text-xs text-emerald-200/80 font-medium">ลำดับชั้น: เขตเลือกตั้ง &gt; อำเภอ &gt; ตำบล &gt; หน่วยเลือกตั้ง</span>
                </div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <span>นำเข้าโครงสร้างหน่วยเลือกตั้งผ่านไฟล์ Excel (.xlsx)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  ออกแบบมาสำหรับการสร้าง/อัปเดตข้อมูล อำเภอ ตำบล หน่วยเลือกตั้ง และจำนวนผู้มีสิทธิเลือกตั้ง ครั้งละหลายหน่วย
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* Download Template Button */}
                <button
                  type="button"
                  onClick={() => downloadLocationExcelTemplate()}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-emerald-200 border border-emerald-400/30 rounded-xl text-xs font-bold flex items-center space-x-2 backdrop-blur-xs transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>ดาวน์โหลด Template Excel</span>
                </button>

                {/* File Upload Button */}
                <button
                  type="button"
                  disabled={isParsingExcel}
                  onClick={() => excelFileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isParsingExcel ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <UploadCloud className="w-4 h-4 text-slate-950" />
                  )}
                  <span>{isParsingExcel ? 'กำลังอ่านไฟล์...' : 'เลือกไฟล์ Excel เพื่อนำเข้า'}</span>
                </button>

                <input
                  ref={excelFileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleLocationFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Error banner if file parsing fails */}
            {excelError && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{excelError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1 text-slate-300">
              <div className="flex items-center space-x-2 bg-white/5 p-2.5 rounded-xl border border-white/10">
                <span className="font-bold text-emerald-400">1. เขตเลือกตั้ง</span>
                <span className="text-[11px] text-slate-400">(เช่น เขตเลือกตั้งที่ 1)</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 p-2.5 rounded-xl border border-white/10">
                <span className="font-bold text-emerald-400">2. อำเภอ</span>
                <span className="text-[11px] text-slate-400">(เช่น อำเภอเพ็ญ)</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 p-2.5 rounded-xl border border-white/10">
                <span className="font-bold text-emerald-400">3. ตำบล</span>
                <span className="text-[11px] text-slate-400">(เช่น ตำบลเพ็ญ)</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 p-2.5 rounded-xl border border-white/10">
                <span className="font-bold text-emerald-400">4. หน่วย &amp; ผู้มีสิทธิ</span>
                <span className="text-[11px] text-slate-400">(เช่น หน่วยที่ 1 - 1,200 คน)</span>
              </div>
            </div>
          </div>

          {/* Create Zone, District & SubDistrict Quick Add Bar (Hierarchy: 1. เขต 2. อำเภอ 3. ตำบล) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Add Zone (เพิ่มเขตเลือกตั้งใหม่) */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-2.5">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>1. เพิ่มเขตเลือกตั้งใหม่</span>
              </h4>
              <div className="flex items-center gap-2 min-w-0 w-full">
                <select
                  value={newZoneDistrictId}
                  onChange={(e) => setNewZoneDistrictId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl px-2 py-2 w-28 shrink-0 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {districts.length === 0 ? (
                    <option value="">--เลือก--</option>
                  ) : (
                    districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))
                  )}
                </select>
                <input
                  type="text"
                  placeholder="เช่น เขตเลือกตั้งที่ 4"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="min-w-0 flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newZoneName.trim()) {
                      const dist = districts.find((d) => d.id === newZoneDistrictId) || districts[0];
                      addZone({
                        name: newZoneName.trim(),
                        zoneNumber: zones.length + 1,
                        districtId: dist ? dist.id : '',
                      });
                      showToast(`เพิ่มเขต "${newZoneName.trim()}" เรียบร้อยแล้ว`);
                      setNewZoneName('');
                    }
                  }}
                  className="bg-orange-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-orange-600 shrink-0 whitespace-nowrap cursor-pointer transition-colors shadow-xs"
                >
                  เพิ่มเขต
                </button>
              </div>
            </div>

            {/* 2. Add District (เพิ่มอำเภอใหม่) */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-2.5">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>2. เพิ่มอำเภอใหม่</span>
              </h4>
              <div className="flex items-center gap-2 min-w-0 w-full">
                <input
                  type="text"
                  placeholder="เช่น อำเภอเมืองเชียงใหม่"
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  className="min-w-0 flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newDistrictName.trim()) {
                      addDistrict({ name: newDistrictName.trim(), code: 'D_' + Date.now() });
                      showToast(`เพิ่มอำเภอ "${newDistrictName.trim()}" เรียบร้อยแล้ว`);
                      setNewDistrictName('');
                    }
                  }}
                  className="bg-indigo-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-indigo-700 shrink-0 whitespace-nowrap cursor-pointer transition-colors shadow-xs"
                >
                  เพิ่มอำเภอ
                </button>
              </div>
            </div>

            {/* 3. Add SubDistrict (เพิ่มตำบลใหม่) */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-2.5">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>3. เพิ่มตำบลใหม่</span>
              </h4>
              <div className="flex items-center gap-2 min-w-0 w-full">
                <select
                  value={newSubDistrictDistrictId}
                  onChange={(e) => setNewSubDistrictDistrictId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl px-2 py-2 w-28 shrink-0 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {districts.length === 0 ? (
                    <option value="">--เลือก--</option>
                  ) : (
                    districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))
                  )}
                </select>
                <input
                  type="text"
                  placeholder="เช่น ต.สุเทพ"
                  value={newSubDistrictName}
                  onChange={(e) => setNewSubDistrictName(e.target.value)}
                  className="min-w-0 flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSubDistrictName.trim()) {
                      const dist = districts.find((d) => d.id === newSubDistrictDistrictId) || districts[0];
                      addSubDistrict({
                        name: newSubDistrictName.trim(),
                        districtId: dist ? dist.id : '',
                      });
                      showToast(`เพิ่มตำบล "${newSubDistrictName.trim()}" เรียบร้อยแล้ว`);
                      setNewSubDistrictName('');
                    }
                  }}
                  className="bg-emerald-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-emerald-700 shrink-0 whitespace-nowrap cursor-pointer transition-colors shadow-xs"
                >
                  เพิ่มตำบล
                </button>
              </div>
            </div>
          </div>

          {/* List & Delete Controls for Zones, Districts & SubDistricts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Zones List */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <span>รายการเขตเลือกตั้ง ({zones.length})</span>
                </h4>
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {zones.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-2 text-center">ไม่มีข้อมูลเขตเลือกตั้ง</p>
                ) : (
                  zones.map((z) => {
                    const dName = districts.find((d) => d.id === z.districtId)?.name || '';
                    const stCount = pollingStations.filter((s) => s.zoneId === z.id).length;
                    return (
                      <div
                        key={z.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-xs text-slate-800 truncate">{z.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {dName} • {stCount} หน่วย
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'ยืนยันการลบเขตเลือกตั้ง',
                              message: `คุณต้องการลบ "${z.name}" ออกจากระบบใช่หรือไม่? (การลบเขตจะลบหน่วยเลือกตั้งในเขตนี้ด้วย)`,
                              actionText: 'ลบเขตเลือกตั้ง',
                              isDanger: true,
                              onConfirm: () => {
                                deleteZone(z.id);
                                showToast(`ลบ "${z.name}" เรียบร้อยแล้ว`);
                              },
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors shrink-0 cursor-pointer"
                          title="ลบเขต"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Districts List */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>รายการอำเภอ ({districts.length})</span>
                </h4>
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {districts.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-2 text-center">ไม่มีข้อมูลอำเภอ</p>
                ) : (
                  districts.map((d) => {
                    const zCount = zones.filter((z) => z.districtId === d.id).length;
                    const sdCount = subDistricts.filter((sd) => sd.districtId === d.id).length;
                    return (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-xs text-slate-800 truncate">{d.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {zCount} เขต • {sdCount} ตำบล
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'ยืนยันการลบอำเภอ',
                              message: `คุณต้องการลบ "${d.name}" ออกจากระบบใช่หรือไม่? (การลบอำเภอจะลบเขตเลือกตั้ง ตำบล และหน่วยเลือกตั้งที่เกี่ยวข้องด้วย)`,
                              actionText: 'ลบอำเภอ',
                              isDanger: true,
                              onConfirm: () => {
                                deleteDistrict(d.id);
                                showToast(`ลบ "${d.name}" เรียบร้อยแล้ว`);
                              },
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors shrink-0 cursor-pointer"
                          title="ลบอำเภอ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SubDistricts List */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>รายการตำบล ({subDistricts.length})</span>
                </h4>
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {subDistricts.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-2 text-center">ไม่มีข้อมูลตำบล</p>
                ) : (
                  subDistricts.map((sd) => {
                    let dName = districts.find((d) => d.id === sd.districtId)?.name;
                    if (!dName) {
                      const st = pollingStations.find((s) => s.subDistrictId === sd.id);
                      if (st) {
                        dName = districts.find((d) => d.id === st.districtId)?.name;
                      }
                    }
                    const stCount = pollingStations.filter((s) => s.subDistrictId === sd.id).length;
                    return (
                      <div
                        key={sd.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-xs text-slate-800 truncate">{sd.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {dName ? dName : <span className="text-amber-600 font-semibold">ไม่ระบุอำเภอ</span>} • {stCount} หน่วย
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'ยืนยันการลบตำบล',
                              message: `คุณต้องการลบตำบล "${sd.name}" ออกจากระบบใช่หรือไม่?`,
                              actionText: 'ลบตำบล',
                              isDanger: true,
                              onConfirm: () => {
                                deleteSubDistrict(sd.id);
                                showToast(`ลบตำบล "${sd.name}" เรียบร้อยแล้ว`);
                              },
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors shrink-0 cursor-pointer"
                          title="ลบตำบล"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Add/Edit Station Form */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>
                {editingStationId ? 'แก้ไขหน่วยเลือกตั้ง' : '4. เพิ่มหน่วยเลือกตั้งใหม่'}
              </span>
            </h3>

            <form onSubmit={handleSaveStation} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* 1. Zone (เขตเลือกตั้ง) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">1. เขตเลือกตั้ง:</label>
                <select
                  value={stZoneId}
                  onChange={(e) => setStZoneId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="">-- ไม่ระบุเขต --</option>
                  {zones
                    .filter((z) => !stDistrictId || !z.districtId || z.districtId === stDistrictId)
                    .concat(zones.filter((z) => z.districtId && z.districtId !== stDistrictId))
                    .map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* 2. District (อำเภอ) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">2. อำเภอ:</label>
                <select
                  value={stDistrictId}
                  onChange={(e) => {
                    const nextDId = e.target.value;
                    setStDistrictId(nextDId);
                    const matchingSub = subDistricts.find((sd) => sd.districtId === nextDId);
                    if (matchingSub) setStSubDistrictId(matchingSub.id);
                    const matchingZone = zones.find((z) => z.districtId === nextDId);
                    if (matchingZone) setStZoneId(matchingZone.id);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. SubDistrict (ตำบล) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">3. ตำบล:</label>
                <select
                  value={stSubDistrictId}
                  onChange={(e) => setStSubDistrictId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="">-- ไม่ระบุตำบล --</option>
                  {availableSubDistrictsForStationForm.map((sd) => (
                    <option key={sd.id} value={sd.id}>
                      {sd.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Station Name (ชื่อหน่วยเลือกตั้ง) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4. ชื่อหน่วยเลือกตั้ง:
                </label>
                <input
                  type="text"
                  placeholder="เช่น หน่วยที่ 1"
                  value={stName}
                  onChange={(e) => setStName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  required
                />
              </div>

              {/* 5. Eligible Voters */}
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

              <div className="sm:col-span-2 lg:col-span-5 flex justify-end gap-2 pt-2">
                {editingStationId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStationId(null);
                      setStName('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    ยกเลิก
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer"
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>
                    หน่วยเลือกตั้งทั้งหมด ({pollingStations.filter((s) => stationSubFilter === 'all' || s.subDistrictId === stationSubFilter).length} / {pollingStations.length} หน่วย)
                  </span>
                </h3>
                <span className="text-xs text-slate-500 font-normal">
                  นับเสร็จแล้ว: {pollingStations.filter((s) => s.status === 'completed').length} / {pollingStations.length} หน่วย
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* SubDistrict Filter */}
                <select
                  value={stationSubFilter}
                  onChange={(e) => setStationSubFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">แสดงทุกตำบล ({subDistricts.length} ตำบล)</option>
                  {subDistricts.map((sd) => (
                    <option key={sd.id} value={sd.id}>
                      ตำบล {sd.name}
                    </option>
                  ))}
                </select>

                {/* Deduplicate Button */}
                <button
                  type="button"
                  onClick={handleRunDeduplication}
                  className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300/80 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="ลบหรือรวมหน่วยเลือกตั้งที่มีชื่อซ้ำกันในตำบลเดียวกัน"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-800" />
                  <span>ขจัดหน่วยซ้ำ (ยึดตำบลเป็นหลัก)</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {pollingStations
                .filter((s) => stationSubFilter === 'all' || s.subDistrictId === stationSubFilter)
                .map((station) => {
                const dName = districts.find((d) => d.id === station.districtId)?.name;
                const sdName = subDistricts.find((sd) => sd.id === station.subDistrictId)?.name;
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
                        <div className="font-bold text-slate-900 text-sm flex flex-wrap items-center gap-2">
                          <span>{station.name}</span>
                          {sdName && (
                            <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-lg">
                              ต.{sdName}
                            </span>
                          )}
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
                          {dName || ''} {sdName ? `• ตำบล${sdName}` : ''} • {zName || ''} • ผู้มีสิทธิ:{' '}
                          <span className="font-semibold text-slate-800">
                            {(station.totalEligibleVoters ?? 0).toLocaleString()} คน
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
                          setEditingStationId(station.id);
                          setStName(station.name);
                          setStNumber(station.stationNumber);
                          setStDistrictId(station.districtId);
                          setStSubDistrictId(station.subDistrictId || subDistricts[0]?.id || '');
                          setStZoneId(station.zoneId);
                          setStVoters(station.totalEligibleVoters);
                        }}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="แก้ไขหน่วย"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'ยืนยันการลบหน่วยเลือกตั้ง',
                            message: `คุณต้องการลบหน่วย "${station.name}" ออกจากระบบใช่หรือไม่?`,
                            actionText: 'ลบหน่วยเลือกตั้ง',
                            isDanger: true,
                            onConfirm: () => {
                              deletePollingStation(station.id);
                              showToast(`ลบหน่วย "${station.name}" เรียบร้อยแล้ว`);
                            },
                          });
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Export CSV Card */}
              <div className="p-5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm">
                    <Download className="w-5 h-5 text-indigo-600" />
                    <span>ส่งออกรายงานคะแนน CSV</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    ดาวน์โหลดไฟล์สรุปคะแนนผู้สมัครทุกพรรคแยกตามลำดับ สำหรับนำไปประมวลผลต่อใน Excel
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer mt-3"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด CSV</span>
                </button>
              </div>

              {/* Clear All Votes Card */}
              <div className="p-5 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                    <RotateCcw className="w-5 h-5 text-amber-600" />
                    <span>ล้างผลคะแนนทั้งหมด (Clear Votes)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    ล้างคะแนนที่บันทึกไว้ทุกหน่วยเลือกตั้งกลับเป็น 0 (คงผู้สมัครและหน่วยเลือกตั้งเดิมไว้)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'ยืนยันการล้างคะแนนเป็น 0',
                      message: 'คุณแน่ใจหรือไม่ว่าต้องการล้างผลคะแนนทั้งหมดกลับเป็น 0? (ผู้สมัครและหน่วยเลือกตั้งจะยังคงเดิม)',
                      actionText: 'ล้างคะแนนเป็น 0 ทั้งหมด',
                      isDanger: true,
                      onConfirm: () => {
                        clearAllVotes();
                        showToast('ล้างผลคะแนนเรียบร้อยแล้ว!');
                      },
                    });
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer mt-3"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>ล้างคะแนนเป็น 0 ทั้งหมด</span>
                </button>
              </div>

              {/* Clear All System Data / Reset Default Card */}
              <div className="p-5 bg-red-50/70 border border-red-200/90 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-red-900 font-bold text-sm">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <span>ล้างข้อมูล / รีเซ็ตระบบ</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    ล้างข้อมูลทั้งหมดในระบบ หรือโหลดข้อมูลตัวอย่างเริ่มต้น
                  </p>
                </div>
                <div className="space-y-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'คำเตือน: ล้างข้อมูลทั้งหมดในระบบ',
                        message: 'คุณต้องการล้างข้อมูลทั้งหมด (ผู้สมัคร พรรค เขต และคะแนน) ออกจากระบบใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
                        actionText: 'ล้างข้อมูลทั้งหมด',
                        isDanger: true,
                        onConfirm: () => {
                          clearAllData();
                          showToast('ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว!');
                        },
                      });
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ล้างข้อมูลทั้งหมด (Wipe All)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'ยืนยันการโหลดข้อมูลตัวอย่าง',
                        message: 'คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตกลับเป็นข้อมูลตัวอย่างเริ่มต้น?',
                        actionText: 'โหลดข้อมูลตัวอย่าง',
                        isDanger: false,
                        onConfirm: () => {
                          resetToDefaultData();
                          showToast('รีเซ็ตเป็นข้อมูลตัวอย่างเรียบร้อยแล้ว!');
                        },
                      });
                    }}
                    className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>โหลดข้อมูลตัวอย่าง (Default Sample)</span>
                  </button>
                </div>
              </div>
            </div>
        </div>
      </div>
      )}
      {/* Excel Location Import Preview Modal */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    ตรวจสอบข้อมูลนำเข้าจากไฟล์ Excel
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ตรวจสอบรายการก่อนบันทึกเข้าสู่ระบบฐานข้อมูล (เขตเลือกตั้ง &gt; อำเภอ &gt; ตำบล &gt; หน่วยเลือกตั้ง)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExcelModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                <span>พบข้อมูลพร้อมนำเข้าทั้งหมด {excelRows.length} รายการ</span>
              </div>
              <div className="text-slate-600 font-medium">
                * ระบบจะสร้าง อำเภอ, ตำบล, เขต และหน่วยเลือกตั้งที่ยังไม่มีให้อัตโนมัติ
              </div>
            </div>

            {/* Rows Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">เขตเลือกตั้ง</th>
                    <th className="py-2.5 px-3">อำเภอ</th>
                    <th className="py-2.5 px-3">ตำบล</th>
                    <th className="py-2.5 px-3">หน่วยเลือกตั้ง</th>
                    <th className="py-2.5 px-3 text-right">ผู้มีสิทธิเลือกตั้ง (คน)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {excelRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{row.zoneName || 'เขตเลือกตั้งที่ 1'}</td>
                      <td className="py-2 px-3 font-bold text-indigo-900">{row.districtName}</td>
                      <td className="py-2 px-3 text-slate-700 font-medium">{row.subDistrictName || '-'}</td>
                      <td className="py-2 px-3 text-slate-900 font-semibold">{row.stationName}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800 font-mono">
                        {(row.totalEligibleVoters || 1000).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                แสดงตัวอย่าง {excelRows.length} แถว
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowExcelModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExcelImport}
                  className="px-5 py-2 text-xs font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <FileCheck className="w-4 h-4 text-slate-950" />
                  <span>ยืนยันนำเข้าข้อมูลเข้าสู่ระบบ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className={`p-3 rounded-2xl shrink-0 ${confirmModal.isDanger ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">{confirmModal.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-colors cursor-pointer shadow-xs ${
                  confirmModal.isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {confirmModal.actionText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2.5 animate-in slide-in-from-bottom-2 duration-200">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
