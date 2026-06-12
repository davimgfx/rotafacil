// src/components/BottomNav.tsx
import { NavLink } from 'react-router-dom';
import { Home, Map, Bell, User, type LucideIcon } from 'lucide-react';

interface NavItemConfig {
  to: string;
  icon: LucideIcon;
  label: string;
}

const navItems: NavItemConfig[] = [
  { to: '/option', icon: Home, label: 'Início' },
  { to: '/rotas', icon: Map, label: 'Rotas' },
  { to: '/notificacoes', icon: Bell, label: 'Notificações' },
  { to: '/perfil', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-[#0E0E16] border-t border-white/5 flex items-center justify-around py-2.5">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-2 transition ${
              isActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
            }`
          }>
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
