import React from 'react';
import { useAuth } from './AuthContext';
import { UserPermissions } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Tags,
  FileSignature
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { profile, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: '数据概览', icon: LayoutDashboard, module: 'dashboard' as keyof UserPermissions },
    { id: 'categories', label: '分类管理', icon: Tags, module: 'category' as keyof UserPermissions },
    { id: 'products', label: '产品管理', icon: Package, module: 'product' as keyof UserPermissions },
    { id: 'quotations', label: '报价管理', icon: FileText, module: 'quotation' as keyof UserPermissions },
    { id: 'contracts', label: '合同管理', icon: FileSignature, module: 'contract' as keyof UserPermissions },
    { id: 'customers', label: '客户管理', icon: Users, module: 'customer' as keyof UserPermissions },
    { id: 'users', label: '权限管理', icon: Users, module: 'user' as keyof UserPermissions },
    { id: 'settings', label: '系统设置', icon: Settings, module: 'settings' as keyof UserPermissions },
  ];

  const filteredItems = menuItems.filter(item => {
    if (!profile) return false;
    // Super admin always has access
    if (profile.role === 'super_admin') return true;
    
    // Check granular permissions if available
    if (profile.permissions && profile.permissions[item.module]) {
      return profile.permissions[item.module].view;
    }

    // Fallback to role-based defaults if no granular permissions set
    const roleDefaults: Record<string, string[]> = {
      admin: ['dashboard', 'categories', 'products', 'quotations', 'contracts', 'customers', 'settings'],
      quoter: ['dashboard', 'quotations', 'contracts', 'customers'],
      viewer: ['dashboard', 'quotations', 'contracts', 'customers']
    };

    return roleDefaults[profile.role]?.includes(item.id) || false;
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            旅游报价系统
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                activeTab === item.id 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              {profile?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profile?.name}</p>
              <p className="text-xs text-gray-500 truncate">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
        <h1 className="text-lg font-bold text-blue-600">旅游报价系统</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-white p-4 pt-20" onClick={e => e.stopPropagation()}>
            <nav className="space-y-1">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium",
                    activeTab === item.id ? "bg-blue-50 text-blue-600" : "text-gray-600"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-16 md:pt-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
