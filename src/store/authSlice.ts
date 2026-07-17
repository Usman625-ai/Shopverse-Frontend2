import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../lib/api';
import type { User, AuthResponse, ApiResponse } from '../types';
import { storage } from '../lib/utils';

interface AuthState { user: User | null; isAuthenticated: boolean; isLoading: boolean; error: string | null; }
const initialState: AuthState = {
  user: storage.get('user') || null, isAuthenticated: !!storage.get('accessToken'), isLoading: false, error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', credentials);
      const d = response.data.data;
      const user: User = {
        id: d.userId, name: d.name, email: d.email, role: d.role,
        active: true, verified: d.verified, createdAt: new Date().toISOString(),
      };
      storage.set('accessToken', d.accessToken);
      storage.set('refreshToken', d.refreshToken);
      storage.set('user', user);
      return user;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: { name: string; email: string; password: string; role: string; shopName?: string; contactNumber?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<null>>('/api/auth/register', data);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Registration failed');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (data: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/verify-email', data);
      const d = response.data.data;
      if (d && d.accessToken) {
        const user: User = {
          id: d.userId, name: d.name, email: d.email, role: d.role,
          active: true, verified: true, createdAt: new Date().toISOString(),
        };
        storage.set('accessToken', d.accessToken);
        storage.set('refreshToken', d.refreshToken);
        storage.set('user', user);
        return user;
      }
      return null;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Verification failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/api/auth/logout'); } catch {}
  storage.remove('accessToken'); storage.remove('refreshToken'); storage.remove('user');
});

const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: { clearError: (s) => { s.error = null; }, setUser: (s, a: PayloadAction<User>) => { s.user = a.payload; s.isAuthenticated = true; } },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.isLoading = false; s.user = a.payload; s.isAuthenticated = true; })
      .addCase(login.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; })
      .addCase(register.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(register.fulfilled, (s) => { s.isLoading = false; })
      .addCase(register.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; })
      .addCase(verifyEmail.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(verifyEmail.fulfilled, (s, a) => {
        s.isLoading = false;
        if (a.payload) { s.user = a.payload; s.isAuthenticated = true; }
      })
      .addCase(verifyEmail.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; })
      .addCase(logout.fulfilled, (s) => { s.user = null; s.isAuthenticated = false; });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
