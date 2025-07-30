
import React from 'react';
import { UserCircle, LogOut, Settings, Plus, Users, Bot, Store, BarChart3, Home, Crown, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/button';

type AppPage = 'dashboard' | 'guilds' | 'agents' | 'marketplace' | 'wizard' | 'analytics' | 'phase4' | 'canvas';

interface HeaderProps {
  isGuest?: boolean;
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export const Header: React.FC<HeaderProps> = ({ isGuest = false, currentPage, onNavigate }) => {
  const { user, signOut } = useAuthStore();

  const navigationItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'canvas', label: 'Canvas', icon: Sparkles },
    { key: 'guilds', label: 'Guilds', icon: Users },
    { key: 'agents', label: 'Agents', icon: Bot },
    { key: 'marketplace', label: 'Marketplace', icon: Store },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'phase4', label: 'Phase 4', icon: Crown },
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 relative z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">GenesisOS</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key as AppPage)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === item.key
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <Button 
            variant="default" 
            size="sm" 
            className="hidden md:flex"
            onClick={() => onNavigate('wizard')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Digital Worker
          </Button>

          <div className="relative">
            <div className="flex items-center space-x-3">
              <UserCircle className="w-8 h-8 text-gray-600" />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {isGuest ? 'Guest User' : user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {isGuest ? 'Guest Mode' : user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={isGuest ? () => window.location.reload() : signOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
