import { Link, useLocation } from "wouter";
import { useEffect, useState, useMemo, useRef } from "react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import {
  Loader2, LogOut, BookOpen, Users, GraduationCap, LayoutDashboard,
  Settings, FileText, CalendarDays, Menu, X, Sun, Moon, ArrowUpCircle,
  CalendarCheck, CreditCard, SlidersHorizontal, UserCheck, FolderKanban, Plus, Zap, Sparkles
} from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/theme";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";

interface NavGroup {
  groupName: string;
  items: { href: string; label: string; icon: any }[];
}

const categorizedNavItems: Record<string, NavGroup[]> = {
  admin: [
    {
      groupName: "OVERVIEW",
      items: [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      ]
    },
    {
      groupName: "DAILY OPERATIONS",
      items: [
        { href: "/admin/report-cards", label: "Report Cards", icon: FileText },
        { href: "/admin/attendance", label: "Attendance & Remarks", icon: CalendarCheck },
        { href: "/admin/fees", label: "Fees & Billing", icon: CreditCard },
      ]
    },
    {
      groupName: "PEOPLE & ROSTER",
      items: [
        { href: "/admin/students", label: "Students", icon: Users },
        { href: "/admin/classes", label: "Classes", icon: GraduationCap },
        { href: "/admin/users", label: "Staff & Users", icon: UserCheck },
        { href: "/admin/teacher-assignments", label: "Teacher Assignments", icon: FolderKanban },
        { href: "/admin/promotions", label: "Class Promotions", icon: ArrowUpCircle },
      ]
    },
    {
      groupName: "ACADEMIC SETUP",
      items: [
        { href: "/admin/academic-years", label: "Academic Years", icon: CalendarDays },
        { href: "/admin/terms", label: "Terms", icon: CalendarDays },
        { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
        { href: "/admin/assessment-components", label: "Assessment Config", icon: SlidersHorizontal },
        { href: "/admin/grading-scales", label: "Grading Scales", icon: Settings },
      ]
    }
  ],
  teacher: [
    {
      groupName: "TEACHER DASHBOARD",
      items: [
        { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
        { href: "/teacher/students", label: "Students Roster", icon: Users },
        { href: "/teacher/attendance", label: "Attendance & Remarks", icon: CalendarCheck },
        { href: "/teacher/report-cards", label: "Report Cards", icon: FileText },
      ]
    }
  ],
  parent: [
    {
      groupName: "PARENT PORTAL",
      items: [
        { href: "/parent", label: "My Children", icon: Users },
      ]
    }
  ]
};

function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`p-1.5 rounded-md transition-colors hover:bg-accent text-muted-foreground hover:text-foreground ${className}`}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

function SidebarContent({
  role,
  location,
  user,
  onNavClick,
  onLogout,
}: {
  role: "admin" | "teacher" | "parent";
  location: string;
  user: { fullName?: string | null; email?: string | null };
  onNavClick?: () => void;
  onLogout: () => void;
}) {
  const groups = categorizedNavItems[role];
  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header logo */}
      <div className="p-5 shrink-0 border-b border-sidebar-border/60">
        <div className="flex items-center gap-2.5 font-bold text-base tracking-tight text-foreground">
          <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain shrink-0" />
          <span>Taifa Ebenezer</span>
        </div>
      </div>

      {/* Categorized Nav Groups */}
      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        {groups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
              {group.groupName}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                location === item.href ||
                (location.startsWith(item.href) &&
                  item.href !== "/admin" &&
                  item.href !== "/teacher" &&
                  item.href !== "/parent");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavClick}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-sidebar-border shrink-0 bg-muted/20">
        <div className="px-3 py-1.5 mb-1 min-w-0">
          <div className="text-xs font-semibold text-foreground truncate">{user.fullName || "User Account"}</div>
          <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start text-xs text-muted-foreground hover:text-foreground h-8"
            onClick={onLogout}
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign Out
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export function AppLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "admin" | "teacher" | "parent";
}) {
  const { data: user, isLoading } = useGetMe();
  const logout = useLogout();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const flatItems = useMemo(() => {
    return categorizedNavItems[role].flatMap(g => g.items);
  }, [role]);

  const bottomItems = useMemo(() => {
    if (role === "admin") {
      return flatItems.filter((i) =>
        ["/admin", "/admin/report-cards", "/admin/attendance", "/admin/fees"].includes(i.href)
      );
    }
    return flatItems;
  }, [role, flatItems]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/login");
      },
    });
  };

  useEffect(() => {
    setMobileOpen(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground text-sm">Please log in to access this page.</p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const [fabOpen, setFabOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-30 border-r border-sidebar-border bg-sidebar">
        <SidebarContent
          role={role}
          location={location}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {/* Desktop Top Status Bar */}
      <div className="hidden md:flex flex-1 md:pl-64 sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-6 py-2.5 items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <span>School Management System</span>
        </div>
        <div className="flex items-center gap-3">
          <SyncStatusIndicator />
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-3 border-b border-border bg-background sticky top-0 z-30">
        <div className="flex items-center gap-2 font-bold text-sm">
          <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          <span>Taifa Ebenezer</span>
        </div>
        <div className="flex items-center gap-2">
          <SyncStatusIndicator />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Slide-out Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border shadow-xl z-50">
            <SidebarContent
              role={role}
              location={location}
              user={user}
              onNavClick={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Quick Action FAB Modal Drawer */}
      {fabOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                <Zap className="w-4 h-4 fill-primary text-primary" />
                <span>Quick Actions</span>
              </div>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setFabOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href={role === "teacher" ? "/teacher/score-entry" : "/admin/score-entry"}
                onClick={() => setFabOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary transition-all text-xs font-semibold gap-1.5 touch-active"
              >
                <FileText className="w-5 h-5" />
                <span>Enter Scores</span>
              </Link>

              <Link
                href="/teacher/attendance"
                onClick={() => setFabOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all text-xs font-semibold gap-1.5 touch-active"
              >
                <CalendarCheck className="w-5 h-5" />
                <span>Take Attendance</span>
              </Link>

              <Link
                href="/admin/fees"
                onClick={() => setFabOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-400 transition-all text-xs font-semibold gap-1.5 touch-active"
              >
                <CreditCard className="w-5 h-5" />
                <span>Collect Fees</span>
              </Link>

              <Link
                href="/admin/students"
                onClick={() => setFabOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-600 dark:text-purple-400 transition-all text-xs font-semibold gap-1.5 touch-active"
              >
                <Users className="w-5 h-5" />
                <span>Students Roster</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <main ref={scrollRef} className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Mobile Floating Glassmorphism Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-card/90 backdrop-blur-xl border border-border/80 rounded-full shadow-2xl flex items-center justify-around px-2 py-1.5">
          {bottomItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-full text-[10px] font-medium transition-all touch-active ${
                  isActive
                    ? "text-primary font-bold scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Center Floating Action Button (FAB) */}
          <button
            onClick={() => setFabOpen(!fabOpen)}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/30 touch-active -mt-4 border-2 border-background transition-transform"
            aria-label="Quick Action Menu"
          >
            <Plus className={`w-6 h-6 transition-transform duration-200 ${fabOpen ? "rotate-45" : ""}`} />
          </button>

          {bottomItems.slice(2, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-full text-[10px] font-medium transition-all touch-active ${
                  isActive
                    ? "text-primary font-bold scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
