import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (role !== 'admin') return <Navigate to="/" replace />;

  return <>{children}</>;
};
