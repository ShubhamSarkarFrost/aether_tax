import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, FileText } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions/new', label: 'New Transaction', icon: PlusCircle },
  { to: '/', label: 'Tax Records', icon: FileText },
];

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-full w-56 bg-[#1a1a2e] text-white flex flex-col z-20">
      <div className="px-5 py-5 border-b border-white/10">
        <span className="text-xl font-bold tracking-tight" style={{ color: '#dc6900' }}>
          Aether Tax
        </span>
        <p className="text-xs text-white/50 mt-0.5">Intelligence Platform</p>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#dc6900] text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
