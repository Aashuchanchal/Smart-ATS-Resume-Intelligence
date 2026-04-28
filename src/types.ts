export interface User {
  name: string;
  email: string;
  designation: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  createdAt: number;
}

export type CandidateStatus = 'Accepted' | 'Rejected' | 'Review' | 'Pending' | 'Selected';

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  resumeText: string;
  status: CandidateStatus;
  score: number;
  scoreBreakdown: {
    skills: number;
    experience: number;
    education: number;
  };
  feedback: string;
  analyzedAt?: number;
  interviewStatus?: 'Not Scheduled' | 'Pending Selection' | 'Scheduled';
  scheduledSlot?: string;
  proposedSlots?: string[];
  slotsProposedAt?: number;
  lastReminderSentAt?: number;
  isDeleted?: boolean;
  deletedAt?: number;
}

export interface AnalysisResult {
  status: CandidateStatus;
  score: number;
  scoreBreakdown: {
    skills: number;
    experience: number;
    education: number;
  };
  feedback: string;
}
