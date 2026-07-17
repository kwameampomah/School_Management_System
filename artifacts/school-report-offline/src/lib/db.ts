import Dexie, { type Table } from 'dexie';

// -------------------------------------------------------------
// Offline TypeScript Interfaces (matching backend schemas)
// -------------------------------------------------------------

export interface OfflineStudent {
  id: number;
  studentIdNumber: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  classId: number;
  className: string;
  guardianName?: string;
  guardianPhone?: string;
}

export interface OfflineClass {
  id: number;
  name: string;
  academicYearId: number;
}

export interface OfflineSubject {
  id: number;
  name: string;
  code: string;
}

export interface OfflineAssessmentComponent {
  id: number;
  classSubjectId: number;
  termId: number;
  name: string; // e.g. "Class Exercise", "Exam"
  maxScore: number;
  weightPercent: number;
}

export interface OfflineScore {
  id?: number; // local auto-increment or matching server id
  studentId: number;
  assessmentComponentId: number;
  teacherId: number | null;
  scoreValue: number;
  isLocked: boolean;
  enteredAt: string;
  lastEditedAt?: string;
  isPendingSync?: boolean; // Flag to indicate offline mutation not yet verified by server
}

export interface OfflineSyncQueueItem {
  id?: number;
  type: 'PUT_SCORE';
  payload: {
    studentId: number;
    assessmentComponentId: number;
    scoreValue: number;
    teacherId: number | null;
    timestamp: string;
  };
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
  retryCount: number;
}

// -------------------------------------------------------------
// Dexie local database initialization
// -------------------------------------------------------------

export class SchoolOfflineDatabase extends Dexie {
  students!: Table<OfflineStudent, number>;
  classes!: Table<OfflineClass, number>;
  subjects!: Table<OfflineSubject, number>;
  assessmentComponents!: Table<OfflineAssessmentComponent, number>;
  scores!: Table<OfflineScore, number>;
  syncQueue!: Table<OfflineSyncQueueItem, number>;

  constructor() {
    super('SchoolOfflineDatabase');
    
    // Define database tables and indexes
    // Note: Use compound index [studentId+assessmentComponentId] for fast scores querying
    this.version(1).stores({
      students: 'id, studentIdNumber, fullName, classId',
      classes: 'id, name',
      subjects: 'id, name, code',
      assessmentComponents: 'id, classSubjectId, termId, name',
      scores: '++id, studentId, assessmentComponentId, [studentId+assessmentComponentId], isPendingSync',
      syncQueue: '++id, status, type'
    });
  }
}

export const db = new SchoolOfflineDatabase();
