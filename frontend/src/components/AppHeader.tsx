import { Shield } from 'lucide-react';

interface Props {
  title: string;
}

export default function AppHeader({ title }: Props) {
  return (
    <header className="h-14 bg-[#602320] text-white flex items-center justify-between px-6 shadow-md">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">
        <Shield size={16} className="opacity-80" />
        <div>
          <p className="text-sm font-medium leading-tight">Aether Tax</p>
          <p className="text-xs opacity-70 leading-tight">Financial Due-Diligence Intelligence Platform</p>
        </div>
      </div>
    </header>
  );
}
