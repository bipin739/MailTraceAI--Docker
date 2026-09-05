import React, { useState } from 'react';
import { Search, Bell, ShieldAlert, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const mockAlerts = [
    {
      id: 'ALT-1',
      title: 'High Risk BEC Wire Transfer Email Flagged',
      time: '2 mins ago',
      level: 'CRITICAL',
      sender: 'robert.vance@bank-corp-update.com'
    },
    {
      id: 'ALT-2',
      title: 'Microsoft 365 Impersonation Link Detected',
      time: '18 mins ago',
      level: 'HIGH',
      sender: 'no-reply@m365-security-portal-verify.net'
    },
    {
      id: 'ALT-3',
      title: 'Payroll Direct Deposit Change Attempt',
      time: '45 mins ago',
      level: 'HIGH',
      sender: 'payroll-servicedesk@bankcorp-hr-portal.com'
    }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/analyze?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 h-16 flex items-center justify-between">
      {/* Global Search Box */}
      <form onSubmit={handleSearchSubmit} className="relative w-72 md:w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Sender IP, Domain, Message-ID or Hash..."
          className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/80 transition-all"
        />
      </form>

      {/* Right Navbar Utility Controls */}
      <div className="flex items-center space-x-4">
        {/* Real-time Threat Ticker Banner */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs font-mono">
          <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          <span>THREAT LEVEL: <strong>DEFCON 2 (ELEVATED BEC RISK)</strong></span>
        </div>

        {/* AI Engine Engine Status */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>AI Engine: <strong className="text-cyan-400">NLP v4.2 Active</strong></span>
        </div>

        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border border-slate-950">
              3
            </span>
          </button>

          {/* Notifications Modal Popup */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <h4 className="text-xs font-mono font-bold text-slate-100 uppercase">
                    Real-Time Security Alerts
                  </h4>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                {mockAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/analyze');
                    }}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                        {alt.level}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{alt.time}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200">{alt.title}</div>
                    <div className="text-[11px] font-mono text-cyan-400 mt-1 truncate">
                      {alt.sender}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowNotifications(false);
                  navigate('/cases');
                }}
                className="w-full mt-3 py-1.5 text-center text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                View All Active Incidents &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
