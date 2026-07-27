import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  Candidate,
  District,
  Zone,
  PollingStation,
  Party,
  PollingStationVote,
  LiveNotification,
  ViewMode,
} from '../types';
import {
  INITIAL_CANDIDATES,
  INITIAL_DISTRICTS,
  INITIAL_ZONES,
  INITIAL_POLLING_STATIONS,
  INITIAL_PARTIES,
  INITIAL_VOTES,
} from '../mockData';

const LOCAL_STORAGE_KEY = 'thai_election_realtime_v2';

interface ElectionContextType {
  electionTitle: string;
  setElectionTitle: (title: string) => void;
  candidates: Candidate[];
  districts: District[];
  zones: Zone[];
  pollingStations: PollingStation[];
  parties: Party[];
  votes: PollingStationVote[];
  liveNotifications: LiveNotification[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedDistrictId: string;
  setSelectedDistrictId: (id: string) => void;
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
  addZone: (zone: Omit<Zone, 'id'>) => void;
  toggleStationCompletion: (stationId: string, isCompleted: boolean) => void;
  toggleZoneCompletion: (zoneId: string, isCompleted: boolean) => void;
  toggleDistrictCompletion: (districtId: string, isCompleted: boolean) => void;
  resetToDefaultData: () => void;
  clearNotification: (id: string) => void;
  triggerWinnerConfetti: () => void;
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
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [pollingStations, setPollingStations] = useState<PollingStation[]>(INITIAL_POLLING_STATIONS);
  const [parties, setParties] = useState<Party[]>(INITIAL_PARTIES);
  const [votes, setVotes] = useState<PollingStationVote[]>(INITIAL_VOTES);
  const [liveNotifications, setLiveNotifications] = useState<LiveNotification[]>([]);

  // Filter states
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('all');
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
        if (parsed.candidates) setCandidates(parsed.candidates);
        if (parsed.districts) setDistricts(parsed.districts);
        if (parsed.zones) setZones(parsed.zones);
        if (parsed.pollingStations) setPollingStations(parsed.pollingStations);
        if (parsed.parties) setParties(parsed.parties);
        if (parsed.votes) setVotes(parsed.votes);
      }
    } catch (e) {
      console.error('Failed to load election data from localStorage', e);
    }
  }, []);

  // Save to local storage
  const saveToLocalStorage = useCallback(
    (
      newCandidates = candidates,
      newDistricts = districts,
      newZones = zones,
      newStations = pollingStations,
      newVotes = votes,
      newParties = parties,
      newTitle = electionTitle
    ) => {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            electionTitle: newTitle,
            candidates: newCandidates,
            districts: newDistricts,
            zones: newZones,
            pollingStations: newStations,
            votes: newVotes,
            parties: newParties,
          })
        );
      } catch (e) {
        console.error('Failed to save election data to localStorage', e);
      }
    },
    [candidates, districts, zones, pollingStations, votes, parties, electionTitle]
  );

  const updateElectionTitle = (title: string) => {
    setElectionTitle(title);
    saveToLocalStorage(candidates, districts, zones, pollingStations, votes, parties, title);
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
      if (oldVoteEntry) {
        Object.entries(candidateVotes).forEach(([cId, count]) => {
          const oldCount = oldVoteEntry.candidateVotes[cId] || 0;
          const diff = count - oldCount;
          if (diff > maxDiff) {
            maxDiff = diff;
            topAddedCandidate = { id: cId, added: diff };
          }
        });
      } else {
        Object.entries(candidateVotes).forEach(([cId, count]) => {
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

        saveToLocalStorage(candidates, districts, zones, pollingStations, updatedVotes);
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
        saveToLocalStorage(candidates, districts, zones, updated, votes);
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
      id: 'c_' + Date.now(),
    };
    const nextList = [...candidates, newCand];
    setCandidates(nextList);
    saveToLocalStorage(nextList, districts, zones, pollingStations, votes);
  };

  const updateCandidate = (id: string, updated: Partial<Candidate>) => {
    const nextList = candidates.map((c) => (c.id === id ? { ...c, ...updated } : c));
    setCandidates(nextList);
    saveToLocalStorage(nextList, districts, zones, pollingStations, votes);
  };

  const deleteCandidate = (id: string) => {
    const nextList = candidates.filter((c) => c.id !== id);
    setCandidates(nextList);
    saveToLocalStorage(nextList, districts, zones, pollingStations, votes);
  };

  // Admin Station CRUD
  const addPollingStation = (st: Omit<PollingStation, 'id'>) => {
    const newStation: PollingStation = {
      ...st,
      id: 's_' + Date.now(),
    };
    const nextList = [...pollingStations, newStation];
    setPollingStations(nextList);
    saveToLocalStorage(candidates, districts, zones, nextList, votes);
  };

  const updatePollingStation = (id: string, updated: Partial<PollingStation>) => {
    const nextList = pollingStations.map((s) => (s.id === id ? { ...s, ...updated } : s));
    setPollingStations(nextList);
    saveToLocalStorage(candidates, districts, zones, nextList, votes);
  };

  const deletePollingStation = (id: string) => {
    const nextList = pollingStations.filter((s) => s.id !== id);
    setPollingStations(nextList);
    saveToLocalStorage(candidates, districts, zones, nextList, votes);
  };

  // Admin District / Zone
  const addDistrict = (d: Omit<District, 'id'>) => {
    const newD: District = { ...d, id: 'd_' + Date.now() };
    const nextList = [...districts, newD];
    setDistricts(nextList);
    saveToLocalStorage(candidates, nextList, zones, pollingStations, votes);
  };

  const addZone = (z: Omit<Zone, 'id'>) => {
    const newZ: Zone = { ...z, id: 'z_' + Date.now() };
    const nextList = [...zones, newZ];
    setZones(nextList);
    saveToLocalStorage(candidates, districts, nextList, pollingStations, votes);
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
    saveToLocalStorage(candidates, districts, zones, nextStations, votes, parties, electionTitle);
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

    saveToLocalStorage(candidates, districts, nextZones, nextStations, votes, parties, electionTitle);
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

    saveToLocalStorage(candidates, nextDistricts, nextZones, nextStations, votes, parties, electionTitle);
  };

  // Party CRUD
  const addParty = (party: Omit<Party, 'id'>) => {
    const newParty: Party = {
      ...party,
      id: 'p_' + Date.now(),
    };
    const nextParties = [...parties, newParty];
    setParties(nextParties);
    saveToLocalStorage(candidates, districts, zones, pollingStations, votes, nextParties, electionTitle);
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

    saveToLocalStorage(nextCandidates, districts, zones, pollingStations, votes, nextParties, electionTitle);
  };

  const deleteParty = (id: string) => {
    const nextParties = parties.filter((p) => p.id !== id);
    setParties(nextParties);
    saveToLocalStorage(candidates, districts, zones, pollingStations, votes, nextParties, electionTitle);
  };

  const resetToDefaultData = () => {
    setElectionTitle('การเลือกตั้งสมาชิกสภาผู้แทนราษฎร 2568');
    setCandidates(INITIAL_CANDIDATES);
    setDistricts(INITIAL_DISTRICTS);
    setZones(INITIAL_ZONES);
    setPollingStations(INITIAL_POLLING_STATIONS);
    setParties(INITIAL_PARTIES);
    setVotes(INITIAL_VOTES);
    setLiveNotifications([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <ElectionContext.Provider
      value={{
        electionTitle,
        setElectionTitle: updateElectionTitle,
        candidates,
        districts,
        zones,
        pollingStations,
        parties,
        votes,
        liveNotifications,
        viewMode,
        setViewMode,
        selectedDistrictId,
        setSelectedDistrictId,
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
        addZone,
        toggleStationCompletion,
        toggleZoneCompletion,
        toggleDistrictCompletion,
        resetToDefaultData,
        clearNotification,
        triggerWinnerConfetti,
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
