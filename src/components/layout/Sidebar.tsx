import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  SearchCode,
  FolderLock,
  Globe2,
  FileText,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
  Zap
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      badge: undefined
    },
    {
      name: 'Analyze Email',
      path: '/analyze',
      icon: SearchCode,
      badge: 'UPLOAD'
    },
    {
      name: 'Forensic View',
      path: '/analysis/demo',
      icon: FileText,
      badge: 'EVIDENCE'
    },
    {
      name: 'Investigations',
      path: '/cases',
      icon: FolderLock,
      badge: '3 Active'
    },
    {
      name: 'Threat Intelligence',
      path: '/intelligence',
      icon: Globe2,
      badge: undefined
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: FileText,
      badge: undefined
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Sliders,
      badge: undefined
    }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-950/95 border-r border-slate-800/90 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header Logo */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
            </div>

            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-mono font-extrabold text-base tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  MailTrace AI
                </span>
                <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">
                  SOC Forensics v2.4
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Live Status Indicator Pill */}
        {!collapsed && (
          <div className="mx-3 mt-4 mb-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-slate-300">SOC Sensor Active</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              ONLINE
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/40 text-cyan-300 border border-cyan-700/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 flex-shrink-0 group-hover:text-cyan-400 transition-colors" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Quick Action Card */}
      <div className="p-3 border-t border-slate-800/80">
        {!collapsed ? (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-xs font-mono font-bold text-cyan-300">
                AM
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-slate-200 truncate">Alex Mercer</span>
                <span className="text-[10px] font-mono text-cyan-400 truncate">Lead SOC Analyst</span>
              </div>
            </div>
            <NavLink
              to="/analyze"
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>SCAN RAW EMAIL</span>
            </NavLink>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-xs font-mono font-bold text-cyan-300">
              AM
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
