import { useGetAdminDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, GraduationCap, BookOpen, FileText } from "lucide-react";

const STAT_THEMES = [
  { // Violet/Indigo (Students)
    hoverBorder: "hover:border-violet-500/30",
    iconBg: "bg-violet-500/10 border-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400"
  },
  { // Emerald/Teal (Teachers)
    hoverBorder: "hover:border-emerald-500/30",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400"
  },
  { // Amber/Orange (Classes)
    hoverBorder: "hover:border-amber-500/30",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400"
  },
  { // Rose/Pink (Subjects)
    hoverBorder: "hover:border-rose-500/30",
    iconBg: "bg-rose-500/10 border-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400"
  }
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          const theme = STAT_THEMES[i];
          return (
            <Card key={i} className={`bg-card text-card-foreground border border-border/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ${theme.hoverBorder}`}>
              <CardContent className="p-3.5 sm:p-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
                <div>
                  <p className="text-muted-foreground text-[11px] sm:text-sm font-medium leading-tight mb-0.5 sm:mb-1">{stat.title}</p>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{stat.value}</div>
                </div>
                <div className={`w-8 h-8 sm:w-11 sm:h-11 border rounded-full flex items-center justify-center shrink-0 self-end sm:self-auto ${theme.iconBg}`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.iconColor}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Executive Command Center Analytics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Term & Academic Year Info */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Academic Period</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Active</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="flex justify-between items-center py-2 border-b border-border/50 text-xs sm:text-sm">
              <span className="text-muted-foreground font-medium">Academic Year</span>
              <span className="font-bold text-foreground">{summary.currentAcademicYear || "Not Set"}</span>
            </div>
            <div className="flex justify-between items-center py-2 text-xs sm:text-sm">
              <span className="text-muted-foreground font-medium">Active Term</span>
              <span className="font-bold text-primary">{summary.currentTerm || "Not Set"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Report Card Status Gauge */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Report Cards Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Draft ({summary.reportCardStatusCounts.draft})</span>
                <span className="text-emerald-600 dark:text-emerald-400">Approved ({summary.reportCardStatusCounts.approved})</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{
                    width: `${
                      (summary.reportCardStatusCounts.draft /
                        (summary.reportCardStatusCounts.draft +
                          summary.reportCardStatusCounts.submitted +
                          summary.reportCardStatusCounts.approved +
                          summary.reportCardStatusCounts.published || 1)) *
                      100
                    }%`,
                  }}
                />
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{
                    width: `${
                      (summary.reportCardStatusCounts.submitted /
                        (summary.reportCardStatusCounts.draft +
                          summary.reportCardStatusCounts.submitted +
                          summary.reportCardStatusCounts.approved +
                          summary.reportCardStatusCounts.published || 1)) *
                      100
                    }%`,
                  }}
                />
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{
                    width: `${
                      ((summary.reportCardStatusCounts.approved + summary.reportCardStatusCounts.published) /
                        (summary.reportCardStatusCounts.draft +
                          summary.reportCardStatusCounts.submitted +
                          summary.reportCardStatusCounts.approved +
                          summary.reportCardStatusCounts.published || 1)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <div className="font-bold text-sm">{summary.reportCardStatusCounts.draft}</div>
                <div className="text-[10px]">Drafts</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <div className="font-bold text-sm">{summary.reportCardStatusCounts.submitted}</div>
                <div className="text-[10px]">Submitted</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <div className="font-bold text-sm">{summary.reportCardStatusCounts.approved + summary.reportCardStatusCounts.published}</div>
                <div className="text-[10px]">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Launchpad */}
        <Card className="border border-border/80 shadow-sm md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Admin Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 pt-2">
            <a
              href="/admin/class-report-cards"
              className="p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-all text-xs font-semibold flex flex-col items-center justify-center gap-1 text-center touch-active"
            >
              <FileText className="w-5 h-5 text-primary" />
              <span>Bulk Reports</span>
            </a>
            <a
              href="/admin/fees"
              className="p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-xs font-semibold flex flex-col items-center justify-center gap-1 text-center touch-active"
            >
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Collect Fees</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
