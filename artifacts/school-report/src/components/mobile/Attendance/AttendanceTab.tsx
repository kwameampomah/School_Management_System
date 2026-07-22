import React, { useState } from "react";
import { CalendarCheck, Play, Users, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceModal } from "./AttendanceModal";
import { StudentAttendanceItem } from "./StudentRow";

interface AttendanceTabProps {
  className: string;
  termName: string;
  students: StudentAttendanceItem[];
  isSaving: boolean;
  onUpdateStudents: (updated: StudentAttendanceItem[]) => void;
  onSave: () => Promise<void>;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  className,
  termName,
  students,
  isSaving,
  onUpdateStudents,
  onSave,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const markedCount = students.filter((s) => s.marked).length;

  return (
    <div className="md:hidden space-y-4 pb-20">
      {/* Mobile Hero Banner */}
      <div className="bg-gradient-to-br from-primary to-purple-700 text-primary-foreground p-5 rounded-2xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-white" />
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Class Attendance</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-md">
            {className || "Select Class"}
          </span>
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight">{className || "Class Attendance"}</h2>
          <p className="text-xs text-primary-foreground/80">{termName || "Active Term"}</p>
        </div>

        {/* Hero CTA Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-3.5 px-4 bg-white text-primary rounded-xl font-extrabold text-sm shadow-lg hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2 touch-active"
        >
          <Play className="w-4 h-4 fill-primary" />
          <span>START ATTENDANCE MARKING</span>
        </button>
      </div>

      {/* Live Status Card */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Marked Today</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-foreground font-mono">
            {markedCount} <span className="text-xs text-muted-foreground font-sans font-normal">/ {students.length}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Total Students</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-foreground font-mono">{students.length}</div>
        </div>
      </div>

      {/* Recent Classes Roster */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
          <Clock className="w-3.5 h-3.5" /> Recent Class Records
        </h3>

        {students.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-card">
            Select a class above to load student attendance.
          </div>
        ) : (
          <div
            onClick={() => setIsModalOpen(true)}
            className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 shadow-xs cursor-pointer touch-active flex items-center justify-between"
          >
            <div>
              <h4 className="font-bold text-sm text-foreground">{className}</h4>
              <p className="text-xs text-muted-foreground">{termName}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                {markedCount}/{students.length}
              </span>
              <span className="text-[10px] text-muted-foreground">marked</span>
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Marking Modal */}
      <AttendanceModal
        className={className}
        termName={termName}
        students={students}
        isOpen={isModalOpen}
        isSaving={isSaving}
        onClose={() => setIsModalOpen(false)}
        onUpdateStudents={onUpdateStudents}
        onSave={async () => {
          await onSave();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};
