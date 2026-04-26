import { LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  title: string;
}

export default function AppHeader({ title }: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="h-14 bg-[#602320] text-white flex items-center justify-between px-6 shadow-md">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="opacity-80" />
          <div>
            <p className="text-sm font-medium leading-tight">{user?.full_name || 'Aether Tax'}</p>
            {user?.email && (
              <p className="text-xs opacity-70 leading-tight mt-0.5 truncate max-w-[200px] sm:max-w-xs" title={user.email}>
                {user.email}
              </p>
            )}
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition"
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
