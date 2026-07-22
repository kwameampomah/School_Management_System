import React, { useState } from "react";
import { Search, X, Loader2, Save, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceProgress } from "./AttendanceProgress";
import { StudentRow, StudentAttendanceItem } from "./StudentRow";

interface AttendanceModalProps {
  className: string;
  termName: string;
  students: StudentAttendanceItem[];
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onUpdateStudents: (updated: StudentAttendanceItem[]) => void;
  onSave: () => Promise<void>;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  className,
  termName,
  students,
  isOpen,
  isSaving,
  onClose,
  onUpdateStudents,
  onSave,
}) => {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const markedCount = students.filter((s) => s.marked).length;

  const filteredStudents = students.filter((s) =>
    s.studentName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentIdNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleStatus = (studentId: number, newStatus: "present" | "absent") => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          marked: true,
          status: newStatus,
          daysPresent: newStatus === "present" ? s.daysOpened : 0,
        };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  const handleMarkAll = (status: "present" | "absent") => {
    const updated = students.map((s) => ({
      ...s,
      marked: true,
      status,
      daysPresent: status === "present" ? s.daysOpened : 0,
    }));
    onUpdateStudents(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom duration-200">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md">
        <div>
          <h2 className="font-bold text-base leading-tight">Mark Attendance</h2>
          <p className="text-xs text-primary-foreground/80 font-medium">
            {className} • {termName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-primary-foreground/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Progress Bar */}
      <AttendanceProgress markedCount={markedCount} totalStudents={students.length} />

      {/* Search Input */}
      <div className="px-4 py-2.5 bg-card border-b border-border">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            type="text"
            placeholder="🔍 Search student name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-input bg-muted/40 focus:outline-none focus:border-primary text-foreground"
          />
        </div>
      </div>

      {/* Scrollable Student List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No matching students found.
          </div>
        ) : (
          filteredStudents.map((student, idx) => (
            <StudentRow
              key={student.id}
              number={idx + 1}
              student={student}
              onToggleStatus={handleToggleStatus}
            />
          ))
        )}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="sticky bottom-0 bg-card border-t border-border p-3 gap-2 flex items-center shadow-2xl">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleMarkAll("present")}
          className="flex-1 h-10 text-xs font-semibold gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 touch-active"
        >
          <CheckCircle2 className="w-4 h-4" /> All Present
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleMarkAll("absent")}
          className="flex-1 h-10 text-xs font-semibold gap-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10 touch-active"
        >
          <XCircle className="w-4 h-4" /> All Absent
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 h-10 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white touch-active shadow-md"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save & Sync
        </Button>
      </div>
    </div>
  );
};
