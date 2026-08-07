export type ViewMode = 'public' | 'vote' | 'admin';

export interface Party {
  id: string;
  name: string;
  shortName: string;
  color: string; // Hex color code e.g. #FF6B00
  secondaryColor?: string;
}

export interface Candidate {
  id: string;
  number: number;
  name: string;
  partyId: string;
  partyName: string;
  partyColor: string;
  photoUrl: string;
  bio?: string;
  districtId?: string; // Optional if candidate is specific to district/zone
  zoneId?: string;
}

export interface SubDistrict {
  id: string;
  name: string; // e.g. "ตำบลหมากแข้ง", "ตำบลสุเทพ"
  districtId: string;
}

export interface PollingStation {
  id: string;
  name: string; // e.g. "หน่วยที่ 1"
  stationNumber: number;
  districtId: string;
  subDistrictId?: string; // ตำบล
  zoneId: string;
  totalEligibleVoters: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Zone {
  id: string;
  name: string; // e.g. "เขตเลือกตั้งที่ 1"
  zoneNumber: number;
  districtId: string;
  status?: 'pending' | 'in_progress' | 'completed';
  isCompleted?: boolean;
}

export interface District {
  id: string;
  name: string; // e.g. "อำเภอเมือง", "อำเภอแม่ริม"
  code: string;
  status?: 'pending' | 'in_progress' | 'completed';
  isCompleted?: boolean;
}

// Stores votes per polling station per candidate
export interface PollingStationVote {
  stationId: string;
  candidateVotes: Record<string, number>; // candidateId -> vote count
  invalidVotes: number; // บัตรเสีย
  noVotes: number; // ไม่ประสงค์ลงคะแนน
  updatedAt: string;
  updatedBy?: string;
}

export interface LiveNotification {
  id: string;
  timestamp: string;
  stationName: string;
  districtName: string;
  zoneName: string;
  candidateName: string;
  candidateNumber: number;
  partyName: string;
  partyColor: string;
  votesAdded: number;
  totalVotesNow: number;
}
