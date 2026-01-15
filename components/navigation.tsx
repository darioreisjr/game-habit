'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, CheckSquare, Calendar, User, FolderKanban, Trophy, ShoppingBag, Swords, Settings, Users, Crown, Sparkles, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', icon: Map, label: 'Mapa' },
  { href: '/habits', icon: CheckSquare, label: 'Hábitos' },
  { href: '/areas', icon: FolderKanban, label: 'Áreas' },
  { href: '/routine', icon: Calendar, label: 'Rotina' },
  { href: '/challenges', icon: Swords, label: 'Desafios' },
  { href: '/shop', icon: ShoppingBag, label: 'Loja' },
  { href: '/achievements', icon: Trophy, label: 'Conquistas' },
  { href: '/friends', icon: Users, label: 'Amigos', badge: 'V3' },
  { href: '/leaderboard', icon: Crown, label: 'Ranking', badge: 'V3' },
  { href: '/pets', icon: Sparkles, label: 'Pets', badge: 'V3' },
  { href: '/stats', icon: BarChart3, label: 'Estatísticas', badge: 'V3' },
  { href: '/profile', icon: User, label: 'Perfil' },
  { href: '/settings', icon: Settings, label: 'Configurações' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 overflow-x-auto">
        <div className="flex items-center h-16 px-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[80px] h-full transition-colors relative',
                  isActive ? 'text-mario-red' : 'text-text-secondary'
                )}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium whitespace-nowrap">{label}</span>
                {badge && (
                  <span className="absolute top-1 right-1 px-1 py-0.5 bg-purple-600 text-white text-[8px] font-bold rounded">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 h-screen w-64 bg-white border-r border-border p-6 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-mario-red">Game Habit</h1>
          <p className="text-xs text-purple-600 font-semibold mt-1">Versão 3.0 🚀</p>
        </div>
        <nav className="space-y-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-quick relative',
                  isActive
                    ? 'bg-mario-red text-white'
                    : 'text-text-secondary hover:bg-background-light'
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
                {badge && (
                  <span className="ml-auto px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
