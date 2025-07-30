import { Home, Bot, Users, Settings, LogOut, Plus, BarChart3 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuthStore } from '../../stores/authStore';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';

type AppPage = 'dashboard' | 'guilds' | 'agents' | 'marketplace' | 'wizard' | 'analytics';

interface AppSidebarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  isGuest?: boolean;
}

const navigationItems = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'agents', label: 'AI Agents', icon: Bot },
  { key: 'guilds', label: 'Guilds', icon: Users },
  { key: 'marketplace', label: 'Marketplace', icon: BarChart3 },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export function AppSidebar({ currentPage, onNavigate, isGuest = false }: AppSidebarProps) {
  const { user, signOut } = useAuthStore();

  const isActive = (path: string) => currentPage === path;

  return (
    <Sidebar className="w-64">
      
      <SidebarContent>
        {/* Brand */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <h1 className="text-lg font-bold text-foreground">GenesisOS</h1>
          </div>
        </div>

        {/* Create Digital Worker Button */}
        <div className="p-4">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full"
            onClick={() => onNavigate('wizard')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Digital Worker
          </Button>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton 
                      asChild
                      className={isActive(item.key) ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"}
                    >
                      <button onClick={() => onNavigate(item.key as AppPage)}>
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Section */}
        <div className="mt-auto p-4 border-t border-border/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {isGuest ? 'G' : (user?.name?.[0] || 'U')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {isGuest ? 'Guest User' : user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {isGuest ? 'Guest Mode' : user?.email}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1">
              <Settings className="w-4 h-4" />
              <span className="ml-2">Settings</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={isGuest ? () => window.location.reload() : signOut}
            >
              <LogOut className="w-4 h-4" />
              <span className="ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}