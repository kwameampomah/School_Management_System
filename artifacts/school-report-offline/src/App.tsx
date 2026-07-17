import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  db, 
  type OfflineStudent, 
  type OfflineScore 
} from './lib/db';
import { syncManager, syncEvents } from './lib/syncManager';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  User, 
  BookOpen, 
  FileSpreadsheet, 
  Send
} from 'lucide-react';

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing'>('idle');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<OfflineStudent | null>(null);
  const [scoreInput, setScoreInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Read tables from IndexedDB reactively
  const classes = useLiveQuery(() => db.classes.toArray()) || [];
  const students = useLiveQuery(() => 
    selectedClassId ? db.students.where('classId').equals(selectedClassId).toArray() : Promise.resolve([])
  ) || [];
  
  const pendingSyncCount = useLiveQuery(() => 
    db.syncQueue.where('status').equals('pending').count()
  ) || 0;

  const failedSyncCount = useLiveQuery(() => 
    db.syncQueue.where('status').equals('failed').count()
  ) || 0;

  const localScores = useLiveQuery(() => 
    selectedStudent ? db.scores.where('studentId').equals(selectedStudent.id).toArray() : Promise.resolve([])
  ) || [];

  // Track network status shifts
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showStatus("Connection restored! Background sync started.", "success");
    };
    const handleOffline = () => {
      setIsOnline(false);
      showStatus("Offline mode active. Changes will be saved locally.", "info");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync Manager listeners
    const onSyncStart = () => setSyncStatus('syncing');
    const onSyncStop = () => setSyncStatus('idle');

    syncEvents.addEventListener('sync-started', onSyncStart);
    syncEvents.addEventListener('sync-stopped', onSyncStop);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      syncEvents.removeEventListener('sync-started', onSyncStart);
      syncEvents.removeEventListener('sync-stopped', onSyncStop);
    };
  }, []);

  const showStatus = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleRefreshMetadata = async () => {
    try {
      showStatus("Downloading latest school metadata from server...", "info");
      await syncManager.downloadServerMetadata();
      showStatus("School directory sync complete!", "success");
    } catch (err: any) {
      showStatus(err.message || "Failed to update offline directory.", "error");
    }
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const scoreVal = parseFloat(scoreInput);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      showStatus("Invalid score. Enter a numeric score between 0 and 100.", "error");
      return;
    }

    try {
      // For demo, we are editing Component ID: 4 (Exam)
      await syncManager.queueScoreUpdate(
        selectedStudent.id,
        4, // Component ID
        scoreVal,
        1 // Mock Teacher ID
      );

      showStatus(
        isOnline 
          ? "Score updated & synced successfully!" 
          : "Score saved locally! Will sync automatically when online.", 
        "success"
      );
      setScoreInput('');
    } catch (err: any) {
      showStatus(err.message || "Failed to save score.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header Banner */}
      <header className="border-b border-slate-800 bg-slate-950 p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-sky-500/20 text-white">
              🏫
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Taifa Ebenezer Report Manager</h1>
              <p className="text-xs text-slate-400">Offline-First Score Entry Client (System B)</p>
            </div>
          </div>

          {/* Online/Offline Status Indicator */}
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold shadow-inner border transition-all duration-300 ${
              isOnline 
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-950/80 text-amber-400 border-amber-500/30 animate-pulse'
            }`}>
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ONLINE MODE</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>OFFLINE MODE</span>
                </>
              )}
            </div>

            {/* Refresh from server button */}
            <button
              onClick={handleRefreshMetadata}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-2 border border-slate-700 transition-colors shadow"
              title="Download classes/students from online server"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Directory</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Panel */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Sync Status & Queue */}
        <section className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-slate-800 pb-3 text-white">
            <Database className="w-5 h-5 text-sky-500" />
            <span>Local Database Status</span>
          </h2>

          {/* Sync Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Pending Syncs</span>
              <span className={`text-2xl font-bold flex items-center gap-2 ${pendingSyncCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {pendingSyncCount}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Failed Syncs</span>
              <span className={`text-2xl font-bold flex items-center gap-2 ${failedSyncCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {failedSyncCount}
              </span>
            </div>
          </div>

          {/* Notification Alerts */}
          {statusMessage && (
            <div className={`p-4 rounded-xl flex gap-3 text-sm border shadow-md animate-fade-in ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300' 
                : statusMessage.type === 'error'
                ? 'bg-red-950/40 border-red-500/20 text-red-300'
                : 'bg-sky-950/40 border-sky-500/20 text-sky-300'
            }`}>
              {statusMessage.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-5 h-5 text-sky-400 shrink-0 animate-spin" />}
              <div>{statusMessage.text}</div>
            </div>
          )}

          {/* Sync Queue Manager */}
          <div className="flex-1 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Sync Engine Actions</span>
            <button
              onClick={() => syncManager.triggerSync()}
              disabled={syncStatus === 'syncing' || pendingSyncCount === 0}
              className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow ${
                pendingSyncCount > 0 && isOnline
                  ? 'bg-sky-600 hover:bg-sky-500 text-white hover:shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <Send className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Force Sync Now'}</span>
            </button>

            <div className="mt-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
              <p className="font-semibold text-slate-300 mb-1">Local database status details:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Classes loaded: <span className="text-slate-200 font-medium">{classes.length}</span></li>
                <li>Offline records queued: <span className="text-slate-200 font-medium">{pendingSyncCount}</span></li>
                <li>Device status: <span className="text-slate-200 font-medium">{isOnline ? 'Online' : 'Offline'}</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Center Side: Class & Student Directory */}
        <section className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-slate-800 pb-3 text-white">
            <BookOpen className="w-5 h-5 text-sky-500" />
            <span>Class Directory</span>
          </h2>

          {/* Class selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Select Class</label>
            <select
              onChange={(e) => {
                const val = e.target.value;
                setSelectedClassId(val ? parseInt(val) : null);
                setSelectedStudent(null);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">-- Choose Class --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Student list */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Student Records ({students.length})</label>
            <div className="flex-1 overflow-y-auto max-h-[300px] border border-slate-850 bg-slate-900/40 rounded-xl p-2 space-y-1 scrollbar-thin">
              {students.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-10">
                  Select a class above, or click "Refresh Directory" if empty.
                </div>
              ) : (
                students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between text-xs font-medium transition-all ${
                      selectedStudent?.id === student.id
                        ? 'bg-sky-600/25 text-sky-400 border border-sky-500/30'
                        : 'bg-slate-900/60 hover:bg-slate-850 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      <span>{student.fullName}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{student.studentIdNumber}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Side: Score Entry & Profile Card */}
        <section className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-slate-800 pb-3 text-white">
            <FileSpreadsheet className="w-5 h-5 text-sky-500" />
            <span>Score Input</span>
          </h2>

          {selectedStudent ? (
            <div className="flex-1 flex flex-col gap-4">
              {/* Student Header */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/80 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm">
                  {selectedStudent.fullName[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedStudent.fullName}</h3>
                  <span className="text-[10px] text-slate-400 block font-mono">{selectedStudent.studentIdNumber} • {selectedStudent.className}</span>
                </div>
              </div>

              {/* Local database records */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Local Score History</h4>
                <div className="bg-slate-900/50 border border-slate-850 p-3 rounded-xl space-y-2 text-xs">
                  {localScores.length === 0 ? (
                    <div className="text-slate-500 text-center py-2">No scores entered offline yet.</div>
                  ) : (
                    localScores.map((sc) => (
                      <div key={sc.id} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-800">
                        <div>
                          <span className="font-semibold text-slate-200">Terminal Exam</span>
                          <span className="text-[10px] text-slate-400 block">Entered: {new Date(sc.enteredAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sky-400">{sc.scoreValue}%</span>
                          {sc.isPendingSync && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/20 text-[9px] text-amber-400 font-semibold uppercase animate-pulse">
                              Pending Sync
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Score Input Form */}
              <form onSubmit={handleSaveScore} className="flex flex-col gap-3 mt-auto">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Terminal Exam Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Enter mark (e.g. 75.5)"
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    className="bg-slate-900 border border-slate-850 text-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder-slate-600"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 rounded-xl transition-all shadow shadow-sky-600/10 text-sm flex items-center justify-center gap-2"
                >
                  <span>Submit Score</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-xs text-slate-500 py-20 bg-slate-900/20 rounded-xl border border-dashed border-slate-850">
              Choose a student from the directory to start entering scores.
            </div>
          )}
        </section>

      </main>

      {/* Footer bar */}
      <footer className="p-4 border-t border-slate-800 text-center text-xs text-slate-500 bg-slate-950">
        <p>© 2026 Taifa Ebenezer JHS Report Card Manager • Developed locally under offline-first architecture.</p>
      </footer>
    </div>
  );
}
