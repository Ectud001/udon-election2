import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { LocationExcelRow } from '../utils/excelUtils';
import {
  Candidate,
  District,
  Zone,
  PollingStation,
  Party,
  PollingStationVote,
  LiveNotification,
  ViewMode,
  SubDistrict,
} from '../types';
import {
  INITIAL_CANDIDATES,
  INITIAL_DISTRICTS,
  INITIAL_ZONES,
  INITIAL_POLLING_STATIONS,
  INITIAL_PARTIES,
  INITIAL_VOTES,
  INITIAL_SUB_DISTRICTS,
} from '../mockData';

const LOCAL_STORAGE_KEY = 'thai_election_realtime_v2';

interface ElectionContextType {
  electionTitle: string;
  setElectionTitle: (title: string) => void;
  candidates: Candidate[];
  districts: District[];
  subDistricts: SubDistrict[];
  zones: Zone[];
  pollingStations: PollingStation[];
  parties: Party[];
  votes: PollingStationVote[];
  liveNotifications: LiveNotification[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedDistrictId: string;
  setSelectedDistrictId: (id: string) => void;
  selectedSubDistrictId: string;
  setSelectedSubDistrictId: (id: string) => void;
  selectedZoneId: string;
  setSelectedZoneId: (id: string) => void;
  selectedStationId: string;
  setSelectedStationId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isAutoSimulationActive: boolean;
  setIsAutoSimulationActive: (active: boolean | ((prev: boolean) => boolean)) => void;

  // State mutations
  updateElectionTitle: (title: string) => void;
  updateStationVotes: (
    stationId: string,
    candidateVotes: Record<string, number>,
    invalidVotes: number,
    noVotes: number,
    updatedBy?: string
  ) => void;

  addCandidate: (candidate: Omit<Candidate, 'id'>) => void;
  updateCandidate: (id: string, updated: Partial<Candidate>) => void;
  deleteCandidate: (id: string) => void;

  addParty: (party: Omit<Party, 'id'>) => void;
  updateParty: (id: string, updated: Partial<Party>) => void;
  deleteParty: (id: string) => void;

  addPollingStation: (station: Omit<PollingStation, 'id'>) => void;
  updatePollingStation: (id: string, updated: Partial<PollingStation>) => void;
  deletePollingStation: (id: string) => void;

  addDistrict: (district: Omit<District, 'id'>) => void;
  deleteDistrict: (id: string) => void;
  addSubDistrict: (sub: Omit<SubDistrict, 'id'>) => void;
  updateSubDistrict: (id: string, updated: Partial<SubDistrict>) => void;
  deleteSubDistrict: (id: string) => void;
  addZone: (zone: Omit<Zone, 'id'>) => void;
  deleteZone: (id: string) => void;
  toggleStationCompletion: (stationId: string, isCompleted: boolean) => void;
  toggleZoneCompletion: (zoneId: string, isCompleted: boolean) => void;
  toggleDistrictCompletion: (districtId: string, isCompleted: boolean) => void;
  resetToDefaultData: () => void;
  clearAllVotes: () => void;
  clearAllData: () => void;
  clearNotification: (id: string) => void;
  triggerWinnerConfetti: () => void;
  deduplicatePollingStationsBySubDistrict: () => { removedCount: number };
  importExcelLocationData: (rows: LocationExcelRow[]) => {
    createdDistricts: number;
    createdSubDistricts: number;
    createdZones: number;
    createdStations: number;
    updatedStations: number;
  };
}

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

export const ElectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Check URL query param for default view
  const getInitialViewMode = (): ViewMode => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'vote') return 'vote';
    if (viewParam === 'admin') return 'admin';
    return 'public';
  };

  const [electionTitle, setElectionTitle] = useState<string>('การเลือกตั้งสมาชิกสภาผู้แทนราษฎร 2568');
  const [viewMode, setViewModeState] = useState<ViewMode>(getInitialViewMode);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [districts, setDistricts] = useState<District[]>(INITIAL_DISTRICTS);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>(INITIAL_SUB_DISTRICTS);
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [pollingStations, setPollingStations] = useState<PollingStation[]>(INITIAL_POLLING_STATIONS);
  const [parties, setParties] = useState<Party[]>(INITIAL_PARTIES);
  const [votes, setVotes] = useState<PollingStationVote[]>(INITIAL_VOTES);
  const [liveNotifications, setLiveNotifications] = useState<LiveNotification[]>([]);

  // Filter states
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('all');
  const [selectedSubDistrictId, setSelectedSubDistrictId] = useState<string>('all');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [selectedStationId, setSelectedStationId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAutoSimulationActive, setIsAutoSimulationActive] = useState<boolean>(false);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.electionTitle) setElectionTitle(parsed.electionTitle);
        if (Array.isArray(parsed.candidates)) setCandidates(parsed.candidates);
        if (Array.isArray(parsed.districts)) setDistricts(parsed.districts);
        if (Array.isArray(parsed.subDistricts)) setSubDistricts(parsed.subDistricts);
        if (Array.isArray(parsed.zones)) setZones(parsed.zones);
        if (Array.isArray(parsed.pollingStations)) {
          const cleanedStations = parsed.pollingStations.map((st: PollingStation) => {
            let cleanName = st?.name || '';
            if (typeof cleanName === 'string' && /^หน่วยที่\s*\d+/.test(cleanName)) {
              cleanName = cleanName.replace(/^(หน่วยที่\s*\d+).*/, '$1');
            }
            return { ...st, name: cleanName };
          });
          setPollingStations(cleanedStations);
        }
        if (Array.isArray(parsed.parties)) setParties(parsed.parties);
        if (Array.isArray(parsed.votes)) setVotes(parsed.votes);
      }
    } catch (e) {
      console.error('Failed to load election data from localStorage', e);
    }
  }, []);

  // Save to local storage
  const saveToLocalStorage = useCallback(
    (data: {
      candidates?: Candidate[];
      districts?: District[];
      subDistricts?: SubDistrict[];
      zones?: Zone[];
      pollingStations?: PollingStation[];
      votes?: PollingStationVote[];
      parties?: Party[];
      electionTitle?: string;
    } = {}) => {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            electionTitle: data.electionTitle !== undefined ? data.electionTitle : electionTitle,
            candidates: data.candidates !== undefined ? data.candidates : candidates,
            districts: data.districts !== undefined ? data.districts : districts,
            subDistricts: data.subDistricts !== undefined ? data.subDistricts : subDistricts,
            zones: data.zones !== undefined ? data.zones : zones,
            pollingStations: data.pollingStations !== undefined ? data.pollingStations : pollingStations,
            votes: data.votes !== undefined ? data.votes : votes,
            parties: data.parties !== undefined ? data.parties : parties,
          })
        );
      } catch (e) {
        console.error('Failed to save election data to localStorage', e);
      }
    },
    [candidates, districts, subDistricts, zones, pollingStations, votes, parties, electionTitle]
  );

  const updateElectionTitle = (title: string) => {
    setElectionTitle(title);
    saveToLocalStorage({ electionTitle: title });
  };

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    const url = new URL(window.location.href);
    url.searchParams.set('view', mode);
    window.history.replaceState({}, '', url.toString());
  };

  const clearNotification = (id: string) => {
    setLiveNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const triggerWinnerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const updateStationVotes = useCallback(
    (
      stationId: string,
      candidateVotes: Record<string, number>,
      invalidVotes: number,
      noVotes: number,
      updatedBy: string = 'เจ้าหน้าที่'
    ) => {
      const station = pollingStations.find((s) => s.id === stationId);
      const district = districts.find((d) => d?.id === station?.districtId);
      const zone = zones.find((z) => z?.id === station?.zoneId);

      const oldVoteEntry = votes.find((v) => v.stationId === stationId);
      const nowStr = new Date().toISOString();

      let topAddedCandidate: { id: string; added: number } | null = null;
      let maxDiff = 0;

      // Calculate candidate vote differences for live notifications
      if (oldVoteEntry && oldVoteEntry.candidateVotes) {
        Object.entries(candidateVotes || {}).forEach(([cId, count]) => {
          const oldCount = oldVoteEntry.candidateVotes[cId] || 0;
          const diff = count - oldCount;
          if (diff > maxDiff) {
            maxDiff = diff;
            topAddedCandidate = { id: cId, added: diff };
          }
        });
      } else {
        Object.entries(candidateVotes || {}).forEach(([cId, count]) => {
          if (count > maxDiff) {
            maxDiff = count;
            topAddedCandidate = { id: cId, added: count };
          }
        });
      }

      setVotes((prevVotes) => {
        const existingIdx = prevVotes.findIndex((v) => v.stationId === stationId);
        let updatedVotes: PollingStationVote[];

        const newEntry: PollingStationVote = {
          stationId,
          candidateVotes,
          invalidVotes,
          noVotes,
          updatedAt: nowStr,
          updatedBy,
        };

        if (existingIdx >= 0) {
          updatedVotes = [...prevVotes];
          updatedVotes[existingIdx] = newEntry;
        } else {
          updatedVotes = [...prevVotes, newEntry];
        }

        saveToLocalStorage({ votes: updatedVotes });
        return updatedVotes;
      });

      // Update station status to completed or in_progress
      setPollingStations((prev) => {
        const updated = prev.map((s) => {
          if (s.id === stationId) {
            return { ...s, status: 'completed' as const };
          }
          return s;
        });
        saveToLocalStorage({ pollingStations: updated });
        return updated;
      });

      // Broadcast notification if there are newly added votes
      if (topAddedCandidate && maxDiff > 0 && station) {
        const cand = candidates.find((c) => c.id === topAddedCandidate!.id);
        if (cand) {
          // Calculate new total candidate votes
          const totalCandVotes = votes.reduce((acc, v) => {
            const vCount = v.stationId === stationId ? candidateVotes[cand.id] || 0 : v.candidateVotes[cand.id] || 0;
            return acc + vCount;
          }, 0);

          const newNotif: LiveNotification = {
            id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            stationName: station.name,
            districtName: district?.name || '',
            zoneName: zone?.name || '',
            candidateName: cand.name,
            candidateNumber: cand.number,
            partyName: cand.partyName,
            partyColor: cand.partyColor,
            votesAdded: maxDiff,
            totalVotesNow: totalCandVotes + (oldVoteEntry ? 0 : candidateVotes[cand.id] || 0),
          };

          setLiveNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
        }
      }
    },
    [pollingStations, districts, zones, votes, candidates, saveToLocalStorage]
  );

  // Auto simulation effect for live demonstration
  useEffect(() => {
    if (!isAutoSimulationActive) return;

    const interval = setInterval(() => {
      // Pick a random station
      const randomStation = pollingStations[Math.floor(Math.random() * pollingStations.length)];
      if (!randomStation) return;

      const currentVote = votes.find((v) => v.stationId === randomStation.id);
      const newCandVotes: Record<string, number> = currentVote ? { ...currentVote.candidateVotes } : {};

      // Add 5..30 votes to a random candidate
      const randomCand = candidates[Math.floor(Math.random() * candidates.length)];
      if (randomCand) {
        const currentCount = newCandVotes[randomCand.id] || 0;
        const addAmount = Math.floor(Math.random() * 25) + 5;
        newCandVotes[randomCand.id] = currentCount + addAmount;

        const invalid = (currentVote?.invalidVotes || 0) + (Math.random() > 0.8 ? 1 : 0);
        const noVotes = (currentVote?.noVotes || 0) + (Math.random() > 0.8 ? 1 : 0);

        updateStationVotes(randomStation.id, newCandVotes, invalid, noVotes, 'ระบบจำลองเรียลไทม์ (Auto-Sim)');
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isAutoSimulationActive, pollingStations, candidates, votes, updateStationVotes]);

  // Admin Candidate CRUD
  const addCandidate = (cand: Omit<Candidate, 'id'>) => {
    const newCand: Candidate = {
      ...cand,
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    };
    const nextList = [...candidates, newCand];
    setCandidates(nextList);
    saveToLocalStorage({ candidates: nextList });
  };

  const updateCandidate = (id: string, updated: Partial<Candidate>) => {
    const nextList = candidates.map((c) => (c.id === id ? { ...c, ...updated } : c));
    setCandidates(nextList);
    saveToLocalStorage({ candidates: nextList });
  };

  const deleteCandidate = (id: string) => {
    const nextList = candidates.filter((c) => c.id !== id);
    setCandidates(nextList);
    saveToLocalStorage({ candidates: nextList });
  };

  // Admin Station CRUD
  const addPollingStation = (st: Omit<PollingStation, 'id'>) => {
    const newStation: PollingStation = {
      ...st,
      id: 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    };
    const nextList = [...pollingStations, newStation];
    setPollingStations(nextList);
    saveToLocalStorage({ pollingStations: nextList });
  };

  const updatePollingStation = (id: string, updated: Partial<PollingStation>) => {
    const nextList = pollingStations.map((s) => (s.id === id ? { ...s, ...updated } : s));
    setPollingStations(nextList);
    saveToLocalStorage({ pollingStations: nextList });
  };

  const deletePollingStation = (id: string) => {
    const nextList = pollingStations.filter((s) => s.id !== id);
    const nextVotes = votes.filter((v) => v.stationId !== id);
    setPollingStations(nextList);
    setVotes(nextVotes);
    saveToLocalStorage({ pollingStations: nextList, votes: nextVotes });
  };

  // Admin District / SubDistrict / Zone
  const addDistrict = (d: Omit<District, 'id'>) => {
    const newD: District = { ...d, id: 'd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) };
    const nextList = [...districts, newD];
    setDistricts(nextList);
    saveToLocalStorage({ districts: nextList });
  };

  const deleteDistrict = (id: string) => {
    const nextDistricts = districts.filter((d) => d.id !== id);
    const nextZones = zones.filter((z) => z.districtId !== id);
    const nextSubDistricts = subDistricts.filter((sd) => sd.districtId !== id);
    const nextStations = pollingStations.filter((s) => s.districtId !== id);
    const deletedStationIds = new Set(pollingStations.filter((s) => s.districtId === id).map((s) => s.id));
    const nextVotes = votes.filter((v) => !deletedStationIds.has(v.stationId));

    setDistricts(nextDistricts);
    setZones(nextZones);
    setSubDistricts(nextSubDistricts);
    setPollingStations(nextStations);
    setVotes(nextVotes);
    saveToLocalStorage({
      districts: nextDistricts,
      zones: nextZones,
      subDistricts: nextSubDistricts,
      pollingStations: nextStations,
      votes: nextVotes,
    });
  };

  const addSubDistrict = (sub: Omit<SubDistrict, 'id'>) => {
    const newSub: SubDistrict = { ...sub, id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) };
    const nextList = [...subDistricts, newSub];
    setSubDistricts(nextList);
    saveToLocalStorage({ subDistricts: nextList });
  };

  const updateSubDistrict = (id: string, updated: Partial<SubDistrict>) => {
    const nextList = subDistricts.map((s) => (s.id === id ? { ...s, ...updated } : s));
    setSubDistricts(nextList);
    saveToLocalStorage({ subDistricts: nextList });
  };

  const deleteSubDistrict = (id: string) => {
    const nextSubDistricts = subDistricts.filter((s) => s.id !== id);
    const nextStations = pollingStations.map((s) => (s.subDistrictId === id ? { ...s, subDistrictId: undefined } : s));
    setSubDistricts(nextSubDistricts);
    setPollingStations(nextStations);
    saveToLocalStorage({ subDistricts: nextSubDistricts, pollingStations: nextStations });
  };

  const addZone = (z: Omit<Zone, 'id'>) => {
    const newZ: Zone = { ...z, id: 'z_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) };
    const nextList = [...zones, newZ];
    setZones(nextList);
    saveToLocalStorage({ zones: nextList });
  };

  const deleteZone = (id: string) => {
    const nextZones = zones.filter((z) => z.id !== id);
    const nextStations = pollingStations.filter((s) => s.zoneId !== id);
    const deletedStationIds = new Set(pollingStations.filter((s) => s.zoneId === id).map((s) => s.id));
    const nextVotes = votes.filter((v) => !deletedStationIds.has(v.stationId));

    setZones(nextZones);
    setPollingStations(nextStations);
    setVotes(nextVotes);
    saveToLocalStorage({
      zones: nextZones,
      pollingStations: nextStations,
      votes: nextVotes,
    });
  };

  const toggleStationCompletion = (stationId: string, isCompleted: boolean) => {
    const nextStations = pollingStations.map((s) => {
      if (s.id === stationId) {
        return {
          ...s,
          status: (isCompleted ? 'completed' : 'in_progress') as 'completed' | 'in_progress',
        };
      }
      return s;
    });
    setPollingStations(nextStations);
    saveToLocalStorage({ pollingStations: nextStations });
  };

  const toggleZoneCompletion = (zoneId: string, isCompleted: boolean) => {
    const nextStations = pollingStations.map((s) => {
      if (s.zoneId === zoneId) {
        return {
          ...s,
          status: (isCompleted ? 'completed' : 'in_progress') as 'completed' | 'in_progress',
        };
      }
      return s;
    });
    setPollingStations(nextStations);

    const nextZones = zones.map((z) => {
      if (z.id === zoneId) {
        return {
          ...z,
          status: (isCompleted ? 'completed' : 'in_progress') as 'completed' | 'in_progress',
          isCompleted,
        };
      }
      return z;
    });
    setZones(nextZones);

    saveToLocalStorage({ zones: nextZones, pollingStations: nextStations });
  };

  const toggleDistrictCompletion = (districtId: string, isCompleted: boolean) => {
    const nextStations = pollingStations.map((s) => {
      if (s.districtId === districtId) {
        return {
          ...s,
          status: (isCompleted ? 'completed' : 'in_progress') as 'completed' | 'in_progress',
        };
      }
      return s;
    });
    setPollingStations(nextStations);

    const nextZones = zones.map((z) => {
      if (z.districtId === districtId) {
        return {
          ...z,
          status: (isCompleted ? 'completed' : 'in_progress') as 'completed' | 'in_progress',
          isCompleted,
        };
      }
      return z;
    });
    setZones(nextZones);

    const nextDistricts = districts.map((d) => {
      if (d.id === districtId) {
        return {
          ...d,
          status: (isCompleted ? 'completed' : 'in_progress') as 'completed' | 'in_progress',
          isCompleted,
        };
      }
      return d;
    });
    setDistricts(nextDistricts);

    saveToLocalStorage({ districts: nextDistricts, zones: nextZones, pollingStations: nextStations });
  };

  // Party CRUD
  const addParty = (party: Omit<Party, 'id'>) => {
    const newParty: Party = {
      ...party,
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    };
    const nextParties = [...parties, newParty];
    setParties(nextParties);
    saveToLocalStorage({ parties: nextParties });
  };

  const updateParty = (id: string, updated: Partial<Party>) => {
    const nextParties = parties.map((p) => (p.id === id ? { ...p, ...updated } : p));
    setParties(nextParties);

    // Also update partyName and partyColor on candidates belonging to this party
    let nextCandidates = candidates;
    if (updated.name || updated.color) {
      nextCandidates = candidates.map((c) => {
        if (c.partyId === id) {
          return {
            ...c,
            partyName: updated.name || c.partyName,
            partyColor: updated.color || c.partyColor,
          };
        }
        return c;
      });
      setCandidates(nextCandidates);
    }

    saveToLocalStorage({ parties: nextParties, candidates: nextCandidates });
  };

  const deleteParty = (id: string) => {
    const nextParties = parties.filter((p) => p.id !== id);
    setParties(nextParties);
    saveToLocalStorage({ parties: nextParties });
  };

  const resetToDefaultData = () => {
    setElectionTitle('การเลือกตั้งสมาชิกสภาผู้แทนราษฎร 2568');
    setCandidates(INITIAL_CANDIDATES);
    setDistricts(INITIAL_DISTRICTS);
    setSubDistricts(INITIAL_SUB_DISTRICTS);
    setZones(INITIAL_ZONES);
    setPollingStations(INITIAL_POLLING_STATIONS);
    setParties(INITIAL_PARTIES);
    setVotes(INITIAL_VOTES);
    setLiveNotifications([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const clearAllVotes = () => {
    const emptyVotes: PollingStationVote[] = pollingStations.map((st) => ({
      stationId: st.id,
      candidateVotes: {},
      invalidVotes: 0,
      noVotes: 0,
      timestamp: new Date().toISOString(),
      updatedBy: 'ระบบ',
    }));
    const resetStations = pollingStations.map((st) => ({
      ...st,
      status: 'pending' as const,
      progress: 0,
      totalVotes: 0,
    }));
    setVotes(emptyVotes);
    setPollingStations(resetStations);
    setLiveNotifications([]);
    saveToLocalStorage({ votes: emptyVotes, pollingStations: resetStations });
  };

  const clearAllData = () => {
    setVotes([]);
    setPollingStations([]);
    setZones([]);
    setSubDistricts([]);
    setDistricts([]);
    setCandidates([]);
    setParties([]);
    setLiveNotifications([]);
    saveToLocalStorage({
      candidates: [],
      districts: [],
      subDistricts: [],
      zones: [],
      pollingStations: [],
      votes: [],
      parties: [],
    });
  };

  const deduplicatePollingStationsBySubDistrict = () => {
    const seenMap = new Map<string, PollingStation>();
    const idRemap = new Map<string, string>();
    const uniqueStations: PollingStation[] = [];

    pollingStations.forEach((st) => {
      // Primary deduplication key: Sub-district ID (or District ID if subdistrict absent) + station name
      const subKey = st.subDistrictId ? `sub_${st.subDistrictId}` : `dist_${st.districtId || 'none'}`;
      const key = `${subKey}_${st.name.trim()}`;

      if (!seenMap.has(key)) {
        seenMap.set(key, st);
        uniqueStations.push(st);
      } else {
        const kept = seenMap.get(key)!;
        idRemap.set(st.id, kept.id);
      }
    });

    if (idRemap.size === 0) {
      return { removedCount: 0 };
    }

    // Remap votes from deleted duplicate stations to kept station
    const voteByStationMap = new Map<string, PollingStationVote>();
    const remappedVotes: PollingStationVote[] = [];

    votes.forEach((v) => {
      const targetStationId = idRemap.get(v.stationId) || v.stationId;
      if (!voteByStationMap.has(targetStationId)) {
        const newV = { ...v, stationId: targetStationId };
        voteByStationMap.set(targetStationId, newV);
        remappedVotes.push(newV);
      } else {
        const existingVote = voteByStationMap.get(targetStationId)!;
        const mergedCandVotes = { ...existingVote.candidateVotes };
        Object.entries(v.candidateVotes || {}).forEach(([cId, count]) => {
          mergedCandVotes[cId] = (mergedCandVotes[cId] || 0) + (Number(count) || 0);
        });
        existingVote.candidateVotes = mergedCandVotes;
        existingVote.invalidVotes = (existingVote.invalidVotes || 0) + (v.invalidVotes || 0);
        existingVote.noVotes = (existingVote.noVotes || 0) + (v.noVotes || 0);
      }
    });

    setPollingStations(uniqueStations);
    setVotes(remappedVotes);
    saveToLocalStorage({
      pollingStations: uniqueStations,
      votes: remappedVotes,
    });

    return { removedCount: idRemap.size };
  };

  const importExcelLocationData = (rows: LocationExcelRow[]) => {
    let currentDistricts = [...districts];
    let currentSubDistricts = [...subDistricts];
    let currentZones = [...zones];
    let currentStations = [...pollingStations];

    let createdDistricts = 0;
    let createdSubDistricts = 0;
    let createdZones = 0;
    let createdStations = 0;
    let updatedStations = 0;

    rows.forEach((row, rowIdx) => {
      const distName = (row.districtName || '').trim();
      const subName = (row.subDistrictName || '').trim();
      const zoneName = (row.zoneName || '').trim() || 'เขตเลือกตั้งที่ 1';
      const stationName = (row.stationName || '').trim();
      const totalVoters = row.totalEligibleVoters || 1000;

      if (!distName && !stationName && !subName) return;

      // 1. Find or create District
      let dist = currentDistricts.find((d) => d.name === distName);
      if (!dist && distName) {
        dist = {
          id: 'd_' + Date.now() + '_' + rowIdx + '_' + Math.random().toString(36).substring(2, 7),
          name: distName,
          code: 'D_' + Date.now() + '_' + rowIdx,
        };
        currentDistricts.push(dist);
        createdDistricts++;
      }

      const distId = dist ? dist.id : currentDistricts[0]?.id || '';

      // 2. Find or create SubDistrict
      let sub: SubDistrict | undefined = undefined;
      if (subName) {
        sub = currentSubDistricts.find((s) => s.name === subName && (!s.districtId || s.districtId === distId));
        if (!sub) {
          sub = {
            id: 'sub_' + Date.now() + '_' + rowIdx + '_' + Math.random().toString(36).substring(2, 7),
            name: subName,
            districtId: distId,
          };
          currentSubDistricts.push(sub);
          createdSubDistricts++;
        } else if (!sub.districtId && distId) {
          sub.districtId = distId;
        }
      }

      // 3. Find or create Zone
      let z = currentZones.find((zone) => zone.name === zoneName);
      if (!z && zoneName) {
        z = {
          id: 'z_' + Date.now() + '_' + rowIdx + '_' + Math.random().toString(36).substring(2, 7),
          name: zoneName,
          zoneNumber: currentZones.length + 1,
          districtId: distId,
        };
        currentZones.push(z);
        createdZones++;
      }

      const zoneId = z ? z.id : currentZones[0]?.id || '';

      // 4. Find or create Polling Station (Strictly based on SubDistrict ตำบล)
      if (stationName) {
        let existingSt: PollingStation | undefined = undefined;

        if (sub) {
          // STRICT MATCH: Polling station identity is tied to sub-district (ตำบล)
          existingSt = currentStations.find(
            (s) => s.subDistrictId === sub!.id && s.name.trim() === stationName
          );
        } else if (distId) {
          // Fallback if subdistrict is empty
          existingSt = currentStations.find(
            (s) => !s.subDistrictId && s.districtId === distId && s.name.trim() === stationName
          );
        }

        if (existingSt) {
          existingSt.totalEligibleVoters = totalVoters;
          if (distId) existingSt.districtId = distId;
          if (sub) existingSt.subDistrictId = sub.id;
          if (zoneId) existingSt.zoneId = zoneId;
          updatedStations++;
        } else {
          const stNumMatch = stationName.match(/\d+/);
          const stationNumber = stNumMatch ? parseInt(stNumMatch[0], 10) : currentStations.length + 1;

          const newSt: PollingStation = {
            id: 's_' + Date.now() + '_' + rowIdx + '_' + Math.random().toString(36).substring(2, 7),
            name: stationName,
            stationNumber,
            districtId: distId,
            subDistrictId: sub?.id,
            zoneId,
            totalEligibleVoters: totalVoters,
            status: 'pending',
          };
          currentStations.push(newSt);
          createdStations++;
        }
      }
    });

    setDistricts(currentDistricts);
    setSubDistricts(currentSubDistricts);
    setZones(currentZones);
    setPollingStations(currentStations);

    saveToLocalStorage({
      districts: currentDistricts,
      subDistricts: currentSubDistricts,
      zones: currentZones,
      pollingStations: currentStations,
    });

    return {
      createdDistricts,
      createdSubDistricts,
      createdZones,
      createdStations,
      updatedStations,
    };
  };

  return (
    <ElectionContext.Provider
      value={{
        electionTitle,
        setElectionTitle: updateElectionTitle,
        candidates,
        districts,
        subDistricts,
        zones,
        pollingStations,
        parties,
        votes,
        liveNotifications,
        viewMode,
        setViewMode,
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
        isAutoSimulationActive,
        setIsAutoSimulationActive,
        updateElectionTitle,
        updateStationVotes,
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
        clearNotification,
        triggerWinnerConfetti,
        deduplicatePollingStationsBySubDistrict,
        importExcelLocationData,
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
};

export const useElection = () => {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElection must be used within an ElectionProvider');
  }
  return context;
};
