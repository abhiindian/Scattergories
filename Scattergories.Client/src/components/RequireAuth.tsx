import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useIsAuthenticated } from '../context/AuthContext';

interface RequireAuthProps {
  /** If true, redirect to login when unauthenticated. If false, redirect to home. */
  redirectHomeInstead?: boolean;
  /** Children to render when authenticated. */
  children?: ReactNode;
}

/**
 * Route guard that requires authentication.
 * When children are provided, renders them directly.
 * When no children, renders an Outlet for nested routes.
 */
export function RequireAuth({ redirectHomeInstead = false, children }: RequireAuthProps) {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  if (!isAuthenticated) {
    if (redirectHomeInstead) {
      return <Navigate to="/" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If children provided, render them directly (e.g. AuthProvider + layout)
  // Otherwise, use Outlet for nested route matching
  return children ?? <Outlet />;
}

/**
 * Redirect authenticated users away from auth pages.
 * Used on Login page to send already-authenticated users home.
 */
export function RedirectAuthenticated({ fallback = '/' }: { fallback?: string }) {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated) {
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
