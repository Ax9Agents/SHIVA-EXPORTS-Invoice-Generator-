'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FileSpreadsheet, History, LogOut, ChevronLeft, Mail , Settings, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

import { AuthUser } from '@/lib/types/auth';
// ✅ ADD THIS AT TOP:
import Image from 'next/image';
import logoImage from '@/public/logo.avif'; // Import logo


interface SidebarProps {
  user: AuthUser;
  onToggle?: (collapsed: boolean) => void; // NEW: Callback for state change
}

export default function Sidebar({ user, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notify parent when collapsed state changes
  useEffect(() => {
    if (onToggle) {
      onToggle(isCollapsed);
    }
  }, [isCollapsed, onToggle]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      router.push('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const handleSidebarClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
  };

  const menuItems = [
    {
      name: 'Excel Generator',
      icon: FileSpreadsheet,
      path: '/',
    },
    {
      name: 'Document Generator',
      icon: FileText,
      path: '/documents',
    },
    {
      name: 'History',
      icon: History,
      path: '/logs',
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/settings',
    },
  ];

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';

  return (
    <>
      {/* Sidebar */}
      <aside
        onClick={handleSidebarClick}
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300 ease-in-out shadow-lg ${
          isCollapsed ? 'w-20 cursor-pointer' : 'w-72'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with Close/Minimize Button */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Image 
                  src={logoImage} 
                  alt="Shiva Exports Logo" 
                  width={24} 
                  height={24}
                  className="w-6 h-6"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Shiva Exports</h1>
                <p className="text-xs text-gray-500">Invoice Generator</p>
              </div>
            </div>
          )}

            {isCollapsed && (
              <div className="p-2 bg-blue-50 rounded-lg mx-auto">
                <Image 
                  src={logoImage} 
                  alt="Shiva Exports Logo" 
                  width={24} 
                  height={24}
                  className="w-6 h-6"
                />
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(true);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
                title="Minimize sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(item.path);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all group ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 shadow-sm'
                      : 'hover:bg-gray-50 text-gray-700 hover:text-blue-600'
                  }`}
                  title={isCollapsed ? item.name : ''}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'} ${isCollapsed ? 'mx-auto' : ''}`} />
                  {!isCollapsed && (
                    <span className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-700 group-hover:text-blue-600'}`}>
                      {item.name}
                    </span>
                  )}
                  {!isCollapsed && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile Dropdown at Bottom */}
          <div className="p-4 border-t border-gray-200 relative" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUserDropdown(!showUserDropdown);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>
              )}
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div
                className={`absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden ${
                  isCollapsed ? 'left-full ml-2 w-64' : 'left-4 right-4'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md text-lg flex-shrink-0">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{userEmail}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-red-600 group"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>

                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    © 2025 Invoice Generator Pro
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
