import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationCenter } from "@/components/NotificationCenter";
import Dashboard from "./pages/Dashboard";
import NotesScreen from "./pages/NotesScreen";
import TodoScreen from "./pages/TodoScreen";
import RemindersScreen from "./pages/RemindersScreen";
import ImportantDatesScreen from "./pages/ImportantDatesScreen";
import VaultScreen from "./pages/VaultScreen";
import SettingsScreen from "./pages/SettingsScreen";
import CalendarView from "./pages/CalendarView";
import InstallPage from "./pages/InstallPage";
import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import ProfilePage from "./pages/ProfilePage";
import DocumentsScreen from "./pages/DocumentsScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useAppStore();
  return (
    <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-muted transition-colors">
      {darkMode ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}

function AppContent() {
  const { initTheme } = useAppStore();
  const { user, loading } = useAuth();

  useEffect(() => { initTheme(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          <header className="h-12 flex items-center border-b border-border sticky top-0 z-40 bg-background">
            <SidebarTrigger className="ml-3" />
            <span className="ml-3 text-sm font-semibold text-foreground flex-1">Productivity Hub</span>
            <div className="flex items-center gap-1 mr-3">
              <GlobalSearch />
              <NotificationCenter />
              <DarkModeToggle />
            </div>
          </header>
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/notes" element={<NotesScreen />} />
              <Route path="/todos" element={<TodoScreen />} />
              <Route path="/reminders" element={<RemindersScreen />} />
              <Route path="/dates" element={<ImportantDatesScreen />} />
              <Route path="/vault" element={<VaultScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/documents" element={<DocumentsScreen />} />
              <Route path="/install" element={<InstallPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
