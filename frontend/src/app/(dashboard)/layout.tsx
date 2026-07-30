'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ApiService } from '@priskila/api';
import { Avatar, Button } from '@priskila/ui';
import {
  LayoutDashboard,
  Briefcase,
  Package,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileBarChart,
  LogOut,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Home,
  ArrowRightLeft,
  Scale,
  ClipboardList,
  Tags,
  MapPin,
  Shield,
  Users,
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: any;
  permission?: string;
  role?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Data Master',
    items: [
      { name: 'Master Project', path: '/projects', icon: Briefcase, permission: 'manage-projects' },
      { name: 'Master Barang', path: '/barang', icon: Package, permission: 'manage-barang' },
      { name: 'Master Gudang', path: '/warehouses', icon: Home, permission: 'manage-barang' },
      { name: 'Master Supplier', path: '/suppliers', icon: Truck, permission: 'manage-suppliers' },
      { name: 'Master Kategori', path: '/kategori', icon: Tags, permission: 'manage-barang' },
      { name: 'Master Satuan', path: '/satuan', icon: Scale, permission: 'manage-barang' },
      { name: 'Konversi Satuan', path: '/conversions', icon: ArrowRightLeft, permission: 'manage-barang' },
      { name: 'Lokasi Inventori', path: '/locations', icon: MapPin, permission: 'manage-barang' },
    ],
  },
  {
    title: 'Transaksi & Stok',
    items: [
      { name: 'Barang Masuk', path: '/barang-masuk', icon: ArrowDownToLine, permission: 'manage-transactions' },
      { name: 'Pemakaian Barang', path: '/pemakaian-barang', icon: ArrowUpFromLine, permission: 'manage-transactions' },
      { name: 'Delivery Order', path: '/delivery', icon: Truck, permission: 'manage-transactions' },
      { name: 'Transfer Gudang', path: '/inventory/transfers', icon: ArrowRightLeft, permission: 'manage-transactions' },
      { name: 'Stock Adjustment', path: '/inventory/adjustments', icon: Scale, permission: 'manage-transactions' },
      { name: 'Stock Opname', path: '/inventory/opname', icon: ClipboardList, permission: 'manage-transactions' },
    ],
  },
  {
    title: 'Laporan',
    items: [
      { name: 'Laporan Stock', path: '/reports', icon: FileBarChart, permission: 'view-reports' },
      { name: 'Perputaran (FSD)', path: '/reports/turnover', icon: FileBarChart, permission: 'view-reports' },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { name: 'Pengaturan', path: '/settings', icon: Settings, role: 'admin' },
      { name: 'Hak Akses & Pengguna', path: '/settings/users', icon: Users, role: 'admin' },
      { name: 'Role & Permission', path: '/settings/roles', icon: Shield, role: 'admin' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [companyName, setCompanyName] = useState('PRISKILA');
  const [logoConfig, setLogoConfig] = useState({
    type: 'icon',
    icon_name: 'Zap',
    image_url: null as string | null,
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  useEffect(() => {
    const initialOpen: Record<string, boolean> = {};
    menuGroups.forEach(group => {
      const hasActive = group.items.some(item => {
        if (item.path === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(item.path);
      });
      if (hasActive) {
        initialOpen[group.title] = true;
      }
    });
    setOpenGroups(prev => ({ ...initialOpen, ...prev }));
  }, [pathname]);

  // Initialize theme from document element class
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    // Fetch initial settings
    ApiService.get<any[]>('/settings')
      .then((res) => {
        if (res.success && res.data) {
          const comp = res.data.find((s) => s.key === 'nama_perusahaan');
          if (comp && comp.value && comp.value.name) {
            setCompanyName(comp.value.name);
          }
          const logo = res.data.find((s) => s.key === 'logo_perusahaan');
          if (logo && logo.value) {
            setLogoConfig(logo.value);
          }
        }
      })
      .catch(() => undefined);

    // Listen to live company name updates from settings page
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCompanyName(customEvent.detail);
      }
    };

    // Listen to live company logo updates from settings page
    const handleLogoUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) {
        setLogoConfig(customEvent.detail);
      }
    };

    window.addEventListener('company-name-updated', handleUpdate);
    window.addEventListener('company-logo-updated', handleLogoUpdate);

    return () => {
      window.removeEventListener('company-name-updated', handleUpdate);
      window.removeEventListener('company-logo-updated', handleLogoUpdate);
    };
  }, []);

  const renderLogo = () => {
    if (logoConfig.type === 'image' && logoConfig.image_url) {
      return (
        <img
          src={logoConfig.image_url}
          alt={`${companyName} logo`}
          className="h-14 w-auto max-w-40 object-contain shrink-0"
        />
      );
    }

    if (logoConfig.type === 'icon') {
      return (
        <>
          <img
            src="/logo/black-logo.png"
            alt={`${companyName} logo`}
            className="h-14 w-auto max-w-40 object-contain shrink-0 dark:hidden"
          />
          <img
            src="/logo/white-logo.png"
            alt={`${companyName} logo`}
            className="hidden h-14 w-auto max-w-40 object-contain shrink-0 dark:block"
          />
        </>
      );
    }

    return (
      <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-[#F97316] text-white shadow-sm font-bold shrink-0">
        {companyName.charAt(0).toUpperCase()}
      </div>
    );
  };

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  if (!user) return null;

  const hasPermission = (item: any) => {
    if (user.roles?.includes('admin')) return true;
    if (item.permission) {
      return user.permissions?.includes(item.permission) ?? false;
    }
    if (item.role) {
      return user.roles?.includes(item.role) ?? false;
    }
    return true;
  };

  const getPageTitle = () => {
    const flatItems = menuGroups.flatMap((g) => g.items);
    const activeItem = flatItems.find((item) => {
      if (item.path === '/dashboard') return pathname === '/dashboard';
      return pathname.startsWith(item.path);
    });
    if (pathname.startsWith('/profile')) return 'Profile Pengguna';
    return activeItem ? activeItem.name : companyName;
  };

  const navLinks = (
    <nav className="space-y-4 px-3 py-4">
      {/* Standalone Dashboard Link */}
      <Link
        href="/dashboard"
        onClick={() => setIsMobileOpen(false)}
        className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${pathname === '/dashboard'
          ? 'bg-[#F97316] text-white shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
      >
        <LayoutDashboard
          className={`h-4.5 w-4.5 shrink-0 ${pathname === '/dashboard' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}
        />
        <span
          className={`${!isSidebarOpen ? 'lg:hidden' : 'block'} transition-opacity duration-300`}
        >
          Dashboard
        </span>
      </Link>

      {/* Grouped Links */}
      {menuGroups
        .map((group) => {
          const visibleItems = group.items.filter(hasPermission);
          return { ...group, items: visibleItems };
        })
        .filter((group) => group.items.length > 0)
        .map((group, idx) => {
          const isOpen = openGroups[group.title] ?? false;
          return (
            <div key={idx} className="space-y-1">
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                className={`w-full flex items-center justify-between px-4 py-2 text-left text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all focus:outline-none ${!isSidebarOpen ? 'lg:opacity-0 lg:h-0 lg:py-0 overflow-hidden' : 'block'
                  }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {group.title}
                </span>
                {isSidebarOpen && (
                  isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )
                )}
              </button>

              <div
                className={`space-y-1 transition-all duration-200 ${isSidebarOpen && !isOpen ? 'h-0 opacity-0 overflow-hidden' : 'h-auto opacity-100'
                  }`}
              >
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.path ||
                    (pathname.startsWith(item.path + '/') &&
                      !menuGroups
                        .flatMap((g) => g.items)
                        .some(
                          (otherItem) =>
                            otherItem.path !== item.path &&
                            pathname.startsWith(otherItem.path) &&
                            otherItem.path.startsWith(item.path)
                        ));

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                        ? 'bg-[#F97316] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                    >
                      <Icon
                        className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}
                      />
                      <span
                        className={`${!isSidebarOpen ? 'lg:hidden' : 'block'} transition-opacity duration-300`}
                      >
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shrink-0 sticky top-0 h-full transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800/80">
          <Link
            href="/dashboard"
            onClick={(e) => {
              if (!isSidebarOpen) {
                e.preventDefault();
                setIsSidebarOpen(true);
              }
            }}
            className="flex items-center gap-2.5"
          >
            {renderLogo()}
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto slim-scrollbar">{navLinks}</div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-2 py-2 rounded-xl transition-colors ${pathname.startsWith('/profile')
              ? 'bg-slate-100 dark:bg-slate-800'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
          >
            <Avatar name={user.name} size="sm" />
            <div className={`text-left shrink-0 ${!isSidebarOpen ? 'lg:hidden' : 'block'}`}>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-50 truncate max-w-[130px]">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-400 capitalize truncate max-w-[130px]">
                {user.roles?.[0] || 'Staff'}
              </div>
            </div>
          </Link>

          <Button
            variant="danger"
            onClick={logout}
            className={`w-full justify-start ${!isSidebarOpen ? 'lg:px-2' : ''}`}
          >
            <LogOut className="h-4 w-4" />
            <span className={`${!isSidebarOpen ? 'lg:hidden' : 'block'}`}>Keluar</span>
          </Button>
        </div>
      </aside>

      {/* Sidebar - Mobile drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-150 dark:border-slate-800 h-full transition-transform duration-300 lg:hidden ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {renderLogo()}
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto slim-scrollbar">{navLinks}</div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <Link
            href="/profile"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <Avatar name={user.name} size="sm" />
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-50 truncate max-w-[130px]">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-400 capitalize truncate max-w-[130px]">
                {user.roles?.[0] || 'Staff'}
              </div>
            </div>
          </Link>
          <Button variant="danger" onClick={logout} className="w-full justify-start">
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </Button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="Ganti Tema"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notification Trigger */}
            <button
              className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors relative"
              title="Notifikasi"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <span className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <Link href="/profile" className="hidden sm:flex items-center gap-2.5">
              <Avatar name={user.name} size="sm" />
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">{user.roles?.[0]}</div>
              </div>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/40">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
