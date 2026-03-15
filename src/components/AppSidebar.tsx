import { LayoutDashboard, StickyNote, CheckSquare, Bell, CalendarHeart, Lock, Settings, CalendarDays, LogOut, UserCircle, FileText } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Notes', url: '/notes', icon: StickyNote },
  { title: 'To-Do', url: '/todos', icon: CheckSquare },
  { title: 'Reminders', url: '/reminders', icon: Bell },
  { title: 'Important Dates', url: '/dates', icon: CalendarHeart },
  { title: 'Calendar', url: '/calendar', icon: CalendarDays },
  { title: 'Password Vault', url: '/vault', icon: Lock },
  { title: 'Documents', url: '/documents', icon: FileText },
  { title: 'Profile', url: '/profile', icon: UserCircle },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && <span className="text-xs font-semibold uppercase tracking-wider">Menu</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 pb-4 space-y-2">
          {user && !collapsed && (
            <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
          )}
          <button onClick={signOut} className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
