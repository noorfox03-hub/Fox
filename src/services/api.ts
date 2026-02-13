import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Load, AdminStats, UserRole, Truck, SubDriver } from '@/types';

export const api = {
  // ==========================================
  // 1. المصادقة والملف الشخصي (Auth & Profiles)
  // ==========================================
  
  async loginByEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
    
    return { 
      session: data.session, 
      user: data.user, 
      profile: profile as UserProfile, 
      role: (roleData?.role || 'shipper') as UserRole 
    };
  },

  async loginAdmin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
    if (!roleData || roleData.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error("عذراً، هذا الحساب لا يملك صلاحيات المسؤول (Admin).");
    }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    return { profile: profile as UserProfile, role: 'admin' as UserRole };
  },

  async registerUser(email: string, password: string, metadata: { full_name: string, phone: string, role: UserRole }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: metadata.full_name, phone: metadata.phone } }
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from('user_roles').insert([{ user_id: data.user.id, role: metadata.role }]);
      await supabase.from('profiles').insert([{ 
        id: data.user.id, 
        full_name: metadata.full_name, 
        phone: metadata.phone,
        email: email 
      }]);
    }
    return data;
  },

  async verifyEmailOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    if (error) throw error;
    return data;
  },

  async resendOtp(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  },

  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  },

  async getProfileSettings() {
    return { allow_email_edit: true, notifications_enabled: true };
  },

  // ==========================================
  // 2. إدارة الشحنات (Loads)
  // ==========================================

  async postLoad(loadData: any, userId: string) {
    const { error } = await supabase.from('loads').insert([{
      owner_id: userId,
      origin: loadData.origin,
      destination: loadData.destination,
      weight: parseFloat(loadData.weight) || 0,
      price: parseFloat(loadData.price) || 0,
      body_type: loadData.body_type || 'flatbed',
      description: loadData.description || '',
      pickup_date: loadData.pickup_date,
      receiver_name: loadData.receiver_name,
      receiver_phone: loadData.receiver_phone,
      receiver_address: loadData.receiver_address,
      status: 'available'
    }]);
    if (error) throw error;
  },

  // الدالة التي كانت تسبب الخطأ الأخير
  async getAvailableLoads() {
    const { data, error } = await supabase.from('loads')
      .select('*, profiles:owner_id(full_name, phone)')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getUserLoads(userId: string) {
    const { data, error } = await supabase.from('loads')
      .select('*, profiles:owner_id(full_name, phone)')
      .or(`owner_id.eq.${userId},driver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAllLoads() {
    const { data, error } = await supabase.from('loads')
      .select('*, profiles:owner_id(full_name, phone)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async acceptLoad(loadId: string, driverId: string) {
    const { error } = await supabase.from('loads').update({ status: 'in_progress', driver_id: driverId }).eq('id', loadId);
    if (error) throw error;
  },

  async completeLoad(loadId: string) {
    const { error } = await supabase.from('loads').update({ status: 'completed' }).eq('id', loadId);
    if (error) throw error;
  },

  async cancelLoadAssignment(loadId: string) {
    const { error } = await supabase.from('loads').update({ status: 'available', driver_id: null }).eq('id', loadId);
    if (error) throw error;
  },

  // ==========================================
  // 3. إدارة الأسطول (Trucks & Drivers)
  // ==========================================

  async getTrucks(ownerId: string) {
    const { data, error } = await supabase.from('trucks').select('*').eq('owner_id', ownerId);
    if (error) throw error;
    return data as Truck[];
  },

  async addTruck(truckData: any, ownerId: string) {
    const { error } = await supabase.from('trucks').insert([{ ...truckData, owner_id: ownerId }]);
    if (error) throw error;
  },

  async deleteTruck(id: string) {
    const { error } = await supabase.from('trucks').delete().eq('id', id);
    if (error) throw error;
  },

  async getSubDrivers(carrierId: string) {
    const { data, error } = await supabase.from('sub_drivers').select('*').eq('carrier_id', carrierId);
    if (error) throw error;
    return data as SubDriver[];
  },

  async addSubDriver(driverData: any, carrierId: string) {
    const { error } = await supabase.from('sub_drivers').insert([{ ...driverData, carrier_id: carrierId }]);
    if (error) throw error;
  },

  async deleteSubDriver(id: string) {
    const { error } = await supabase.from('sub_drivers').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // 4. الإشعارات (Notifications)
  // ==========================================

  async getNotifications(userId: string) {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    return data || [];
  },

  async markNotificationsAsRead(userId: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  },

  // ==========================================
  // 5. الإحصائيات (Stats)
  // ==========================================

  async getDashboardStats() {
    return { active: 0, completed: 0, safety_rate: "100%" };
  },

  async getAdminStats(): Promise<AdminStats> {
    const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).in('status', ['available', 'in_progress']);
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    return { totalUsers: users || 0, totalDrivers: 0, totalShippers: 0, activeLoads: active || 0, completedTrips: completed || 0 };
  },

  async getDriverStats(userId: string) {
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'in_progress');
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'completed');
    return { activeLoads: active || 0, completedTrips: completed || 0, rating: 5.0 };
  },

  async getAllUsers() {
    const { data, error } = await supabase.from('profiles').select('*, user_roles(role)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAllDrivers() {
    const { data, error } = await supabase.from('driver_details').select('*, profiles(full_name, phone, avatar_url)');
    if (error) throw error;
    return data || [];
  },

  async getTickets() {
    const { data, error } = await supabase.from('support_tickets').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async uploadFile(path: string, file: File) {
    const { data, error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(data.path);
    return publicUrl;
  }
};
