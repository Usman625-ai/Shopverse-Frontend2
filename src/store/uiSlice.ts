import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark';
interface UIState { theme: Theme; sidebarCollapsed: boolean; mobileSidebarOpen: boolean; }

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
};
const applyTheme = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }
};
const initialState: UIState = { theme: getInitialTheme(), sidebarCollapsed: false, mobileSidebarOpen: false };
if (typeof window !== 'undefined') applyTheme(initialState.theme);

const uiSlice = createSlice({
  name: 'ui', initialState,
  reducers: {
    toggleTheme: (s) => { s.theme = s.theme === 'light' ? 'dark' : 'light'; applyTheme(s.theme); },
    setTheme: (s, a: PayloadAction<Theme>) => { s.theme = a.payload; applyTheme(s.theme); },
    toggleSidebar: (s) => { s.sidebarCollapsed = !s.sidebarCollapsed; },
    toggleMobileSidebar: (s) => { s.mobileSidebarOpen = !s.mobileSidebarOpen; },
    closeMobileSidebar: (s) => { s.mobileSidebarOpen = false; },
  },
});

export const { toggleTheme, setTheme, toggleSidebar, toggleMobileSidebar, closeMobileSidebar } = uiSlice.actions;
export default uiSlice.reducer;
