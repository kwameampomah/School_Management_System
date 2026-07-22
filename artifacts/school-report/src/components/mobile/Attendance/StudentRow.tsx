import React, { useState } from "react";
import { Check, X as XIcon } from "lucide-react";

export interface StudentAttendanceItem {
  id: number;
  studentName: string;
  studentIdNumber: string;
  marked: boolean;
  status: "present" | "absent";
  daysOpened: number;
  daysPresent: number;
  conduct: string;
  attitude: string;
  interest: string;
  teacherRemarks: string;
}

interface StudentRowProps {
  number: number;
  student: StudentAttendanceItem;
  onToggleStatus: (studentId: number, newStatus: "present" | "absent") => void;
}

export const StudentRow: React.FC<StudentRowProps> = ({
  number,
  student,
  onToggleStatus,
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleSwipe = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 40;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swiped Left → Mark Absent
        onToggleStatus(student.id, "absent");
      } else {
        // Swiped Right → Mark Present
        onToggleStatus(student.id, "present");
      }
    }
  };

  const isAbsent = student.status === "absent";

  return (
    <div
      onTouchStart={(e) => setTouchStart(e.changedTouches[0].clientX)}
      onTouchEnd={(e) => {
        setTouchEnd(e.changedTouches[0].clientX);
        handleSwipe();
      }}
      onClick={() => onToggleStatus(student.id, isAbsent ? "present" : "absent")}
      className={`flex items-center gap-3 px-4 py-3.5 border-b border-border/60 transition-colors cursor-pointer touch-active select-none ${
        student.marked
          ? isAbsent
            ? "bg-rose-500/10 dark:bg-rose-950/20"
            : "bg-emerald-500/10 dark:bg-emerald-950/20"
          : "bg-card hover:bg-muted/30"
      }`}
    >
      {/* Index Number */}
      <span className="text-xs font-mono font-medium text-muted-foreground w-6 text-center">
        {number}
      </span>

      {/* Touch Checkbox */}
      <div
        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all shrink-0 ${
          student.marked
            ? isAbsent
              ? "bg-rose-500 border-rose-500 text-white"
              : "bg-emerald-500 border-emerald-500 text-white"
            : "border-input bg-background"
        }`}
      >
        {student.marked && (
          isAbsent ? <XIcon className="w-4 h-4 stroke-[3]" /> : <Check className="w-4 h-4 stroke-[3]" />
        )}
      </div>

      {/* Student Metadata */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-foreground truncate">{student.studentName}</p>
        <p className="text-xs font-mono text-muted-foreground truncate">{student.studentIdNumber}</p>
      </div>

      {/* Status Badge */}
      {student.marked && (
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
            isAbsent
              ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
              : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
          }`}
        >
          {isAbsent ? "ABSENT" : "PRESENT"}
        </span>
      )}
    </div>
  );
};
