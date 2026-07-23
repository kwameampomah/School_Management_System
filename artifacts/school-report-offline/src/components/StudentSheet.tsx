import { useState, useEffect } from "react";
import { X, User, Phone, BookOpen, UserCheck, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Student, Class } from "@workspace/api-client-react";

interface StudentSheetProps {
  student: Student | null;
  classes: Class[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Student>) => Promise<void>;
}

export default function StudentSheet({
  student,
  classes,
  isOpen,
  onClose,
  onSave,
}: StudentSheetProps) {
  const [fullName, setFullName] = useState("");
  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [classId, setClassId] = useState<string>("");
  const [gender, setGender] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setFullName(student.fullName || "");
      setStudentIdNumber(student.studentIdNumber || "");
      setClassId(student.classId ? student.classId.toString() : "");
      setGender(student.gender || "");
      setGuardianName(student.guardianName || "");
      setGuardianPhone(student.guardianPhone || "");
    } else {
      setFullName("");
      setStudentIdNumber("");
      setClassId("");
      setGender("");
      setGuardianName("");
      setGuardianPhone("");
    }
  }, [student]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        fullName,
        studentIdNumber,
        classId: classId ? parseInt(classId, 10) : undefined,
        gender: gender || undefined,
        guardianName: guardianName || undefined,
        guardianPhone: guardianPhone || undefined,
      });
      onClose();
    } catch {
      // Handled upstream
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border-l border-border h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                {student ? "Edit Student Profile" : "Add New Student"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {student ? `ID: ${student.studentIdNumber}` : "Enter learner credentials"}
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-xs font-semibold">Full Legal Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Kwame Mensah"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentIdNumber" className="text-xs font-semibold">Student ID / Index No. *</Label>
            <Input
              id="studentIdNumber"
              value={studentIdNumber}
              onChange={(e) => setStudentIdNumber(e.target.value)}
              placeholder="e.g. STU-2026-001"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Assigned Class *</Label>
              <Select value={classId} onChange={(e) => setClassId(e.target.value)} required>
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Gender</Label>
              <Select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-4 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Guardian Details
            </span>

            <div className="space-y-2">
              <Label htmlFor="guardianName" className="text-xs font-semibold">Guardian Full Name</Label>
              <Input
                id="guardianName"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="e.g. Mrs. Grace Mensah"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianPhone" className="text-xs font-semibold">Guardian Phone Number</Label>
              <Input
                id="guardianPhone"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="e.g. +233 24 123 4567"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
