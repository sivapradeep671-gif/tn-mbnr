import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

/**
 * TN-MBNR Dual Theme System
 * 
 * Customer Theme ("Aspiration"): For business owners & citizens
 *   - Indigo/Cyan palette, rounded UI, mobile-first wizard flows
 *   - Focus: Speed, clarity, step-by-step guidance
 * 
 * Government Theme ("Decision"): For inspectors, admins, executives
 *   - Navy/Gold palette, dense data tables, desktop-first dashboards
 *   - Focus: Efficiency, oversight, exception-based workflows
 */

type ThemeMode = 'customer' | 'government';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isCustomer: boolean;
  isGovernment: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'government',
  setTheme: () => {},
  isCustomer: false,
  isGovernment: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>('government');

  // Auto-switch theme based on user role
  useEffect(() => {
    if (user) {
      const customerRoles = ['business', 'citizen'];
      const govRoles = ['admin', 'inspector', 'executive', 'scrutiny_officer', 'approver'];
      
      if (customerRoles.includes(user.role)) {
        setTheme('customer');
      } else if (govRoles.includes(user.role)) {
        setTheme('government');
      }
    } else {
      // Default to government theme for the landing page (showcases authority)
      setTheme('government');
    }
  }, [user]);

  // Apply data-theme attribute to document for CSS theming
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      isCustomer: theme === 'customer',
      isGovernment: theme === 'government',
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
