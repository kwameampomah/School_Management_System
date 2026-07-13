import { useGetAdminDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, GraduationCap, BookOpen, FileText } from "lucide-react";

const STAT_COLORS = [
  "bg-gradient-to-br from-violet-600 to-indigo-700 shadow-indigo-500/20",
  "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-teal-500/20",
  "bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-500/20",
  "bg-gradient-to-br from-rose-500 to-pink-600 shadow-pink-500/20",
];

export default function AdminDashboard() {
  const { data: summary, isLoading } = useGetAdminDashboardSummary();

  if (isLoading) return <div><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!summary) return null;

  const statCards = [
    { title: "Total Students", value: summary.totalStudents, icon: Users },
    { title: "Total Teachers", value: summary.totalTeachers, icon: GraduationCap },
    { title: "Total Classes", value: summary.totalClasses, icon: BookOpen },
    { title: "Total Subjects", value: summary.totalSubjects, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of the academic structure.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className={`text-white border-0 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${STAT_COLORS[i]}`}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium mb-1">{stat.title}</p>
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                </div>
                <div className="w-11 h-11 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Academic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Academic Year</span>
              <span className="font-semibold">{summary.currentAcademicYear || "Not Set"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Current Term</span>
              <span className="font-semibold">{summary.currentTerm || "Not Set"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Card Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Drafts</span>
              <span className="font-semibold text-muted-foreground">{summary.reportCardStatusCounts.draft}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-semibold text-secondary-foreground">{summary.reportCardStatusCounts.submitted}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Approved</span>
              <span className="font-semibold text-primary">{summary.reportCardStatusCounts.approved}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Published</span>
              <span className="font-semibold text-green-600">{summary.reportCardStatusCounts.published}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
