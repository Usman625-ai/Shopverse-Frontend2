import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { User, Mail, Phone, Lock, MapPin, Plus, Pencil, Trash2, Camera, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import type { User as UserType, Address, ApiResponse } from '../../types';
import { getInitials } from '../../lib/utils';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Field, Modal, Badge } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store';
import { setUser } from '../../store/authSlice';
import EmptyState from '../../components/shop/EmptyState';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [profile, setProfile] = useState<UserType | null>(user);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', contactNumber: user?.contactNumber || '', profileImage: user?.profileImage || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [addrForm, setAddrForm] = useState({ fullName: '', addressLine1: '', city: '', state: '', pincode: '', country: 'Pakistan', phoneNumber: '', defaultAddress: false });

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<UserType>>('/api/customer/profile');
      setProfile(res.data.data);
      setProfileForm({ name: res.data.data.name || '', contactNumber: res.data.data.contactNumber || '', profileImage: res.data.data.profileImage || '' });
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<Address[]>>('/api/customer/addresses');
      setAddresses(res.data.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadProfile(); loadAddresses(); }, [loadProfile, loadAddresses]);

  const saveProfile = async () => {
    if (!profileForm.name.trim()) { toast.error('Name is required'); return; }
    setSavingProfile(true);
    try {
      const res = await api.put<ApiResponse<UserType>>('/api/customer/profile', profileForm);
      setProfile(res.data.data);
      dispatch(setUser(res.data.data));
      toast.success('Profile updated successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to update profile');
    } finally { setSavingProfile(false); }
  };

  const changePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) { toast.error('Please fill all password fields'); return; }
    if (passwordForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    try {
      await api.put('/api/customer/profile', { ...profileForm, currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to change password');
    }
  };

  const resetAddrForm = () => setAddrForm({ fullName: '', addressLine1: '', city: '', state: '', pincode: '', country: 'Pakistan', phoneNumber: '', defaultAddress: false });
  const openAddAddress = () => { setEditingAddress(null); resetAddrForm(); setShowAddressModal(true); };
  const openEditAddress = (addr: Address) => { setEditingAddress(addr); setAddrForm({ fullName: addr.fullName, addressLine1: addr.addressLine1, city: addr.city, state: addr.state, pincode: addr.pincode, country: addr.country, phoneNumber: addr.phoneNumber, defaultAddress: addr.defaultAddress }); setShowAddressModal(true); };

  const saveAddress = async () => {
    if (!addrForm.fullName || !addrForm.addressLine1 || !addrForm.city || !addrForm.phoneNumber) { toast.error('Please fill all required fields'); return; }
    try {
      if (editingAddress) { await api.put(`/api/customer/addresses/${editingAddress.id}`, addrForm); toast.success('Address updated'); }
      else { await api.post('/api/customer/addresses', addrForm); toast.success('Address added'); }
      setShowAddressModal(false);
      loadAddresses();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to save address');
    }
  };

  const deleteAddress = async (id: number) => {
    try { await api.delete(`/api/customer/addresses/${id}`); toast.success('Address deleted'); loadAddresses(); }
    catch { toast.error('Failed to delete address'); }
  };

  const handleRemovePhoto = async () => {
    try {
      await api.put('/api/customer/profile', { ...profileForm, profileImage: '' });
      const updated = profile ? { ...profile, profileImage: '' } : profile;
      setProfile(updated);
      setProfileForm((f) => ({ ...f, profileImage: '' }));
      if (updated) dispatch(setUser(updated));
      toast.success('Profile photo removed');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to remove photo');
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post<ApiResponse<string>>('/api/customer/profile/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.data;
      await api.put('/api/customer/profile', { name: profile?.name, contactNumber: profile?.contactNumber, profileImage: url });
      const updated = profile ? { ...profile, profileImage: url } : profile;
      setProfile(updated);
      setProfileForm((f) => ({ ...f, profileImage: url || '' }));
      if (updated) dispatch(setUser(updated));
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return <div className="space-y-6 pb-8"><div className="h-32 rounded-xl bg-muted animate-pulse" /><div className="grid gap-6 lg:grid-cols-2"><div className="h-64 rounded-xl bg-muted animate-pulse" /><div className="h-64 rounded-xl bg-muted animate-pulse" /></div></div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <h1 className="font-editorial text-3xl font-normal tracking-tight">My Profile</h1>

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">{profile?.profileImage ? <img src={profile.profileImage} alt={profile.name} className="h-full w-full rounded-full object-cover" /> : getInitials(profile?.name || 'U')}</div>
              <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ''; }} />
              <label htmlFor="avatar-input" className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90" title="Change photo">
                {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </label>
              {profile?.profileImage && (
                <button onClick={handleRemovePhoto} className="absolute -bottom-1 -left-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-opacity hover:opacity-90" title="Remove photo">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-editorial text-xl font-medium">{profile?.name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant="default">{profile?.role}</Badge>
                {profile?.verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Unverified</Badge>}
                {profile?.active ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordModal(true)}><Lock className="h-4 w-4" /> Change Password</Button>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Edit Profile */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Full Name" required><div className="relative"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></div></Field>
            <Field label="Email"><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" value={profile?.email || ''} disabled /></div></Field>
            <Field label="Contact Number"><div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" placeholder="03XX-XXXXXXX" value={profileForm.contactNumber} onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })} /></div></Field>
            <Button onClick={saveProfile} loading={savingProfile}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Saved Addresses</CardTitle>
            <Button size="sm" variant="outline" onClick={openAddAddress}><Plus className="h-4 w-4" /> Add</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {addresses.length === 0 ? (
              <EmptyState icon={MapPin} title="No addresses saved" description="Add a shipping address to speed up checkout." actionLabel="Add Address" onAction={openAddAddress} />
            ) : (
              addresses.map((addr) => (
                <motion.div key={addr.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2"><span className="font-medium">{addr.fullName}</span>{addr.defaultAddress && <Badge variant="default">Default</Badge>}</div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditAddress(addr)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteAddress(addr.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{addr.addressLine1}, {addr.city}, {addr.state} {addr.pincode}</p>
                  <p className="text-sm text-muted-foreground">{addr.country} · {addr.phoneNumber}</p>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Password Modal */}
      <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password" description="Enter your current password and a new one" footer={<><Button variant="outline" onClick={() => setShowPasswordModal(false)}>Cancel</Button><Button onClick={changePassword}><Shield className="h-4 w-4" /> Update Password</Button></>}>
        <div className="space-y-4">
          <Field label="Current Password" required>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type={showPasswords.current ? 'text' : 'password'} className="pl-10 pr-10" placeholder="••••••••" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </Field>
          <Field label="New Password" required>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type={showPasswords.new ? 'text' : 'password'} className="pl-10 pr-10" placeholder="••••••••" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </Field>
          <Field label="Confirm New Password" required>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type={showPasswords.confirm ? 'text' : 'password'} className="pl-10 pr-10" placeholder="••••••••" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </Field>
        </div>
      </Modal>

      {/* Address Modal */}
      <Modal open={showAddressModal} onClose={() => setShowAddressModal(false)} title={editingAddress ? 'Edit Address' : 'Add New Address'} size="lg" footer={<><Button variant="outline" onClick={() => setShowAddressModal(false)}>Cancel</Button><Button onClick={saveAddress}>{editingAddress ? 'Update' : 'Add'} Address</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" required><Input placeholder="John Doe" value={addrForm.fullName} onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })} /></Field>
          <Field label="Phone" required><Input placeholder="03XX-XXXXXXX" value={addrForm.phoneNumber} onChange={(e) => setAddrForm({ ...addrForm, phoneNumber: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Street Address" required><Input placeholder="House #, Street, Area" value={addrForm.addressLine1} onChange={(e) => setAddrForm({ ...addrForm, addressLine1: e.target.value })} /></Field></div>
          <Field label="City" required><Input value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} /></Field>
          <Field label="State/Province"><Input value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} /></Field>
          <Field label="Postal Code"><Input value={addrForm.pincode} onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })} /></Field>
          <Field label="Country"><Input value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={addrForm.defaultAddress} onChange={(e) => setAddrForm({ ...addrForm, defaultAddress: e.target.checked })} className="rounded" /> Set as default address</label>
        </div>
      </Modal>
    </div>
  );
}

