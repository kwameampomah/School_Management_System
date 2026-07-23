import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, LayoutGrid, Rows } from "lucide-react";
import type { Student } from "@workspace/api-client-react";

interface StudentTableProps {
  students: Student[];
  isClassTeacherOfSelectedClass: boolean;
  onEdit: (student: Student) => void;
  onDelete: (id: number) => void;
}

export const StudentTable = React.memo(({
  students,
  isClassTeacherOfSelectedClass,
  onEdit,
  onDelete,
}: StudentTableProps) => {
  const [isCompact, setIsCompact] = React.useState(false);

  return (
    <div>
      {/* Desktop Table Header Toolbar */}
      <div className="hidden md:flex items-center justify-between pb-2 mb-2">
        <span className="text-xs text-muted-foreground font-medium">
          Showing {students.length} learner records
        </span>
        <button
          onClick={() => setIsCompact(!isCompact)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted/50 hover:bg-muted border border-border text-muted-foreground transition-all"
        >
          <Rows className="w-3.5 h-3.5" />
          <span>Density: {isCompact ? "Compact" : "Comfortable"}</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="hidden sm:table-cell">Gender</TableHead>
              <TableHead className="hidden md:table-cell">Guardian</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  No students found.
                </TableCell>
              </TableRow>
            )}
            {students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                isCompact={isCompact}
                isClassTeacherOfSelectedClass={isClassTeacherOfSelectedClass}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card-Grid Fallback View */}
      <div className="md:hidden space-y-3">
        {students.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            No students found.
          </div>
        ) : (
          students.map((student) => (
            <div key={student.id} className="p-4 rounded-xl border border-border/80 bg-card shadow-sm space-y-3 touch-active">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{student.fullName}</h4>
                  <p className="font-mono text-xs text-muted-foreground mt-0.5">{student.studentIdNumber}</p>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                  {student.className || "Unassigned"}
                </span>
              </div>

              {(student.guardianName || student.guardianPhone) && (
                <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg space-y-0.5">
                  <div className="font-medium text-foreground">Guardian: {student.guardianName || "-"}</div>
                  {student.guardianPhone && <div>Phone: {student.guardianPhone}</div>}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                <span className="capitalize text-muted-foreground">Gender: {student.gender || "-"}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs gap-1"
                    onClick={() => onEdit(student)}
                    disabled={!isClassTeacherOfSelectedClass}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1"
                    onClick={() => onDelete(student.id)}
                    disabled={!isClassTeacherOfSelectedClass}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

StudentTable.displayName = "StudentTable";

interface StudentRowProps {
  student: Student;
  isCompact?: boolean;
  isClassTeacherOfSelectedClass: boolean;
  onEdit: (student: Student) => void;
  onDelete: (id: number) => void;
}

const StudentRow = React.memo(({
  student,
  isCompact,
  isClassTeacherOfSelectedClass,
  onEdit,
  onDelete,
}: StudentRowProps) => {
  const paddingClass = isCompact ? "py-1.5 px-2 text-xs" : "py-3 px-4 text-sm";

  return (
    <TableRow>
      <TableCell className={`font-mono text-xs ${paddingClass}`}>{student.studentIdNumber}</TableCell>
      <TableCell className={`font-medium ${paddingClass}`}>{student.fullName}</TableCell>
      <TableCell className={paddingClass}>{student.className}</TableCell>
      <TableCell className={`hidden sm:table-cell capitalize ${paddingClass}`}>{student.gender || "-"}</TableCell>
      <TableCell className={`hidden md:table-cell ${paddingClass}`}>
        <div className="font-medium">{student.guardianName || "-"}</div>
        <div className="text-[11px] text-muted-foreground">{student.guardianPhone || ""}</div>
      </TableCell>
      <TableCell className={`text-right ${paddingClass}`}>
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={isCompact ? "h-7 w-7" : "h-8 w-8"}
            onClick={() => onEdit(student)}
            disabled={!isClassTeacherOfSelectedClass}
            aria-label={`Edit ${student.fullName}`}
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={isCompact ? "h-7 w-7" : "h-8 w-8"}
            onClick={() => onDelete(student.id)}
            disabled={!isClassTeacherOfSelectedClass}
            aria-label={`Delete ${student.fullName}`}
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

StudentRow.displayName = "StudentRow";
