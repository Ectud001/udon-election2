import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useElection } from '../context/ElectionContext';
import {
  Edit3,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  Building2,
  MapPin,
  Save,
  RotateCcw,
  Zap,
  Users,
  Clock,
  ShieldCheck,
  Check,
  FileSpreadsheet,
  Download,
  UploadCloud,
  FileCheck,
  AlertCircle,
  X,
  FileText,
  CheckCircle2,
} from 'lucide-react';

interface ParsedImportRow {
  stationId: string;
  stationName: string;
  candidateVotes: Record<string, number>;
  invalidVotes: number;
  noVotes: number;
  officerName: string;
  isValidStation: boolean;
}

export const VoteEntryPage: React.FC = () => {
  const {
    candidates,
    districts,
    subDistricts,
    zones,
    pollingStations,
    votes,
    updateStationVotes,
    toggleStationCompletion,
    toggleZoneCompletion,
    isAutoSimulationActive,
    setIsAutoSimulationActive,
  } = useElection();

  // Selection state
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(districts[0]?.id || '');
  const [selectedSubDistrictId, setSelectedSubDistrictId] = useState<string>('all');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id || '');
  const [selectedStationId, setSelectedStationId] = useState<string>(pollingStations[0]?.id || '');

  // Officer inputs state
  const [candidateVoteCounts, setCandidateVoteCounts] = useState<Record<string, number>>({});
  const [invalidVotes, setInvalidVotes] = useState<number>(0);
  const [noVotes, setNoVotes] = useState<number>(0);
  const [officerName, setOfficerName] = useState<string>('เจ้าหน้าที่ประจำหน่วย');

  // UI state
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Excel / CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedImportData, setParsedImportData] = useState<ParsedImportRow[]>([]);
  const [showImportPreviewModal, setShowImportPreviewModal] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Available districts for selected zone
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

  // Available subdistricts for selected district & zone
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

  // Available zones for selected district
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

  // Available polling stations for selected filters (hierarchical filtering by zone, district, subdistrict)
  const availableStations = useMemo(() => {
    return pollingStations.filter((s) => {
      if (selectedZoneId && selectedZoneId !== 'all') {
        const matchesZoneDirect = s.zoneId === selectedZoneId;
        const matchesZoneDistrict = s.districtId && zones.some((z) => z.id === selectedZoneId && z.districtId === s.districtId);
        const matchesZoneSubDistrict = s.subDistrictId && subDistricts.some((sd) => sd.id === s.subDistrictId && sd.districtId && zones.some((z) => z.id === selectedZoneId && z.districtId === sd.districtId));
        if (!matchesZoneDirect && !matchesZoneDistrict && !matchesZoneSubDistrict) {
          return false;
        }
      }

      if (selectedDistrictId && selectedDistrictId !== 'all') {
        const directMatch = s.districtId === selectedDistrictId;
        const subMatch = s.subDistrictId ? subDistricts.some((sd) => sd.id === s.subDistrictId && (sd.districtId === selectedDistrictId || !sd.districtId)) : false;
        if (!directMatch && !subMatch) return false;
      }

      if (selectedSubDistrictId && selectedSubDistrictId !== 'all') {
        if (s.subDistrictId !== selectedSubDistrictId) return false;
      }

      return true;
    });
  }, [pollingStations, subDistricts, zones, selectedDistrictId, selectedSubDistrictId, selectedZoneId]);

  // Auto-sync selectedDistrictId if current selection is invalid
  useEffect(() => {
    if (selectedDistrictId !== 'all' && availableDistricts.length > 0) {
      if (!availableDistricts.some((d) => d.id === selectedDistrictId)) {
        setSelectedDistrictId('all');
      }
    }
  }, [availableDistricts, selectedDistrictId]);

  // Auto-sync selectedSubDistrictId if current selection is invalid
  useEffect(() => {
    if (selectedSubDistrictId !== 'all' && availableSubDistricts.length > 0) {
      if (!availableSubDistricts.some((sd) => sd.id === selectedSubDistrictId)) {
        setSelectedSubDistrictId('all');
      }
    }
  }, [availableSubDistricts, selectedSubDistrictId]);

  // Auto-sync selectedZoneId when availableZones changes or current selectedZoneId is not valid
  useEffect(() => {
    if (selectedZoneId !== 'all' && availableZones.length > 0) {
      if (!availableZones.some((z) => z.id === selectedZoneId)) {
        setSelectedZoneId('all');
      }
    }
  }, [availableZones, selectedZoneId]);

  // Auto-sync selectedStationId when availableStations changes or current selectedStationId is not valid
  useEffect(() => {
    if (availableStations.length > 0) {
      if (!selectedStationId || !availableStations.some((s) => s.id === selectedStationId)) {
        setSelectedStationId(availableStations[0].id);
      }
    } else {
      setSelectedStationId('');
    }
  }, [availableStations, selectedStationId]);

  const activeStation = useMemo(() => {
    return pollingStations.find((s) => s.id === selectedStationId);
  }, [pollingStations, selectedStationId]);

  // Sync initial inputs when station changes or votes update
  useEffect(() => {
    if (selectedStationId) {
      const existingVote = votes.find((v) => v.stationId === selectedStationId);
      if (existingVote) {
        setCandidateVoteCounts(existingVote.candidateVotes || {});
        setInvalidVotes(existingVote.invalidVotes || 0);
        setNoVotes(existingVote.noVotes || 0);
        if (existingVote.updatedBy) setOfficerName(existingVote.updatedBy);
      } else {
        const resetCounts: Record<string, number> = {};
        candidates.forEach((c) => (resetCounts[c.id] = 0));
        setCandidateVoteCounts(resetCounts);
        setInvalidVotes(0);
        setNoVotes(0);
      }
    }
  }, [selectedStationId, votes, candidates]);

  // Quick adjust helper
  const adjustCandidateVotes = (candidateId: string, amount: number) => {
    setCandidateVoteCounts((prev) => {
      const current = prev[candidateId] || 0;
      const next = Math.max(0, current + amount);
      return { ...prev, [candidateId]: next };
    });
  };

  const setExactCandidateVotes = (candidateId: string, val: number) => {
    setCandidateVoteCounts((prev) => ({
      ...prev,
      [candidateId]: Math.max(0, val),
    }));
  };

  // Calculated totals
  const totalValidVotes = (Object.values(candidateVoteCounts || {}) as number[]).reduce((a: number, b: number) => a + b, 0);
  const totalVotesThisStation = totalValidVotes + invalidVotes + noVotes;
  const eligibleVoters = activeStation?.totalEligibleVoters || 0;
  const isOverEligibleLimit = eligibleVoters > 0 && totalVotesThisStation > eligibleVoters;

  // 1. Download Matrix Template (กกต. Official Grid Format as in attached user screenshot)
  const handleDownloadMatrixTemplate = () => {
    const sortedCandidates = [...candidates].sort((a, b) => a.number - b.number);
    const stationCols = pollingStations.map((s) => {
      const sdName = subDistricts.find((sd) => sd.id === s.subDistrictId)?.name;
      const label = sdName ? `${s.name} (ต.${sdName})` : s.name;
      return `"${(label || '').replace(/"/g, '""')}"`;
    });

    const titleRow = `"ตารางสรุปผลการลงคะแนนเลือกตั้ง กกต. (จำแนกรายหน่วยและรายตำบล)"`;

    const headerRow = [
      '"ข้อมูลการใช้สิทธิ / รายการ"',
      `"ผลรวมคะแนน (${pollingStations.length} หน่วย)"`,
      ...stationCols,
    ].join(',');

    const row1_1 = [
      '"1.1 จำนวนผู้มีสิทธิเลือกตั้ง"',
      '"-"',
      ...pollingStations.map((s) => s.totalEligibleVoters || 0),
    ].join(',');
    const row1_2 = ['"1.2 ผู้มีสิทธิที่มาแสดงตน"', '"-"', ...pollingStations.map(() => 0)].join(',');
    const row2_1 = ['"2.1 บัตรที่ได้รับจัดสรร"', '"-"', ...pollingStations.map(() => 0)].join(',');
    const row2_2 = [
      '"2.2 บัตรที่ใช้ (บัตรดี+บัตรเสีย+ไม่เลือก)"',
      '"-"',
      ...pollingStations.map(() => 0),
    ].join(',');

    const row2_2_1 = [
      '"2.2.1 บัตรดี"',
      '"-"',
      ...pollingStations.map((s) => {
        const v = votes.find((item) => item.stationId === s.id);
        if (!v) return 0;
        return (Object.values(v.candidateVotes || {}) as number[]).reduce((a, b) => a + b, 0);
      }),
    ].join(',');

    const row2_2_2 = [
      '"2.2.2 บัตรเสีย"',
      '"-"',
      ...pollingStations.map((s) => votes.find((item) => item.stationId === s.id)?.invalidVotes || 0),
    ].join(',');

    const row2_2_3 = [
      '"2.2.3 บัตรไม่เลือกผู้ใด"',
      '"-"',
      ...pollingStations.map((s) => votes.find((item) => item.stationId === s.id)?.noVotes || 0),
    ].join(',');

    const row2_3 = ['"2.3 บัตรที่เหลือ"', '"-"', ...pollingStations.map(() => 0)].join(',');

    const candSectionHeader = [
      '"ข้อมูลผลคะแนนผู้สมัคร"',
      `"ผลรวมคะแนนผู้สมัคร (${pollingStations.length} หน่วย)"`,
      ...stationCols,
    ].join(',');

    const candidateRows = sortedCandidates.map((c) => {
      const candTitle = `"${c.number} ${(c?.name || '').replace(/"/g, '""')}"`;
      const stationVotes = pollingStations.map((s) => {
        const v = votes.find((item) => item.stationId === s.id);
        return v?.candidateVotes?.[c.id] ?? 0;
      });
      return [candTitle, '"-"', ...stationVotes].join(',');
    });

    const csvLines = [
      titleRow,
      headerRow,
      row1_1,
      row1_2,
      row2_1,
      row2_2,
      row2_2_1,
      row2_2_2,
      row2_2_3,
      row2_3,
      candSectionHeader,
      ...candidateRows,
    ];

    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `แบบฟอร์มตารางสรุปคะแนน_กกต_Matrix.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Download Standard List Template
  const handleDownloadStandardTemplate = () => {
    const sortedCandidates = [...candidates].sort((a, b) => a.number - b.number);
    const candidateHeaders = sortedCandidates.map(
      (c) => `"คะแนน_เบอร์_${c.number}_(${(c?.name || '').replace(/"/g, '""')})"`
    );

    const headers = [
      '"รหัสหน่วยเลือกตั้ง"',
      '"ชื่อหน่วยเลือกตั้ง"',
      '"ตำบล"',
      '"อำเภอ"',
      '"เขตเลือกตั้ง"',
      ...candidateHeaders,
      '"จำนวนบัตรเสีย"',
      '"จำนวนไม่ประสงค์ลงคะแนน"',
      '"ชื่อเจ้าหน้าที่ผู้บันทึกคะแนน"',
    ];

    const rows = pollingStations.map((station) => {
      const subDistrict = subDistricts.find((sd) => sd.id === station.subDistrictId)?.name || '';
      const district = districts.find((d) => d.id === station.districtId)?.name || '';
      const zone = zones.find((z) => z.id === station.zoneId)?.name || '';
      const existingVote = votes.find((v) => v.stationId === station.id);

      const candVotes = sortedCandidates.map((c) => {
        const v = existingVote?.candidateVotes?.[c.id];
        return v !== undefined ? v : 0;
      });

      const invalid = existingVote?.invalidVotes !== undefined ? existingVote.invalidVotes : 0;
      const noVote = existingVote?.noVotes !== undefined ? existingVote.noVotes : 0;
      const officer = existingVote?.updatedBy || 'เจ้าหน้าที่ประจำหน่วย';

      return [
        `"${station.id}"`,
        `"${(station?.name || '').replace(/"/g, '""')}"`,
        `"${(subDistrict || '').replace(/"/g, '""')}"`,
        `"${(district || '').replace(/"/g, '""')}"`,
        `"${(zone || '').replace(/"/g, '""')}"`,
        ...candVotes,
        invalid,
        noVote,
        `"${(officer || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `แบบฟอร์มบันทึกคะแนน_รายหน่วย.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel / CSV File Upload Parser (Smart Dual-Mode: Matrix & List)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('ไม่พบข้อมูลในไฟล์ที่เลือก');

        let cleanText = (text || '').replace(/^\uFEFF/, '');
        const rawLines = cleanText
          .split(/\r?\n/)
          .map((l) => (l || '').trim())
          .filter((l) => l.length > 0);
        if (rawLines.length < 2) {
          throw new Error('ไฟล์ Excel/CSV ต้องมีอย่างน้อย 2 แถว');
        }

        const parseRow = (rowStr: string) => {
          return (rowStr || '')
            .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
            .map((cell) => (cell || '').replace(/^"|"$/g, '').trim());
        };

        const parsedRows: ParsedImportRow[] = [];

        // Auto-detect matrix table vs standard list format
        const isMatrixFormat = rawLines.some(
          (line) =>
            line.includes('ข้อมูลการใช้สิทธิ') ||
            line.includes('2.2.1') ||
            line.includes('2.2.2') ||
            line.includes('2.2.3') ||
            line.includes('ข้อมูลผลคะแนนผู้สมัคร')
        );

        if (isMatrixFormat) {
          // --- MATRIX FORMAT PARSING ---
          let stationHeaderRowIdx = -1;
          for (let i = 0; i < rawLines.length; i++) {
            const cells = parseRow(rawLines[i]);
            if (
              cells.some(
                (c) => c.includes('หน่วยที่') || c.includes('หน่วยเลือกตั้ง') || c.includes('หน่วย')
              )
            ) {
              stationHeaderRowIdx = i;
              break;
            }
          }

          if (stationHeaderRowIdx === -1) {
            stationHeaderRowIdx = 1;
          }

          const headerCells = parseRow(rawLines[stationHeaderRowIdx]);
          const stationCols: {
            colIdx: number;
            station: (typeof pollingStations)[0] | undefined;
            rawName: string;
          }[] = [];

          for (let c = 2; c < headerCells.length; c++) {
            const colText = headerCells[c];
            if (!colText) continue;

            let matched = pollingStations.find(
              (s) => s.name === colText || s.id === colText || colText.includes(s.name)
            );

            if (!matched) {
              const numMatch = colText.match(/\d+/);
              if (numMatch) {
                const stNum = parseInt(numMatch[0]);
                matched = pollingStations.find((s) => s.stationNumber === stNum);
              }
            }

            stationCols.push({ colIdx: c, station: matched, rawName: colText });
          }

          if (stationCols.length === 0) {
            throw new Error('ไม่สามารถระบุคอลัมน์หน่วยเลือกตั้งในตารางสรุป กกต. ได้');
          }

          const stationDataMap = new Map<
            number,
            {
              station: (typeof pollingStations)[0] | undefined;
              rawName: string;
              candidateVotes: Record<string, number>;
              invalidVotes: number;
              noVotes: number;
            }
          >();

          stationCols.forEach(({ colIdx, station, rawName }) => {
            const initCandVotes: Record<string, number> = {};
            candidates.forEach((cand) => (initCandVotes[cand.id] = 0));
            stationDataMap.set(colIdx, {
              station,
              rawName,
              candidateVotes: initCandVotes,
              invalidVotes: 0,
              noVotes: 0,
            });
          });

          for (let i = 0; i < rawLines.length; i++) {
            const rowCells = parseRow(rawLines[i]);
            if (rowCells.length < 3) continue;

            const rowLabel = rowCells[0];

            if (rowLabel.includes('2.2.2') || rowLabel.includes('บัตรเสีย')) {
              stationCols.forEach(({ colIdx }) => {
                const val = parseInt(rowCells[colIdx] || '0');
                const data = stationDataMap.get(colIdx);
                if (data) data.invalidVotes = isNaN(val) ? 0 : Math.max(0, val);
              });
            } else if (
              rowLabel.includes('2.2.3') ||
              rowLabel.includes('ไม่เลือกผู้ใด') ||
              rowLabel.includes('ไม่ประสงค์')
            ) {
              stationCols.forEach(({ colIdx }) => {
                const val = parseInt(rowCells[colIdx] || '0');
                const data = stationDataMap.get(colIdx);
                if (data) data.noVotes = isNaN(val) ? 0 : Math.max(0, val);
              });
            } else {
              const matchedCandidate = candidates.find((cand) => {
                const numStr = `${cand.number}`;
                return (
                  rowLabel.startsWith(`${numStr} `) ||
                  rowLabel.startsWith(`เบอร์ ${numStr}`) ||
                  rowLabel.startsWith(`หมายเลข ${numStr}`) ||
                  rowLabel.includes(cand.name)
                );
              });

              if (matchedCandidate) {
                stationCols.forEach(({ colIdx }) => {
                  const val = parseInt(rowCells[colIdx] || '0');
                  const data = stationDataMap.get(colIdx);
                  if (data)
                    data.candidateVotes[matchedCandidate.id] = isNaN(val) ? 0 : Math.max(0, val);
                });
              }
            }
          }

          stationDataMap.forEach(
            ({ station, rawName, candidateVotes, invalidVotes, noVotes }) => {
              parsedRows.push({
                stationId: station ? station.id : `station_${rawName}`,
                stationName: station ? station.name : rawName || 'หน่วยเลือกตั้ง',
                candidateVotes,
                invalidVotes,
                noVotes,
                officerName: 'นำเข้าผ่านไฟล์ตาราง กกต.',
                isValidStation: !!station,
              });
            }
          );
        } else {
          // --- STANDARD LIST FORMAT PARSING ---
          const headers = parseRow(rawLines[0]);

          const stationIdIdx = headers.findIndex(
            (h) => h.includes('รหัสหน่วย') || h.toLowerCase().includes('stationid') || h.includes('id')
          );
          const stationNameIdx = headers.findIndex(
            (h) => h.includes('ชื่อหน่วย') || h.includes('หน่วยเลือกตั้ง')
          );
          const invalidIdx = headers.findIndex((h) => h.includes('บัตรเสีย'));
          const noVoteIdx = headers.findIndex((h) => h.includes('ไม่ประสงค์'));
          const officerIdx = headers.findIndex(
            (h) => h.includes('เจ้าหน้าที่') || h.includes('ผู้บันทึก')
          );

          const candidateColMap: { candidateId: string; colIdx: number }[] = [];
          candidates.forEach((cand) => {
            const colIdx = headers.findIndex(
              (h) =>
                h.includes(`เบอร์_${cand.number}_`) ||
                h.includes(`เบอร์ ${cand.number}`) ||
                h.includes(`หมายเลข ${cand.number}`) ||
                h.includes(`เบอร์_${cand.number}`) ||
                h.includes(`candidate_${cand.number}`)
            );
            if (colIdx !== -1) {
              candidateColMap.push({ candidateId: cand.id, colIdx });
            }
          });

          for (let i = 1; i < rawLines.length; i++) {
            const cells = parseRow(rawLines[i]);
            if (cells.length === 0 || !cells.some((c) => c !== '')) continue;

            const rawStationId = stationIdIdx !== -1 ? cells[stationIdIdx] : '';
            const rawStationName = stationNameIdx !== -1 ? cells[stationNameIdx] : '';

            let matchedStation = pollingStations.find(
              (s) => s.id === rawStationId || s.name === rawStationName || s.name.includes(rawStationName)
            );

            if (!matchedStation && rawStationName) {
              const numMatch = rawStationName.match(/\d+/);
              if (numMatch) {
                const stNum = parseInt(numMatch[0]);
                matchedStation = pollingStations.find((s) => s.stationNumber === stNum);
              }
            }

            const candidateVotes: Record<string, number> = {};
            candidateColMap.forEach(({ candidateId, colIdx }) => {
              const val = parseInt(cells[colIdx] || '0');
              candidateVotes[candidateId] = isNaN(val) ? 0 : Math.max(0, val);
            });

            candidates.forEach((c) => {
              if (candidateVotes[c.id] === undefined) {
                candidateVotes[c.id] = 0;
              }
            });

            const invalidVotes = invalidIdx !== -1 ? Math.max(0, parseInt(cells[invalidIdx]) || 0) : 0;
            const noVotes = noVoteIdx !== -1 ? Math.max(0, parseInt(cells[noVoteIdx]) || 0) : 0;
            const officerName =
              officerIdx !== -1 && cells[officerIdx] ? cells[officerIdx] : 'นำเข้าผ่าน Excel';

            parsedRows.push({
              stationId: matchedStation ? matchedStation.id : rawStationId || `station_${i}`,
              stationName: matchedStation ? matchedStation.name : rawStationName || `หน่วยเลือกตั้งที่ ${i}`,
              candidateVotes,
              invalidVotes,
              noVotes,
              officerName,
              isValidStation: !!matchedStation,
            });
          }
        }

        if (parsedRows.length === 0) {
          throw new Error('ไม่สามารถอ่านแถวข้อมูลคะแนนในไฟล์ CSV/Excel ได้');
        }

        setParsedImportData(parsedRows);
        setShowImportPreviewModal(true);
      } catch (err: any) {
        setImportError(err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์');
      }
    };

    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleConfirmBatchImport = () => {
    let importedCount = 0;
    parsedImportData.forEach((row) => {
      if (row.isValidStation) {
        updateStationVotes(
          row.stationId,
          row.candidateVotes,
          row.invalidVotes,
          row.noVotes,
          row.officerName || 'นำเข้าผ่านไฟล์ Excel'
        );
        importedCount++;
      }
    });

    setShowImportPreviewModal(false);
    setImportSuccessMsg(`นำเข้าข้อมูลคะแนนสำเร็จเรียบร้อยแล้ว จำนวน ${importedCount} หน่วยเลือกตั้ง!`);
    setTimeout(() => setImportSuccessMsg(null), 5000);
  };

  // Handle Save
  const handleSaveVotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationId) return;

    updateStationVotes(
      selectedStationId,
      candidateVoteCounts,
      invalidVotes,
      noVotes,
      officerName
    );

    setSaveSuccessMsg(`บันทึกคะแนนหน่วย "${activeStation?.name}" เรียบร้อยแล้ว!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-[#2d8a68] via-[#247558] to-[#1b5b44] text-white rounded-3xl p-5 sm:p-6 shadow-lg border border-[#1d634a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-inner">
            <Edit3 className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold tracking-tight">
                หน้ากรอกและอัปเดตคะแนนเลือกตั้ง
              </h2>
              <span className="bg-amber-400/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full border border-amber-400/40 font-bold">
                สำหรับเจ้าหน้าที่
              </span>
            </div>
            <p className="text-xs text-emerald-200 mt-1">
              บันทึกคะแนนจากหน่วยเลือกตั้ง ผลจะส่งตรงเข้า Dashboard เรียลไทม์ทันที
            </p>
          </div>
        </div>

        {/* Auto sim toggle */}
        <button
          onClick={() => setIsAutoSimulationActive((prev) => !prev)}
          className={`flex items-center space-x-1.5 text-xs px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 border relative z-10 cursor-pointer ${
            isAutoSimulationActive
              ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-md animate-pulse'
              : 'bg-emerald-900/90 text-emerald-200 border-emerald-700 hover:bg-emerald-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{isAutoSimulationActive ? 'กำลังรันคะแนนสดอัตโนมัติ' : 'ทดสอบจำลองคะแนนเข้า'}</span>
        </button>
      </div>

      {/* EXCEL IMPORT & TEMPLATE DOWNLOAD CARD */}
      <div className="bg-gradient-to-br from-emerald-900 via-[#1e5d46] to-teal-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-emerald-700/60 space-y-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-emerald-700/50 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-800/90 border border-emerald-600/80 text-emerald-300 flex items-center justify-center shrink-0 shadow-md">
              <FileSpreadsheet className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                <span>นำเข้าและอัปเดตคะแนนผ่านไฟล์ Excel / CSV</span>
                <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Batch Import
                </span>
              </h3>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                ดาวน์โหลดแบบฟอร์มไฟล์ Excel กรอกคะแนนหลายหน่วย แล้วอัปเดตเข้าระบบพร้อมกันทันที
              </p>
            </div>
          </div>

          {/* Download Template Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={handleDownloadMatrixTemplate}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-400/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
              title="ดาวน์โหลดตาราง กกต. แบบ Matrix ตามแบบฉบับมาตรฐาน"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>แบบฟอร์มตารางสรุป กกต. (Matrix)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadStandardTemplate}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold text-xs rounded-2xl border border-emerald-600 flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
              title="ดาวน์โหลดตารางแบบรายแถวต่อหน่วยเลือกตั้ง"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>แบบฟอร์มรายหน่วย (List)</span>
            </button>
          </div>
        </div>

        {/* Upload File Zone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <label
              htmlFor="excel-file-input"
              className="group border-2 border-dashed border-emerald-500/60 hover:border-amber-400 bg-emerald-950/60 hover:bg-emerald-950/90 rounded-2xl p-4 flex items-center space-x-3 cursor-pointer transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-800/80 group-hover:bg-amber-400 group-hover:text-slate-950 text-emerald-300 flex items-center justify-center shrink-0 transition-colors">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-emerald-100 group-hover:text-white truncate">
                  คลิกที่นี่ หรือ ลากไฟล์ Excel / CSV มาวางเพื่ออัปโหลด
                </div>
                <div className="text-[11px] text-emerald-300/80 truncate mt-0.5">
                  รองรับไฟล์ .csv, .xlsx, .xls ที่กรอกตามแบบฟอร์มมาตรฐาน
                </div>
              </div>
              <input
                ref={fileInputRef}
                id="excel-file-input"
                type="file"
                accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="bg-emerald-950/70 border border-emerald-800/80 rounded-2xl p-3.5 text-xs space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5" />
              <span>คำแนะนำการใช้งาน:</span>
            </div>
            <ul className="text-[11px] text-emerald-200/90 space-y-0.5 list-disc list-inside">
              <li>ใช้ไฟล์ที่ดาวน์โหลดจากปุ่ม Template ด้านบน</li>
              <li>กรอกคะแนนบัตรดี, บัตรเสีย, ไม่ประสงค์ลงคะแนน</li>
              <li><b>นำเข้าหลายรอบ:</b> ให้กรอกเป็น <b>"คะแนนรวมทั้งหมดล่าสุด"</b> ของหน่วยนั้นๆ (ระบบจะอัปเดตเป็นคะแนนล่าสุดในไฟล์)</li>
              <li>ระบบจะทำการตรวจสอบและพรีวิวข้อมูลก่อนยืนยัน</li>
            </ul>
          </div>
        </div>

        {/* Global Import Error Banner */}
        {importError && (
          <div className="bg-rose-950/90 border border-rose-500/80 text-rose-200 p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{importError}</span>
            </div>
            <button
              onClick={() => setImportError(null)}
              className="text-rose-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Import Success Banner */}
        {importSuccessMsg && (
          <div className="bg-emerald-500/30 border border-emerald-400 text-emerald-100 p-3.5 rounded-2xl text-xs font-extrabold flex items-center space-x-2 animate-pulse">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* LOCATION SELECTION BAR */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-indigo-600" />
          <span>ขั้นตอนที่ 1: เลือกสถานที่หน่วยเลือกตั้งที่จะกรอกคะแนน</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Zone Select (เขตเลือกตั้ง) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">1. เขตเลือกตั้ง:</label>
            <select
              value={selectedZoneId}
              onChange={(e) => {
                setSelectedZoneId(e.target.value);
                setSelectedSubDistrictId('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทุกเขตเลือกตั้ง ({availableZones.length} เขต)</option>
              {availableZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. District Select (อำเภอ) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">2. อำเภอ:</label>
            <select
              value={selectedDistrictId}
              onChange={(e) => {
                const dId = e.target.value;
                setSelectedDistrictId(dId);
                setSelectedSubDistrictId('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทุกอำเภอ ({availableDistricts.length} อำเภอ)</option>
              {availableDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. SubDistrict Select (ตำบล) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">3. ตำบล:</label>
            <select
              value={selectedSubDistrictId}
              onChange={(e) => {
                setSelectedSubDistrictId(e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option key="all" value="all">
                ทุกตำบล ({availableSubDistricts.length} ตำบล)
              </option>
              {availableSubDistricts.map((sd) => (
                <option key={sd.id} value={sd.id}>
                  {sd.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Station Select (หน่วยเลือกตั้ง) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">4. หน่วยเลือกตั้ง:</label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-900 border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {availableStations.length === 0 ? (
                <option value="">-- ไม่พบหน่วยเลือกตั้งในตำบลนี้ --</option>
              ) : (
                availableStations.map((s) => {
                  const subName = subDistricts.find((sd) => sd.id === s.subDistrictId)?.name;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name}{selectedSubDistrictId === 'all' && subName ? ` (${subName})` : ''} ({s.status === 'completed' ? '✓ นับเสร็จแล้ว' : 'กำลังนับ'})
                    </option>
                  );
                })
              )}
            </select>
          </div>
        </div>

        {/* Selected Station Summary & Completion Checkboxes Box */}
        {activeStation && (() => {
          const zoneStations = pollingStations.filter(
            (s) => s.districtId === selectedDistrictId && s.zoneId === selectedZoneId
          );
          const zoneCompletedCount = zoneStations.filter((s) => s.status === 'completed').length;
          const isZoneAllCompleted = zoneStations.length > 0 && zoneCompletedCount === zoneStations.length;
          const activeZoneObj = zones.find((z) => z.id === selectedZoneId);

          return (
            <div className="space-y-3">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    #{activeStation.stationNumber}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{activeStation.name}</div>
                    <div className="text-slate-600 mt-0.5">
                      จำนวนผู้มีสิทธิเลือกตั้งในหน่วยนี้:{' '}
                      <span className="font-bold text-indigo-900">
                        {(activeStation?.totalEligibleVoters ?? 0).toLocaleString()} คน
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-slate-500">สถานะหน่วย: </span>
                  {activeStation.status === 'completed' ? (
                    <span className="font-bold text-emerald-600 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>นับคะแนนเสร็จแล้ว</span>
                    </span>
                  ) : (
                    <span className="font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>กำลังนับคะแนน</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Ticking Checkboxes for Zone and Station */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Checkbox: Zone Level */}
                <label className="flex items-start space-x-3 p-3.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/90 rounded-2xl cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={isZoneAllCompleted}
                    onChange={(e) => toggleZoneCompletion(selectedZoneId, e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer accent-emerald-600"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>นับคะแนนเสร็จแล้วทั้งเขต ({activeZoneObj?.name || 'เขตเลือกตั้ง'})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      ติ๊กเพื่อตั้งสถานะนับเสร็จสมบูรณ์ทั้งเขต ({zoneCompletedCount}/{zoneStations.length} หน่วย)
                    </div>
                  </div>
                </label>

                {/* Checkbox: Station Level */}
                <label className="flex items-start space-x-3 p-3.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/90 rounded-2xl cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={activeStation.status === 'completed'}
                    onChange={(e) => toggleStationCompletion(activeStation.id, e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer accent-emerald-600"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>นับคะแนนเสร็จแล้วเฉพาะหน่วยนี้ ({activeStation.name})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {activeStation.status === 'completed'
                        ? '✓ ช่องถูกติ๊กแล้ว: แสดงผล Dashboard ว่า "นับเสร็จแล้ว"'
                        : '☐ ยังไม่ติ๊ก: แสดงผล Dashboard ว่า "กำลังนับ"'}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          );
        })()}
      </div>

      {/* VOTE INPUT CARDS FORM */}
      <form onSubmit={handleSaveVotes} className="space-y-6">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>ขั้นตอนที่ 2: ระบุคะแนนแยกตาม 3 ประเภทบัตรเลือกตั้ง</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                กรอกคะแนน 1. บัตรดี (แยกรายหมายเลข) 2. บัตรเสีย และ 3. ไม่ประสงค์ลงคะแนน
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const zeroed: Record<string, number> = {};
                candidates.forEach((c) => (zeroed[c.id] = 0));
                setCandidateVoteCounts(zeroed);
                setInvalidVotes(0);
                setNoVotes(0);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 self-end sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตช่องกรอก</span>
            </button>
          </div>

          {/* Section 1: บัตรดี (Valid Votes) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200/80">
              <span className="font-extrabold text-xs text-emerald-900 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>1. บัตรดี (ระบุคะแนนแยกรายหมายเลขผู้สมัคร)</span>
              </span>
              <span className="text-xs font-black text-emerald-800">
                รวมบัตรดี: {(totalValidVotes ?? 0).toLocaleString()} คะแนน
              </span>
            </div>

            {candidates.map((candidate) => {
              const currentVotes = candidateVoteCounts[candidate.id] || 0;

              return (
                <div
                  key={candidate.id}
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  {/* Left: Photo & Candidate Detail */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={candidate.photoUrl}
                        alt={candidate.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                      />
                      <div
                        className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg text-xs font-bold text-white flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: candidate.partyColor }}
                      >
                        #{candidate.number}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm sm:text-base">
                        หมายเลข {candidate.number} - {candidate.name}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: candidate.partyColor }}
                        />
                        <span className="font-medium">{candidate.partyName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Touch Controls (+1, +5, +10) and Direct Input */}
                  <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => adjustCandidateVotes(candidate.id, -1)}
                      className="w-9 h-9 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center transition-colors text-sm"
                      title="ลด 1 คะแนน"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={currentVotes}
                      onChange={(e) =>
                        setExactCandidateVotes(candidate.id, parseInt(e.target.value) || 0)
                      }
                      className="w-20 sm:w-24 h-10 text-center font-extrabold text-base bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <button
                      type="button"
                      onClick={() => adjustCandidateVotes(candidate.id, 1)}
                      className="w-9 h-9 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold flex items-center justify-center transition-colors text-sm"
                      title="เพิ่ม 1 คะแนน"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => adjustCandidateVotes(candidate.id, 5)}
                      className="px-2.5 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center transition-colors shadow-xs"
                    >
                      +5
                    </button>

                    <button
                      type="button"
                      onClick={() => adjustCandidateVotes(candidate.id, 10)}
                      className="px-2.5 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center transition-colors shadow-xs"
                    >
                      +10
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section 2 & 3: บัตรเสีย และ ไม่ประสงค์ลงคะแนน */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            {/* 2. บัตรเสีย */}
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-center justify-between">
              <div>
                <div className="font-extrabold text-xs text-rose-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>2. บัตรเสีย:</span>
                </div>
                <div className="text-[11px] text-rose-700 mt-0.5">บัตรที่ไม่สามารถคำนวณเป็นคะแนนได้</div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setInvalidVotes((prev) => Math.max(0, prev - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-rose-300 text-rose-900 font-bold hover:bg-rose-100"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={invalidVotes}
                  onChange={(e) => setInvalidVotes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 h-9 text-center font-black bg-white border border-rose-300 rounded-lg text-rose-950 text-base"
                />
                <button
                  type="button"
                  onClick={() => setInvalidVotes((prev) => prev + 1)}
                  className="w-8 h-8 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* 3. ไม่ประสงค์ลงคะแนน */}
            <div className="p-4 bg-slate-100 border border-slate-200/90 rounded-2xl flex items-center justify-between">
              <div>
                <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span>3. บัตรไม่เลือกผู้ใด:</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">บัตรทำเครื่องหมายกากบาทไม่เลือกผู้ใด</div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setNoVotes((prev) => Math.max(0, prev - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold hover:bg-slate-200"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={noVotes}
                  onChange={(e) => setNoVotes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 h-9 text-center font-black bg-white border border-slate-300 rounded-lg text-slate-900 text-base"
                />
                <button
                  type="button"
                  onClick={() => setNoVotes((prev) => prev + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-800"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY & SUBMIT BAR */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs text-slate-400 font-medium">สรุปยอดคะแนนของหน่วยนี้</div>
              <div className="text-2xl font-black text-white mt-0.5">
                รวมบัตรทุกประเภท: {(totalVotesThisStation ?? 0).toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">ใบ/เสียง</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs mt-2">
                <span className="bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-800/80 font-bold">
                  1. บัตรดี: {(totalValidVotes ?? 0).toLocaleString()}
                </span>
                <span className="bg-rose-950 text-rose-300 px-2.5 py-0.5 rounded-md border border-rose-800/80 font-bold">
                  2. บัตรเสีย: {(invalidVotes ?? 0).toLocaleString()}
                </span>
                <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-700 font-bold">
                  3. ไม่ลงคะแนน: {(noVotes ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="text-slate-300">
                ผู้มีสิทธิ: <span className="font-bold text-white">{(eligibleVoters ?? 0).toLocaleString()} คน</span>
              </div>
              {isOverEligibleLimit && (
                <div className="text-red-400 font-bold flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>คะแนนเกินจำนวนผู้มีสิทธิในหน่วย!</span>
                </div>
              )}
            </div>
          </div>

          {/* Officer Name input */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto flex items-center space-x-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ผู้บันทึก:</span>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                placeholder="ชื่อเจ้าหน้าที่กรอกคะแนน"
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>

            <button
              type="submit"
              disabled={isOverEligibleLimit}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg transition-all ${
                isOverEligibleLimit
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>บันทึกและส่งคะแนนเรียลไทม์</span>
            </button>
          </div>

          {/* Success Toast */}
          {saveSuccessMsg && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs font-bold flex items-center space-x-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
        </div>
      </form>

      {/* IMPORT PREVIEW MODAL */}
      {showImportPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#2d8a68] to-[#1e5d46] text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">
                    ตรวจสอบและพรีวิวข้อมูลจากไฟล์ Excel / CSV
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    พบรายการทั้งหมด {parsedImportData.length} หน่วยเลือกตั้ง (พร้อมนำเข้า{' '}
                    {parsedImportData.filter((r) => r.isValidStation).length} หน่วย)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportPreviewModal(false)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Table of Parsed Stations */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              <div className="text-xs font-semibold text-slate-600">
                รายการคะแนนที่อ่านได้จากไฟล์ Excel:
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-3">หน่วยเลือกตั้ง</th>
                        <th className="p-3 text-center">บัตรดี</th>
                        <th className="p-3 text-center">บัตรเสีย</th>
                        <th className="p-3 text-center">ไม่ลงคะแนน</th>
                        <th className="p-3 text-center">รวมบัตร</th>
                        <th className="p-3 text-center">สถานะการแมป</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedImportData.map((row, idx) => {
                        const totalCand = (Object.values(row.candidateVotes || {}) as number[]).reduce(
                          (a, b) => a + b,
                          0
                        );
                        const totalRow = totalCand + row.invalidVotes + row.noVotes;

                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50 ${
                              !row.isValidStation ? 'bg-rose-50/50' : ''
                            }`}
                          >
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{row.stationName}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                ผู้บันทึก: {row.officerName}
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold text-emerald-700">
                              {(totalCand ?? 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-center font-bold text-rose-600">
                              {(row.invalidVotes ?? 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-center font-bold text-slate-600">
                              {(row.noVotes ?? 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-center font-black text-slate-900">
                              {(totalRow ?? 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              {row.isValidStation ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>พบบันทึกตรงกัน</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>ไม่พบชื่อหน่วย</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                หมายเหตุ: ข้อมูลที่จะถูกอัปเดตเฉพาะรายการที่มีสถานะ "พบบันทึกตรงกัน"
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowImportPreviewModal(false)}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchImport}
                  disabled={!parsedImportData.some((r) => r.isValidStation)}
                  className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ยืนยันนำเข้าคะแนนทั้งหมด</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
