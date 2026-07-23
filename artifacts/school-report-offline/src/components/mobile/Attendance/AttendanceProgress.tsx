import React from "react";

interface AttendanceProgressProps {
  markedCount: number;
  totalStudents: number;
}

export const AttendanceProgress: React.FC<AttendanceProgressProps> = ({
  markedCount,
  totalStudents,
}) => {
  const percentage = totalStudents > 0 ? Math.round((markedCount / totalStudents) * 100) : 0;

  return (
    <div className="px-4 py-3 bg-muted/40 border-b border-border space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-foreground">
          Marked: <span className="text-primary font-mono font-bold">{markedCount}</span> / <span className="font-mono">{totalStudents}</span>
        </span>
        <span className="text-muted-foreground font-mono">{percentage}% Complete</span>
      </div>
      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
