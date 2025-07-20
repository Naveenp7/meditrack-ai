import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { PaletteMode, Theme } from '@mui/material';

type ThemeContextType = {
  mode: PaletteMode;
  toggleTheme: () => void;
  theme: Theme;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Check if user has a theme preference stored in localStorage
  const storedTheme = localStorage.getItem('theme') as PaletteMode | null;
  const [mode, setMode] = useState<PaletteMode>(storedTheme || 'light');

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('theme', mode);
  }, [mode]);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Create theme based on current mode
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#3f51b5',
        light: '#757de8',
        dark: '#002984',
      },
      secondary: {
        main: '#f50057',
        light: '#ff4081',
        dark: '#c51162',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 500,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0px 4px 20px rgba(0, 0, 0, 0.05)' 
              : '0px 4px 20px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};