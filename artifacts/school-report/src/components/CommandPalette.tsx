import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Search, LayoutDashboard, Users, FileText, CalendarCheck, CreditCard,
  GraduationCap, BookOpen, SlidersHorizontal, Sun, Moon, RefreshCw, X, Zap
} from "lucide-react";
import { useTheme } from "@/contexts/theme";

interface CommandPaletteProps {
  role?: string;
}

export default function CommandPalette({ role }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!open) return null;

  const navItems = [
    { label: "Dashboard", href: role === "teacher" ? "/teacher/dashboard" : role === "parent" ? "/parent/dashboard" : "/admin/dashboard", icon: LayoutDashboard, category: "Navigation" },
    { label: "Score Entry", href: role === "teacher" ? "/teacher/score-entry" : "/admin/score-entry", icon: FileText, category: "Navigation" },
    { label: "Attendance & Remarks", href: "/teacher/attendance", icon: CalendarCheck, category: "Navigation" },
    { label: "Students Roster", href: "/admin/students", icon: Users, category: "Management" },
    { label: "Fee Collections & Billing", href: "/admin/fees", icon: CreditCard, category: "Management" },
    { label: "Report Cards Studio", href: "/admin/class-report-cards", icon: GraduationCap, category: "Reports" },
    { label: "Academic Terms", href: "/admin/terms", icon: BookOpen, category: "Setup" },
    { label: "Assessment Components", href: "/admin/assessment-components", icon: SlidersHorizontal, category: "Setup" },
  ];

  const filteredNav = navItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setLocation(href);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-border bg-muted/20">
          <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search (e.g. Scores, Fees, Students)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent py-4 text-sm font-medium text-foreground focus:outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border rounded">
            ESC
          </kbd>
          <button
            onClick={() => setOpen(false)}
            className="ml-2 sm:hidden p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredNav.length > 0 && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5">
              Pages & Commands
            </div>
          )}
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => handleSelect(item.href)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/60 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] font-normal text-muted-foreground group-hover:text-primary/80">
                  {item.category}
                </span>
              </button>
            );
          })}

          {filteredNav.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands or pages found.
            </div>
          )}

          {/* Quick Utility Actions */}
          <div className="pt-2 border-t border-border mt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5">
              System Utilities
            </div>
            <button
              onClick={() => {
                toggleTheme();
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-muted/60">
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-purple-500" />}
              </div>
              <span>Switch to {theme === "dark" ? "Light" : "Dark"} Mode</span>
            </button>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 bg-muted/30 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>Desktop Shortcut Active</span>
          </div>
          <div className="flex items-center gap-1 font-mono">
            <span>Use</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-card border rounded">↑</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-card border rounded">↓</kbd>
            <span>to navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
