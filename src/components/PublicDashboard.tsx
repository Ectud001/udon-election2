import React, { useMemo, useEffect } from 'react';
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
  ChevronRight,
  Eye,
  Info,
  FileText,
  Compass,
} from 'lucide-react';

export const PublicDashboard: React.FC = () => {
  const {
    electionTitle,
    candidates,
    districts,
    subDistricts,
    zones,
    pollingStations,
    votes,
    selectedDistrictId,
    setSelectedDistrictId,
    selectedSubDistrictId,
    setSelectedSubDistrictId,
    selectedZoneId,
    setSelectedZoneId,
    selectedStationId,
    setSelectedStationId,
    searchQuery,
    setSearchQuery,
    triggerWinnerConfetti,
    isAutoSimulationActive,
  } = useElection();

  // Filter available districts based on selected zone
  const availableDistricts = useMemo(() => {
    if (!selectedZoneId || selectedZoneId === 'all') return districts;

    const zoneStationDistrictIds = new Set(
      pollingStations.filter((s) => s.zoneId === selectedZoneId && s.districtId).map((s) => s.districtId)
    );
    const matching = districts.filter(
      (d) => zoneStationDistrictIds.has(d.id) || zones.some((z) => z.id === selectedZoneId && z.districtId === d.id)
    );

    return matching.length > 0 ? matching : districts;
  }, [districts, zones, pollingStations, selectedZoneId]);

  // Filter available subDistricts based on selected district and zone
  const availableSubDistricts = useMemo(() => {
    let list = subDistricts;

    if (selectedDistrictId && selectedDistrictId !== 'all') {
      const filtered = list.filter((sd) => sd.districtId === selectedDistrictId);
      if (filtered.length > 0) return filtered;

      const stationSubIds = new Set(
        pollingStations.filter((s) => s.districtId === selectedDistrictId && s.subDistrictId).map((s) => s.subDistrictId)
      );
      const matchedByStation = list.filter((sd) => stationSubIds.has(sd.id) || !sd.districtId);
      if (matchedByStation.length > 0) return matchedByStation;

      return list;
    } else if (selectedZoneId && selectedZoneId !== 'all') {
      const zoneDistrictIds = new Set(availableDistricts.map((d) => d.id));
      const filtered = list.filter((sd) => !sd.districtId || (sd.districtId && zoneDistrictIds.has(sd.districtId)));
      return filtered.length > 0 ? filtered : list;
    }

    return list;
  }, [subDistricts, selectedDistrictId, selectedZoneId, availableDistricts, pollingStations]);

  // Filter available zones based on selected district (with fallback to all zones if none specifically assigned)
  const availableZones = useMemo(() => {
    if (!selectedDistrictId || selectedDistrictId === 'all') return zones;

    const districtStationZoneIds = new Set(
      pollingStations.filter((s) => s.districtId === selectedDistrictId).map((s) => s.zoneId)
    );
    const matching = zones.filter(
      (z) => !z.districtId || z.districtId === selectedDistrictId || districtStationZoneIds.has(z.id)
    );

    return matching.length > 0 ? matching : zones;
  }, [zones, pollingStations, selectedDistrictId]);

  // Filter available polling stations strictly based on selected zone, district & subdistrict
  const availableStations = useMemo(() => {
    return pollingStations.filter((s) => {
      if (selectedZoneId && selectedZoneId !== 'all' && s.zoneId && s.zoneId !== selectedZoneId) {
        return false;
      }
      if (selectedDistrictId && selectedDistrictId !== 'all') {
        const directMatch = s.districtId === selectedDistrictId;
        const subMatch = s.subDistrictId ? subDistricts.some((sd) => sd.id === s.subDistrictId && sd.districtId === selectedDistrictId) : false;
        if (!directMatch && !subMatch) return false;
      }
      if (selectedSubDistrictId && selectedSubDistrictId !== 'all') {
        if (s.subDistrictId !== selectedSubDistrictId) return false;
      }
      return true;
    });
  }, [pollingStations, subDistricts, selectedDistrictId, selectedSubDistrictId, selectedZoneId]);

  // Auto-reset filters if current selections are invalid in current lists
  useEffect(() => {
    if (selectedDistrictId !== 'all' && availableDistricts.length > 0) {
      if (!availableDistricts.some((d) => d.id === selectedDistrictId)) {
        setSelectedDistrictId('all');
      }
    }
  }, [availableDistricts, selectedDistrictId]);

  useEffect(() => {
    if (selectedSubDistrictId !== 'all' && availableSubDistricts.length > 0) {
      if (!availableSubDistricts.some((sd) => sd.id === selectedSubDistrictId)) {
        setSelectedSubDistrictId('all');
      }
    }
  }, [availableSubDistricts, selectedSubDistrictId]);

  useEffect(() => {
    if (selectedZoneId !== 'all' && availableZones.length > 0) {
      if (!availableZones.some((z) => z.id === selectedZoneId)) {
        setSelectedZoneId('all');
      }
    }
  }, [availableZones, selectedZoneId]);

  useEffect(() => {
    if (selectedStationId !== 'all' && availableStations.length > 0) {
      if (!availableStations.some((s) => s.id === selectedStationId)) {
        setSelectedStationId('all');
      }
    }
  }, [availableStations, selectedStationId]);

  // Filtered stations for aggregated vote calculations (applying selectedStationId)
  const filteredStations = useMemo(() => {
    if (selectedStationId && selectedStationId !== 'all') {
      const matched = availableStations.filter((s) => s.id === selectedStationId);
      if (matched.length > 0) return matched;
      const directMatch = pollingStations.filter((s) => s.id === selectedStationId);
      if (directMatch.length > 0) return directMatch;
    }
    return availableStations;
  }, [availableStations, pollingStations, selectedStationId]);

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
        if (v && filteredStationIds.has(v.stationId)) {
          if (v.candidateVotes) {
            Object.entries(v.candidateVotes).forEach(([candId, count]) => {
              totals[candId] = (totals[candId] || 0) + (count as number);
            });
          }
          invalidSum += v.invalidVotes || 0;
          noVoteSum += v.noVotes || 0;
        }
      });

      const validSum = Object.values(totals || {}).reduce((a, b) => a + b, 0);
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

      {/* FILTER & BREAKDOWN CONTROLS (แยกอำเภอ / แยกตำบล / แยกเขต / แยกหน่วย) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span>กรองข้อมูลรายพื้นที่ (Filter Area)</span>
          </h3>
          {(selectedDistrictId !== 'all' || selectedSubDistrictId !== 'all' || selectedZoneId !== 'all' || selectedStationId !== 'all') && (
            <button
              onClick={() => {
                setSelectedDistrictId('all');
                setSelectedSubDistrictId('all');
                setSelectedZoneId('all');
                setSelectedStationId('all');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>ล้างตัวกรองทั้งหมด</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Zone Dropdown (แยกเขตเลือกตั้ง) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              <span>1. เขตเลือกตั้ง:</span>
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => {
                setSelectedZoneId(e.target.value);
                setSelectedDistrictId('all');
                setSelectedSubDistrictId('all');
                setSelectedStationId('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option key="all" value="all">ทุกเขตเลือกตั้ง ({availableZones.length} เขต)</option>
              {availableZones.map((z, idx) => (
                <option key={z.id || `z-${idx}`} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* District Dropdown (แยกอำเภอ) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>2. อำเภอ:</span>
            </label>
            <select
              value={selectedDistrictId}
              onChange={(e) => {
                setSelectedDistrictId(e.target.value);
                setSelectedSubDistrictId('all');
                setSelectedZoneId('all');
                setSelectedStationId('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option key="all" value="all">ทุกอำเภอ ({availableDistricts.length} อำเภอ)</option>
              {availableDistricts.map((d, idx) => (
                <option key={d.id || `dist-${idx}`} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* SubDistrict Dropdown (แยกตำบล) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. ตำบล:</span>
            </label>
            <select
              value={selectedSubDistrictId}
              onChange={(e) => {
                setSelectedSubDistrictId(e.target.value);
                setSelectedStationId('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option key="all" value="all">ทุกตำบล ({availableSubDistricts.length} ตำบล)</option>
              {availableSubDistricts.map((sd, idx) => (
                <option key={sd.id || `sd-${idx}`} value={sd.id}>
                  {sd.name}
                </option>
              ))}
            </select>
          </div>

          {/* Station Dropdown (แยกหน่วยเลือกตั้ง) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>4. หน่วยเลือกตั้ง:</span>
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option key="all" value="all">ทุกหน่วยเลือกตั้ง ({availableStations.length} หน่วย)</option>
              {availableStations.map((s, idx) => {
                const subName = subDistricts.find((sd) => sd.id === s.subDistrictId)?.name;
                return (
                  <option key={s.id || `st-${idx}`} value={s.id}>
                    {s.name}{selectedSubDistrictId === 'all' && subName ? ` (${subName})` : ''} ({s.status === 'completed' ? '✓ นับเสร็จ' : 'กำลังนับ'})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* MAIN DASHBOARD GRID: TOP ROW (LEADER HERO + LEADERBOARD) / BOTTOM ROW (METRICS + BALLOT CLASSIFICATION) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* TOP LEFT: LEADER CANDIDATE HERO STANDING */}
        <div className="xl:col-span-6">
          {leaderCandidate && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border-2 border-amber-400/50 shadow-lg relative overflow-hidden ring-2 ring-amber-400/20 h-full flex flex-col justify-between">
              <div
                className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-2xl opacity-30 pointer-events-none"
                style={{ backgroundColor: leaderCandidate.partyColor }}
              />

              <div className="relative z-10 space-y-3">
                {/* Top Badge Row (Clean, no photo overlap) */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs sm:text-sm font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-amber-300">
                    <Award className="w-4 h-4 text-slate-950" />
                    <span>ผู้นำอันดับ 1</span>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-black text-amber-300 bg-amber-400/10 border border-amber-400/30">
                    หมายเลข {leaderCandidate.number}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5">
                  {/* Candidate Photo (Large, elegant portrait proportion aspect-[3/4]) */}
                  <div className="shrink-0 relative">
                    <div
                      className="w-32 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border-2 sm:border-3 shadow-xl object-cover bg-slate-800 ring-4 ring-amber-400/20 transition-transform duration-300 hover:scale-[1.02]"
                      style={{ borderColor: leaderCandidate.partyColor }}
                    >
                      <img
                        src={leaderCandidate.photoUrl}
                        alt={leaderCandidate.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>

                  {/* Candidate Details */}
                  <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs text-slate-200">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: leaderCandidate.partyColor }}
                      />
                      <span className="font-bold truncate">{leaderCandidate.partyName}</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight truncate drop-shadow-sm">
                      {leaderCandidate.name}
                    </h2>

                    {/* Vote Count & Lead Difference */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                      <div className="bg-slate-800/90 px-4 py-2.5 rounded-xl border border-slate-700/80 shadow-inner">
                        <div className="text-2xl sm:text-3xl font-black text-amber-400 leading-none">
                          {(leaderCandidate.voteCount ?? 0).toLocaleString()}{' '}
                          <span className="text-xs font-normal text-slate-300">คะแนน</span>
                        </div>
                        <div className="text-xs font-bold text-slate-300 mt-1">
                          {leaderCandidate.percentage.toFixed(1)}% ของคะแนนรวม
                        </div>
                      </div>

                      {runnerUpCandidate && (
                        <div className="bg-slate-800/90 px-4 py-2.5 rounded-xl border border-emerald-500/40 space-y-0.5 text-left shadow-inner">
                          <div className="text-xs sm:text-sm font-bold text-amber-200">
                            นำอันดับ 2 อยู่
                          </div>
                          <div className="text-xl sm:text-2xl font-black text-emerald-400">
                            +{(leadMargin ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-200">คะแนน</span>
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-200 truncate max-w-[220px]">
                            ({runnerUpCandidate.name})
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TOP RIGHT: LEADERBOARD STANDINGS (MOVED TO TOP) */}
        <div className="xl:col-span-6 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>สรุปอันดับคะแนนผู้สมัคร (Leaderboard)</span>
            </h3>

            {/* Search Input */}
            <div className="relative w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหาผู้สมัคร/พรรค..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full sm:w-48"
              />
            </div>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[280px] sm:max-h-[320px] pr-1">
            {sortedCandidates.map((cand, index) => {
              const isWinner = index === 0;
              return (
                <div
                  key={cand.id || `cand-${index}`}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isWinner
                      ? 'bg-amber-50/70 border-amber-200 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    {/* Rank indicator */}
                    <div className="font-black text-slate-400 text-sm sm:text-base w-6 text-center shrink-0">
                      #{index + 1}
                    </div>

                    {/* Candidate Photo */}
                    <div className="relative shrink-0">
                      <img
                        src={cand.photoUrl}
                        alt={cand.name}
                        className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl object-cover object-top border border-slate-200 shadow-xs"
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-md text-[9px] font-bold text-white flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: cand.partyColor }}
                      >
                        {cand.number}
                      </div>
                    </div>

                    {/* Candidate Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">{cand.name}</span>
                      </div>

                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: cand.partyColor }}
                        />
                        <span className="font-medium text-slate-700 truncate">{cand.partyName}</span>
                      </div>

                      {/* Progress vote bar */}
                      <div className="w-full bg-slate-200/80 rounded-full h-2 mt-1.5 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${cand.percentage}%`,
                            backgroundColor: cand.partyColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vote Count & Percent */}
                  <div className="text-right shrink-0">
                    <div className="font-black text-sm sm:text-base text-slate-900">
                      {(cand.voteCount ?? 0).toLocaleString()}{' '}
                      <span className="text-[10px] font-normal text-slate-500">คะแนน</span>
                    </div>
                    <div className="text-xs font-bold text-emerald-700">
                      {cand.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM ROW: OVERALL METRICS + BALLOT CLASSIFICATION */}
        <div className="xl:col-span-6 space-y-4">
          {/* OVERALL METRICS CARDS (3 METRICS: TOTAL VOTES + COMPLETED STATIONS + TURNOUT) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Metric 1: Total Votes Counted */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-12 h-12 bg-orange-50 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between text-slate-600 mb-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-700">คะแนนรวมนับแล้ว</span>
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight my-1">
                {(grandTotalVotes ?? 0).toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-500">
                จากผู้มีสิทธิ {(totalEligibleVoters ?? 0).toLocaleString()} คน
              </div>
            </div>

            {/* Metric 2: Completed Stations Count (จำนวนหน่วยที่นับเสร็จ) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-50 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between text-slate-600 mb-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-700">จำนวนหน่วยที่นับเสร็จ</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-950 tracking-tight flex items-baseline gap-1 my-1">
                <span>{completedStationsCount.toLocaleString()}</span>
                <span className="text-sm font-bold text-slate-500">/ {filteredStations.length.toLocaleString()} หน่วย</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mt-1">
                <span className="font-bold text-emerald-700">{stationCountProgress.toFixed(1)}% นับเสร็จ</span>
                <span>เหลือ {filteredStations.length - completedStationsCount} หน่วย</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stationCountProgress, 100)}%` }}
                />
              </div>
            </div>

            {/* Metric 3: Turnout % */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-600 mb-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-700">% มาใช้สิทธิ</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-indigo-950 tracking-tight my-1">
                {turnoutPercentage.toFixed(1)}%
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(turnoutPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM RIGHT: 3-CATEGORY BALLOT CLASSIFICATION SUMMARY */}
        <div className="xl:col-span-6 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>ประเภทบัตรเลือกตั้ง</span>
            </h3>
            <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              รวม {(grandTotalVotes ?? 0).toLocaleString()} เสียง
            </div>
          </div>

          {/* 3 Category Cards with Large Text & Clear Percentages */}
          <div className="grid grid-cols-3 gap-3">
            {/* Category 1: บัตรดี */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                <span className="text-xs sm:text-sm font-extrabold text-emerald-950">1. บัตรดี</span>
                <span className="text-sm sm:text-base font-black text-emerald-700">
                  {grandTotalVotes > 0 ? ((totalValidVotes / grandTotalVotes) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-950">
                {(totalValidVotes ?? 0).toLocaleString()}
              </div>
            </div>

            {/* Category 2: บัตรเสีย */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-rose-50/90 border border-rose-200 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                <span className="text-xs sm:text-sm font-extrabold text-rose-950">2. บัตรเสีย</span>
                <span className="text-sm sm:text-base font-black text-rose-700">
                  {grandTotalVotes > 0 ? ((totalInvalidVotes / grandTotalVotes) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-950">
                {(totalInvalidVotes ?? 0).toLocaleString()}
              </div>
            </div>

            {/* Category 3: บัตรไม่เลือกผู้ใด */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900">3. บัตรไม่เลือกผู้ใด</span>
                <span className="text-sm sm:text-base font-black text-slate-700">
                  {grandTotalVotes > 0 ? ((totalNoVotes / grandTotalVotes) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-950">
                {(totalNoVotes ?? 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Stacked Proportional Bar */}
          <div className="space-y-1 pt-1">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60 p-0.5">
              {grandTotalVotes > 0 ? (
                <>
                  <div
                    className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                    style={{ width: `${(totalValidVotes / grandTotalVotes) * 100}%` }}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{ width: `${(totalInvalidVotes / grandTotalVotes) * 100}%` }}
                  />
                  <div
                    className="bg-slate-400 h-full rounded-r-full transition-all duration-500"
                    style={{ width: `${(totalNoVotes / grandTotalVotes) * 100}%` }}
                  />
                </>
              ) : (
                <div className="bg-slate-200 w-full h-full rounded-full" />
              )}
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
          {availableZones.map((zone, zIdx) => {
            const zDistrict = districts.find((d) => d.id === zone.districtId);
            const zoneStations = pollingStations.filter((s) => s.zoneId === zone.id);
            const completedCount = zoneStations.filter((s) => s.status === 'completed').length;
            const isAllCompleted = zoneStations.length > 0 && completedCount === zoneStations.length;
            const pct = zoneStations.length > 0 ? Math.round((completedCount / zoneStations.length) * 100) : 0;

            return (
              <div
                key={zone.id || `zone-${zIdx}`}
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
                <th className="py-3 px-3">อำเภอ / ตำบล / เขต</th>
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
              {filteredStations.map((station, stIdx) => {
                const stationVoteEntry = votes.find((v) => v.stationId === station.id);
                const stationValidVotes = stationVoteEntry && stationVoteEntry.candidateVotes
                  ? (Object.values(stationVoteEntry.candidateVotes) as number[]).reduce((a: number, b: number) => a + b, 0)
                  : 0;
                const stationInvalidVotes = stationVoteEntry?.invalidVotes || 0;
                const stationNoVotes = stationVoteEntry?.noVotes || 0;
                const stationTotalVotes = stationValidVotes + stationInvalidVotes + stationNoVotes;

                const stationDistrict = districts.find((d) => d.id === station.districtId);
                const stationSubDistrict = subDistricts.find((sd) => sd.id === station.subDistrictId);
                const stationZone = zones.find((z) => z.id === station.zoneId);
                const isCompleted = station.status === 'completed';

                return (
                  <tr
                    key={station.id || `st-row-${stIdx}`}
                    className={`transition-colors ${
                      isCompleted ? 'bg-emerald-50/40 hover:bg-emerald-50/80' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <span>{station.name}</span>
                      {stationSubDistrict && (
                        <span className="ml-2 inline-block text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded-md">
                          ต.{stationSubDistrict.name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {stationDistrict?.name || ''} {stationSubDistrict ? `• ${stationSubDistrict.name}` : ''} • {stationZone?.name || ''}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600">
                      {(station.totalEligibleVoters ?? 0).toLocaleString()} คน
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-700">
                      {(stationValidVotes ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-700">
                      {(stationInvalidVotes ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-600">
                      {(stationNoVotes ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900">
                      {(stationTotalVotes ?? 0).toLocaleString()}
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
