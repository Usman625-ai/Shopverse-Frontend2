import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';
import type { Cart, ApiResponse, CartItem } from '../types';

interface CartState { cart: Cart | null; isLoading: boolean; error: string | null; itemCount: number; }
const initialState: CartState = { cart: null, isLoading: false, error: null, itemCount: 0 };

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try { const r = await api.get<ApiResponse<Cart>>('/api/customer/cart'); return r.data.data; }
  catch (e: unknown) { const err = e as { response?: { data?: { error?: string } } }; return rejectWithValue(err.response?.data?.error || 'Failed to fetch cart'); }
});
export const addToCart = createAsyncThunk('cart/add', async (d: { productId: number; quantity: number }, { rejectWithValue }) => {
  try { const r = await api.post<ApiResponse<CartItem>>('/api/customer/cart', d); return r.data.data; }
  catch (e: unknown) { const err = e as { response?: { data?: { error?: string } } }; return rejectWithValue(err.response?.data?.error || 'Failed to add to cart'); }
});
export const updateCartItem = createAsyncThunk('cart/update', async ({ itemId, quantity }: { itemId: number; quantity: number }, { rejectWithValue }) => {
  try { const r = await api.put<ApiResponse<CartItem>>(`/api/customer/cart/${itemId}`, null, { params: { quantity } }); return r.data.data; }
  catch (e: unknown) { const err = e as { response?: { data?: { error?: string } } }; return rejectWithValue(err.response?.data?.error || 'Failed to update cart'); }
});
export const removeFromCart = createAsyncThunk('cart/remove', async (itemId: number, { rejectWithValue }) => {
  try { await api.delete(`/api/customer/cart/${itemId}`); return itemId; }
  catch (e: unknown) { const err = e as { response?: { data?: { error?: string } } }; return rejectWithValue(err.response?.data?.error || 'Failed to remove item'); }
});
export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try { await api.delete('/api/customer/cart/clear'); return true; }
  catch (e: unknown) { const err = e as { response?: { data?: { error?: string } } }; return rejectWithValue(err.response?.data?.error || 'Failed to clear cart'); }
});

const cartSlice = createSlice({
  name: 'cart', initialState,
  reducers: { setLocalItemCount: (s, a: { payload: number }) => { s.itemCount = a.payload; } },
  extraReducers: (b) => {
    b.addCase(fetchCart.pending, (s) => { s.isLoading = true; })
      .addCase(fetchCart.fulfilled, (s, a) => { s.isLoading = false; s.cart = a.payload; s.itemCount = a.payload?.items?.length || 0; })
      .addCase(fetchCart.rejected, (s) => { s.isLoading = false; })
      .addCase(addToCart.fulfilled, (s) => { s.itemCount += 1; })
      .addCase(removeFromCart.fulfilled, (s, a) => { if (s.cart) { s.cart.items = s.cart.items.filter((i) => i.id !== a.payload); s.itemCount = s.cart.items.length; } })
      .addCase(clearCart.fulfilled, (s) => { s.cart = null; s.itemCount = 0; });
  },
});

export const { setLocalItemCount } = cartSlice.actions;
export default cartSlice.reducer;
