import React, { useMemo } from 'react';
import { useElection } from '../context/ElectionContext';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Award,
  Search,
  Building2,
  MapPin,
  TrendingUp,
  RefreshCw,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart2,
  ChevronRight,
  Eye,
  Info,
  FileText,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const PublicDashboard: React.FC = () => {
  const {
    electionTitle,
    candidates,
    districts,
    zones,
    pollingStations,
    votes,
    selectedDistrictId,
    setSelectedDistrictId,
    selectedZoneId,
    setSelectedZoneId,
    selectedStationId,
    setSelectedStationId,
    searchQuery,
    setSearchQuery,
    triggerWinnerConfetti,
    isAutoSimulationActive,
    toggleStationCompletion,
    toggleZoneCompletion,
  } = useElection();

  // Filter available zones based on selected district
  const availableZones = useMemo(() => {
    if (selectedDistrictId === 'all') return zones;
    return zones.filter((z) => z.districtId === selectedDistrictId);
  }, [zones, selectedDistrictId]);

  // Filter available polling stations based on selected district & zone
  const filteredStations = useMemo(() => {
    return pollingStations.filter((s) => {
      if (selectedDistrictId !== 'all' && s.districtId !== selectedDistrictId) return false;
      if (selectedZoneId !== 'all' && s.zoneId !== selectedZoneId) return false;
      if (selectedStationId !== 'all' && s.id !== selectedStationId) return false;
      return true;
    });
  }, [pollingStations, selectedDistrictId, selectedZoneId, selectedStationId]);

  const filteredStationIds = useMemo(
    () => new Set(filteredStations.map((s) => s.id)),
    [filteredStations]
  );

  // Aggregated vote metrics for filtered stations
  const { candidateTotals, totalValidVotes, totalInvalidVotes, totalNoVotes, grandTotalVotes, totalEligibleVoters } =
    useMemo(() => {
      const totals: Record<string, number> = {};
      candidates.forEach((c) => (totals[c.id] = 0));

      let invalidSum = 0;
      let noVoteSum = 0;

      votes.forEach((v) => {
        if (filteredStationIds.has(v.stationId)) {
          Object.entries(v.candidateVotes).forEach(([candId, count]) => {
            totals[candId] = (totals[candId] || 0) + (count as number);
          });
          invalidSum += v.invalidVotes || 0;
          noVoteSum += v.noVotes || 0;
        }
      });

      const validSum = Object.values(totals).reduce((a, b) => a + b, 0);
      const grandTotal = validSum + invalidSum + noVoteSum;

      const eligibleSum = filteredStations.reduce((sum, s) => sum + (s.totalEligibleVoters || 0), 0);

      return {
        candidateTotals: totals,
        totalValidVotes: validSum,
        totalInvalidVotes: invalidSum,
        totalNoVotes: noVoteSum,
        grandTotalVotes: grandTotal,
        totalEligibleVoters: eligibleSum,
      };
    }, [candidates, votes, filteredStationIds, filteredStations]);

  // Sorted candidates by vote count
  const sortedCandidates = useMemo(() => {
    return candidates
      .map((cand) => {
        const voteCount = candidateTotals[cand.id] || 0;
        const percentage = totalValidVotes > 0 ? (voteCount / totalValidVotes) * 100 : 0;
        return {
          ...cand,
          voteCount,
          percentage,
        };
      })
      .filter((cand) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          cand.name.toLowerCase().includes(q) ||
          cand.partyName.toLowerCase().includes(q) ||
          cand.number.toString() === q
        );
      })
      .sort((a, b) => b.voteCount - a.voteCount);
  }, [candidates, candidateTotals, totalValidVotes, searchQuery]);

  const leaderCandidate = sortedCandidates[0];
  const runnerUpCandidate = sortedCandidates[1];
  const leadMargin =
    leaderCandidate && runnerUpCandidate
      ? leaderCandidate.voteCount - runnerUpCandidate.voteCount
      : leaderCandidate?.voteCount || 0;

  // Percentage counted stations
  const completedStationsCount = filteredStations.filter((s) => s.status === 'completed').length;
  const stationCountProgress =
    filteredStations.length > 0 ? (completedStationsCount / filteredStations.length) * 100 : 0;

  // Turnout percentage
  const turnoutPercentage =
    totalEligibleVoters > 0 ? (grandTotalVotes / totalEligibleVoters) * 100 : 0;

  // Data for Recharts Bar Chart
  const barChartData = useMemo(() => {
    return sortedCandidates.map((c) => ({
      name: `หมายเลข ${c.number} ${c.name.split(' ')[0]}`,
      votes: c.voteCount,
      color: c.partyColor,
      partyName: c.partyName,
      fullCandidateName: c.name,
      number: c.number,
    }));
  }, [sortedCandidates]);

  // Data for Recharts Pie Chart (Party shares)
  const partyPieData = useMemo(() => {
    const partyVotes: Record<string, { name: string; color: string; votes: number }> = {};

    sortedCandidates.forEach((c) => {
      if (!partyVotes[c.partyName]) {
        partyVotes[c.partyName] = { name: c.partyName, color: c.partyColor, votes: 0 };
      }
      partyVotes[c.partyName].votes += c.voteCount;
    });

    return Object.values(partyVotes).filter((p) => p.votes > 0);
  }, [sortedCandidates]);

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic Election Title & Live Status Banner */}
      <div className="bg-gradient-to-r from-[#2d8a68] via-[#247558] to-[#1b5b44] border border-[#1d634a] rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-extrabold px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                <Eye className="w-3.5 h-3.5 text-amber-300" />
                <span>รายงานผลสดเรียลไทม์ • กกต. จังหวัดอุดรธานี</span>
              </span>
              {isAutoSimulationActive && (
                <span className="text-[10px] bg-amber-400 text-emerald-950 font-black px-2.5 py-0.5 rounded-full animate-pulse">
                  โหมดจำลองคะแนนสด
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-xs">
              {electionTitle}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-200/90">
              ศูนย์สรุปผลคะแนนอย่างไม่เป็นทางการ แยกตามอำเภอ เขตเลือกตั้ง และหน่วยเลือกตั้ง
            </p>
          </div>

          <button
            onClick={triggerWinnerConfetti}
            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 shrink-0 self-start sm:self-center border border-amber-300/60 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-950" />
            <span>จุดพลุฉลองผู้ชนะ</span>
          </button>
        </div>
      </div>

      {/* FILTER & BREAKDOWN CONTROLS (แยกอำเภอ / แยกเขต / แยกหน่วย) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span>กรองข้อมูลรายพื้นที่ (Filter Area)</span>
          </h3>
          {(selectedDistrictId !== 'all' || selectedZoneId !== 'all' || selectedStationId !== 'all') && (
            <button
              onClick={() => {
                setSelectedDistrictId('all');
                setSelectedZoneId('all');
                setSelectedStationId('all');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>ล้างตัวกรองทั้งหมด</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* District Dropdown (แยกอำเภอ) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>1. อำเภอ:</span>
            </label>
            <select
              value={selectedDistrictId}
              onChange={(e) => {
                setSelectedDistrictId(e.target.value);
                setSelectedZoneId('all');
                setSelectedStationId('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="all">ทุกอำเภอ ({districts.length} อำเภอ)</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Zone Dropdown (แยกเขตเลือกตั้ง) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>2. เขตเลือกตั้ง:</span>
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => {
                setSelectedZoneId(e.target.value);
                setSelectedStationId('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="all">ทุกเขตเลือกตั้ง ({availableZones.length} เขต)</option>
              {availableZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* Station Dropdown (แยกหน่วยเลือกตั้ง) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>3. หน่วยเลือกตั้ง:</span>
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="all">ทุกหน่วยเลือกตั้ง ({filteredStations.length} หน่วย)</option>
              {filteredStations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status === 'completed' ? '✓ นับเสร็จ' : 'กำลังนับ'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* OVERALL METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Votes Counted */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">คะแนนรวมนับแล้วทั้งหมด</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {grandTotalVotes.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>จากผู้มีสิทธิทั้งหมด {totalEligibleVoters.toLocaleString()} คน</span>
          </div>
        </div>

        {/* Metric 2: Turnout % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">% ผู้มาใช้สิทธิ (Turnout)</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-900 tracking-tight">
            {turnoutPercentage.toFixed(1)}%
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(turnoutPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Polling Stations Counted */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">หน่วยนับเสร็จสิ้น</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 tracking-tight">
            {completedStationsCount}{' '}
            <span className="text-xs text-slate-400 font-normal">/ {filteredStations.length} หน่วย</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            คิดเป็น {stationCountProgress.toFixed(1)}% ของหน่วยทั้งหมด
          </div>
        </div>

        {/* Metric 4: Voters vs Counted */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">สัดส่วนบัตรดี / เสีย / ไม่เลือก</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {grandTotalVotes > 0 ? ((totalValidVotes / grandTotalVotes) * 100).toFixed(1) : '0.0'}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            บัตรดี {totalValidVotes.toLocaleString()} • บัตรเสีย {totalInvalidVotes.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 3-CATEGORY BALLOT CLASSIFICATION SUMMARY (สรุปจำแนกประเภทบัตรเลือกตั้ง) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>สรุปจำแนกประเภทบัตรเลือกตั้ง (Ballot Classification)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              แยกตาม 1. บัตรดี 2. บัตรเสีย และ 3. ไม่ประสงค์ลงคะแนน
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            รวมบัตรทั้งหมด: <span className="font-bold text-slate-900">{grandTotalVotes.toLocaleString()}</span> เสียง
          </div>
        </div>

        {/* 3 Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Category 1: บัตรดี */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-900 bg-emerald-200/70 px-2.5 py-0.5 rounded-full border border-emerald-300">
                1. บัตรดี
              </span>
              <span className="text-xs font-bold text-emerald-700">
                {grandTotalVotes > 0 ? ((totalValidVotes / grandTotalVotes) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-950">
              {totalValidVotes.toLocaleString()} <span className="text-xs font-normal text-emerald-800">คะแนน</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              คะแนนรวมที่ลงให้ผู้สมัครทุกหมายเลขถูกต้อง
            </p>
          </div>

          {/* Category 2: บัตรเสีย */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-900 bg-rose-200/70 px-2.5 py-0.5 rounded-full border border-rose-300">
                2. บัตรเสีย
              </span>
              <span className="text-xs font-bold text-rose-700">
                {grandTotalVotes > 0 ? ((totalInvalidVotes / grandTotalVotes) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-950">
              {totalInvalidVotes.toLocaleString()} <span className="text-xs font-normal text-rose-800">คะแนน</span>
            </div>
            <p className="text-[11px] text-rose-800">
              บัตรที่ไม่สามารถคำนวณหรือนับเป็นคะแนนได้
            </p>
          </div>

          {/* Category 3: ไม่ประสงค์ลงคะแนน */}
          <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-200 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 bg-slate-200/90 px-2.5 py-0.5 rounded-full border border-slate-300">
                3. ไม่ประสงค์ลงคะแนน
              </span>
              <span className="text-xs font-bold text-slate-700">
                {grandTotalVotes > 0 ? ((totalNoVotes / grandTotalVotes) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950">
              {totalNoVotes.toLocaleString()} <span className="text-xs font-normal text-slate-600">คะแนน</span>
            </div>
            <p className="text-[11px] text-slate-600">
              บัตรทำเครื่องหมายกากบาทในช่องไม่เลือกผู้ใด
            </p>
          </div>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>สัดส่วนประเภทบัตรทั้งหมด ({grandTotalVotes.toLocaleString()} ใบ)</span>
            <span>100%</span>
          </div>
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60 p-0.5">
            {grandTotalVotes > 0 ? (
              <>
                <div
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                  style={{ width: `${(totalValidVotes / grandTotalVotes) * 100}%` }}
                  title={`1. บัตรดี: ${totalValidVotes.toLocaleString()} (${((totalValidVotes / grandTotalVotes) * 100).toFixed(1)}%)`}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${(totalInvalidVotes / grandTotalVotes) * 100}%` }}
                  title={`2. บัตรเสีย: ${totalInvalidVotes.toLocaleString()} (${((totalInvalidVotes / grandTotalVotes) * 100).toFixed(1)}%)`}
                />
                <div
                  className="bg-slate-400 h-full rounded-r-full transition-all duration-500"
                  style={{ width: `${(totalNoVotes / grandTotalVotes) * 100}%` }}
                  title={`3. ไม่ประสงค์ลงคะแนน: ${totalNoVotes.toLocaleString()} (${((totalNoVotes / grandTotalVotes) * 100).toFixed(1)}%)`}
                />
              </>
            ) : (
              <div className="bg-slate-200 w-full h-full rounded-full" />
            )}
          </div>
          <div className="flex items-center justify-center gap-4 text-[11px] pt-1 text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>1. บัตรดี ({grandTotalVotes > 0 ? ((totalValidVotes / grandTotalVotes) * 100).toFixed(1) : 0}%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>2. บัตรเสีย ({grandTotalVotes > 0 ? ((totalInvalidVotes / grandTotalVotes) * 100).toFixed(1) : 0}%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
              <span>3. ไม่ประสงค์ลงคะแนน ({grandTotalVotes > 0 ? ((totalNoVotes / grandTotalVotes) * 100).toFixed(1) : 0}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* LEADER CANDIDATE HERO STANDING */}
      {leaderCandidate && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl relative overflow-hidden">
          <div
            className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: leaderCandidate.partyColor }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            {/* Candidate Photo with Lead Badge */}
            <div className="relative shrink-0">
              <div
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-4 shadow-xl object-cover bg-slate-800"
                style={{ borderColor: leaderCandidate.partyColor }}
              >
                <img
                  src={leaderCandidate.photoUrl}
                  alt={leaderCandidate.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Number Badge */}
              <div
                className="absolute -bottom-2 -left-2 w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-lg shadow-lg border-2 border-slate-900"
                style={{ backgroundColor: leaderCandidate.partyColor }}
              >
                #{leaderCandidate.number}
              </div>

              {/* Leader Ribbon */}
              <div className="absolute -top-3 -right-3 bg-amber-400 text-slate-950 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center space-x-1 border border-amber-300">
                <Award className="w-3.5 h-3.5 text-slate-950" />
                <span>อันดับ 1 นำอยู่</span>
              </div>
            </div>

            {/* Candidate Details */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: leaderCandidate.partyColor }}
                />
                <span className="font-semibold">{leaderCandidate.partyName}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {leaderCandidate.name}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl line-clamp-2">
                {leaderCandidate.bio || 'ผู้สมัครรับเลือกตั้งประจำเขต'}
              </p>

              {/* Vote Count highlight */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-amber-400">
                    {leaderCandidate.voteCount.toLocaleString()} <span className="text-xs text-slate-300 font-normal">คะแนน</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    คิดเป็น {leaderCandidate.percentage.toFixed(2)}% ของบัตรดีทั้งหมด
                  </div>
                </div>

                {runnerUpCandidate && (
                  <div className="border-l border-slate-700 pl-4 py-1 text-xs text-slate-300">
                    <div>
                      นำอันดับ 2 อยู่:{' '}
                      <span className="font-bold text-emerald-400">
                        +{leadMargin.toLocaleString()} คะแนน
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      (อันดับ 2: {runnerUpCandidate.name} - {runnerUpCandidate.voteCount.toLocaleString()} คะแนน)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECHARTS & STANDINGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Candidate Standings List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>สรุปอันดับคะแนนผู้สมัคร (Leaderboard)</span>
            </h3>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหาผู้สมัคร/พรรค..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-36 sm:w-48"
              />
            </div>
          </div>

          <div className="space-y-3">
            {sortedCandidates.map((cand, index) => {
              const isWinner = index === 0;
              return (
                <div
                  key={cand.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center space-x-3 ${
                    isWinner
                      ? 'bg-amber-50/50 border-amber-200 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-50'
                  }`}
                >
                  {/* Rank indicator */}
                  <div className="font-black text-slate-400 text-sm w-6 text-center shrink-0">
                    #{index + 1}
                  </div>

                  {/* Candidate Photo */}
                  <div className="relative shrink-0">
                    <img
                      src={cand.photoUrl}
                      alt={cand.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                    />
                    <div
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md text-[10px] font-bold text-white flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: cand.partyColor }}
                    >
                      {cand.number}
                    </div>
                  </div>

                  {/* Candidate Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 truncate">{cand.name}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: cand.partyColor }}
                      />
                      <span className="font-medium text-slate-700">{cand.partyName}</span>
                    </div>

                    {/* Progress vote bar */}
                    <div className="w-full bg-slate-200/80 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${cand.percentage}%`,
                          backgroundColor: cand.partyColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Vote Count & Percent */}
                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-sm sm:text-base text-slate-900">
                      {cand.voteCount.toLocaleString()}{' '}
                      <span className="text-[10px] font-normal text-slate-500">คะแนน</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-600">
                      {cand.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recharts Visualizations (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Bar Chart Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span>เปรียบเทียบคะแนนผู้สมัคร (Bar Chart)</span>
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="number" tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString()} คะแนน`, 'คะแนนที่ได้']}
                    labelFormatter={(label) => `ผู้สมัครหมายเลข ${label}`}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  />
                  <Bar dataKey="votes" radius={[8, 8, 0, 0]}>
                    {barChartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <PieChartIcon className="w-4 h-4 text-orange-500" />
              <span>สัดส่วนคะแนนเสียงรายพรรค (Party Distribution)</span>
            </h3>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={partyPieData}
                    dataKey="votes"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {partyPieData.map((entry, idx) => (
                      <Cell key={`pie-cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString()} คะแนน`, 'คะแนนพรรค']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Party Legend */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              {partyPieData.map((p) => (
                <div key={p.name} className="flex items-center space-x-2 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="font-medium text-slate-700 truncate">{p.name}:</span>
                  <span className="font-bold text-slate-900">{p.votes.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ZONE COMPLETION SUMMARY (สรุปสถานะการนับคะแนนรายเขตสำหรับประชาชน) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>สรุปสถานะการนับคะแนนเสร็จสิ้น รายเขตเลือกตั้ง</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงความคืบหน้าการนับคะแนนรายเขต (การอัปเดตและติ๊กนับเสร็จทำโดยเจ้าหน้าที่)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableZones.map((zone) => {
            const zDistrict = districts.find((d) => d.id === zone.districtId);
            const zoneStations = pollingStations.filter((s) => s.zoneId === zone.id);
            const completedCount = zoneStations.filter((s) => s.status === 'completed').length;
            const isAllCompleted = zoneStations.length > 0 && completedCount === zoneStations.length;
            const pct = zoneStations.length > 0 ? Math.round((completedCount / zoneStations.length) * 100) : 0;

            return (
              <div
                key={zone.id}
                className={`p-3.5 rounded-2xl border flex items-start space-x-3 ${
                  isAllCompleted
                    ? 'bg-emerald-50/90 border-emerald-200/90 shadow-xs'
                    : 'bg-slate-50/90 border-slate-200/80'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 text-xs truncate">{zone.name}</span>
                    {isAllCompleted ? (
                      <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>นับเสร็จแล้ว 100%</span>
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                        {completedCount}/{zoneStations.length} หน่วย ({pct}%)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>{zDistrict?.name || 'อำเภอ'}</span>
                    <span>{zoneStations.length} หน่วยเลือกตั้ง</span>
                  </div>
                  {/* Small progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAllCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POLLING STATIONS STATUS TABLE & ACCORDION (สถานะรายหน่วยเลือกตั้ง) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-700" />
              <span>สถานะการนับคะแนนรายหน่วยเลือกตั้ง ({filteredStations.length} หน่วย)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงสถานะเรียลไทม์ของแต่ละหน่วยเลือกตั้งในระบบ
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            นับเสร็จแล้ว {filteredStations.filter((s) => s.status === 'completed').length} / {filteredStations.length} หน่วย
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-y border-slate-200">
                <th className="py-3 px-3">หน่วยเลือกตั้ง</th>
                <th className="py-3 px-3">อำเภอ / เขต</th>
                <th className="py-3 px-3">ผู้มีสิทธิ</th>
                <th className="py-3 px-3 text-emerald-800">1. บัตรดี</th>
                <th className="py-3 px-3 text-rose-800">2. บัตรเสีย</th>
                <th className="py-3 px-3 text-slate-700">3. ไม่ลงคะแนน</th>
                <th className="py-3 px-3 font-extrabold">คะแนนรวม</th>
                <th className="py-3 px-3">สถานะ</th>
                <th className="py-3 px-3">อัปเดตล่าสุด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredStations.map((station) => {
                const stationVoteEntry = votes.find((v) => v.stationId === station.id);
                const stationValidVotes = stationVoteEntry
                  ? (Object.values(stationVoteEntry.candidateVotes) as number[]).reduce((a: number, b: number) => a + b, 0)
                  : 0;
                const stationInvalidVotes = stationVoteEntry?.invalidVotes || 0;
                const stationNoVotes = stationVoteEntry?.noVotes || 0;
                const stationTotalVotes = stationValidVotes + stationInvalidVotes + stationNoVotes;

                const stationDistrict = districts.find((d) => d.id === station.districtId);
                const stationZone = zones.find((z) => z.id === station.zoneId);
                const isCompleted = station.status === 'completed';

                return (
                  <tr
                    key={station.id}
                    className={`transition-colors ${
                      isCompleted ? 'bg-emerald-50/40 hover:bg-emerald-50/80' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {station.name}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {stationDistrict?.name} • {stationZone?.name}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600">
                      {station.totalEligibleVoters.toLocaleString()} คน
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-700">
                      {stationValidVotes.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-700">
                      {stationInvalidVotes.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-600">
                      {stationNoVotes.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900">
                      {stationTotalVotes.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          นับเสร็จแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-200">
                          <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                          กำลังนับ
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {stationVoteEntry?.updatedAt
                        ? new Date(stationVoteEntry.updatedAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
