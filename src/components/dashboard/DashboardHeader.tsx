import umbrollLogo from '@/assets/umbroll-logo.png';
import { Calendar, Key, LogOut, Shield, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const DashboardHeader = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <header className="gradient-umbroll px-6 py-4 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={umbrollLogo}
            alt="Umbroll Logo"
            className="h-12 w-auto"
          />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-primary-foreground">Umbroll AI</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-4 py-2 text-primary-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">{today}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{role || 'user'}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/mfa-setup')}>
                <Shield className="h-4 w-4 mr-2" />
                2FA beállítás
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/change-password')}>
                <Key className="h-4 w-4 mr-2" />
                Jelszó változtatás
              </DropdownMenuItem>
              {role === 'admin' && (
                <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                  <User className="h-4 w-4 mr-2" />
                  Felhasználók kezelése
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Kijelentkezés
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
