import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';

interface Props {
  children: ReactNode;
  title: string;
}

export default function AppLayout({ children, title }: Props) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-56 flex-1 flex flex-col">
        <AppHeader title={title} />
        <main className="flex-1 bg-[#f8f9fa] px-6 py-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
