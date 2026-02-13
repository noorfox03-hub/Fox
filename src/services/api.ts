import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Load, AdminStats, UserRole } from '@/types';

export const api = {
  // --- تسجيل دخول المستخدمين العاديين ---
  async loginByEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // جلب البروفايل والدور
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
    
    return { 
      session: data.session, 
      user: data.user, 
      profile: profile as UserProfile, 
      role: (roleData?.role || 'shipper') as UserRole 
    };
  },

  // --- تسجيل دخول الأدمن (الوظيفة اللي كانت ناقصة) ---
  async loginAdmin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // التأكد أن المستخدم لديه دور admin
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
    
    if (!roleData || roleData.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error("هذا الحساب ليس لديه صلاحيات إدارية.");
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    return { profile: profile as UserProfile, role: 'admin' as UserRole };
  },

  // --- التسجيل والتحقق ---
  async registerUser(email: string, password: string, metadata: any) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: metadata.full_name, phone: metadata.phone, role: metadata.role } }
    });
    if (error) throw error;
    return data;
  },

  async verifyEmailOtp(email: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    if (error) throw error;
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
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
  },

  // --- الشحنات (Loads) ---
  async postLoad(loadData: any, userId: string) {
    const { error } = await supabase.from('loads').insert([{
      owner_id: userId,
      origin: loadData.origin, destination: loadData.destination,
      weight: parseFloat(loadData.weight) || 0,
      price: parseFloat(loadData.price) || 0,
      truck_size: loadData.truck_size, body_type: loadData.body_type,
      description: loadData.description, pickup_date: loadData.pickup_date,
      receiver_name: loadData.receiver_name, receiver_phone: loadData.receiver_phone,
      receiver_address: loadData.receiver_address,
      status: 'available'
    }]);
    if (error) throw error;
  },

  async getUserLoads(userId: string) {
    const { data, error } = await supabase.from('loads')
      .select('*, profiles:owner_id(full_name, phone)')
      .or(`owner_id.eq.${userId},driver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getAllLoads() {
    const { data, error } = await supabase.from('loads')
      .select('*, profiles:owner_id(full_name, phone)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async acceptLoad(loadId: string, driverId: string) {
    const { error } = await supabase.from('loads').update({ status: 'in_progress', driver_id: driverId }).eq('id', loadId);
    if (error) throw error;
  },

  async completeLoad(loadId: string) {
    const { error } = await supabase.from('loads').update({ status: 'completed' }).eq('id', loadId);
    if (error) throw error;
  },

  // --- المستخدمين والأدمن ---
  async getAllUsers() {
    const { data, error } = await supabase.from('profiles').select('*, user_roles(role)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getAdminStats(): Promise<AdminStats> {
    const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).in('status', ['available', 'in_progress']);
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    return { totalUsers: users || 0, totalDrivers: 0, totalShippers: 0, activeLoads: active || 0, completedTrips: completed || 0 };
  },

  // --- الإشعارات ---
  async getNotifications(userId: string) {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async markNotificationsAsRead(userId: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  },

  // --- السائقين ---
  async getAllDrivers() {
    const { data, error } = await supabase.from('driver_details').select('*, profiles(full_name, phone, avatar_url)');
    if (error) throw error;
    return data;
  },

  async getAllSubDrivers() {
    const { data, error } = await supabase.from('sub_drivers').select('*');
    if (error) throw error;
    return data;
  },

  async getDriverStats(userId: string) {
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'in_progress');
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'completed');
    return { activeLoads: active || 0, completedTrips: completed || 0, rating: 4.9 };
  },

  async getShipperStats(userId: string) {
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).in('status', ['available', 'in_progress']);
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).eq('status', 'completed');
    return { activeLoads: active || 0, completedTrips: completed || 0 };
  }
};
