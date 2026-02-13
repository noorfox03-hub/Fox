import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Load, AdminStats, UserRole } from '@/types';

export const api = {      
  // --- الإشعارات ---
  async sendNotification(userId: string, title: string, message: string) {
    await supabase.from('notifications').insert([{
      user_id: userId,
      title,   
      message,
      is_read: false
    }]);
  },

  async getNotifications(userId: string) {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
    return data || [];
  },

  // --- قبول الشحنة وإرسال بيانات السائق ---
  async acceptLoad(loadId: string, driverId: string, shipperId: string, driverName: string, driverPhone: string) {
    const { error } = await supabase.from('loads').update({ 
      status: 'in_progress', 
      driver_id: driverId 
    }).eq('id', loadId);
    
    if (error) throw error;
    await this.sendNotification(
      shipperId, 
      "تم قبول شحنتك 🚚", 
      `الناقل ${driverName} قبل طلبك. للتواصل: ${driverPhone}. الشحنة الآن في الطريق.`
    );
  },

  // --- إنهاء الرحلة ---
  async completeLoad(loadId: string, shipperId: string, driverName: string) {
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const { error } = await supabase.from('loads').update({ status: 'completed' }).eq('id', loadId);
    if (error) throw error;
    
    await this.sendNotification(
      shipperId, 
      "وصلت الشحنة ✅", 
      `بشرى سارة! قام الناقل ${driverName} بتسليم الشحنة الساعة ${now}. يمكنك تقييمه الآن.`
    );
  },

  // --- التقييم والدعم ---
  async submitRating(driverId: string, loadId: string, rating: number, comment: string) {
    await supabase.from('ratings').insert([{ rated_user: driverId, load_id: loadId, rating, comment }]);
  },

  async createTicket(userId: string, subject: string, message: string) {
    await supabase.from('support_tickets').insert([{ user_id: userId, subject, message, status: 'open' }]);
  },

  async getTickets() {
    const { data } = await supabase.from('support_tickets').select('*, profiles(full_name)').order('created_at', { ascending: false });
    return data || [];
  },

  // --- الحمولات ---
  async getUserLoads(userId: string) {
    const { data } = await supabase.from('loads').select('*, profiles:owner_id(full_name, phone)').or(`owner_id.eq.${userId},driver_id.eq.${userId}`).order('created_at', { ascending: false });
    return data || [];
  },

  async getAvailableLoads() {
    const { data } = await supabase.from('loads').select('*, profiles:owner_id(full_name, phone, id)').eq('status', 'available').is('driver_id', null);
    return data || [];
  },

  async postLoad(loadData: any, userId: string) {
    const { error } = await supabase.from('loads').insert([{
      owner_id: userId, origin: loadData.origin, destination: loadData.destination,
      weight: parseFloat(loadData.weight), price: parseFloat(loadData.price),
      pickup_date: loadData.pickup_date, receiver_name: loadData.receiver_name,
      receiver_phone: loadData.receiver_phone, receiver_address: loadData.receiver_address,
      status: 'available'
    }]);
    if (error) throw error;
  },

  async getAdminStats(): Promise<AdminStats> {
    const { count: u } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: l } = await supabase.from('loads').select('*', { count: 'exact', head: true }).in('status', ['available', 'in_progress']);
    return { totalUsers: u || 0, totalDrivers: 0, totalShippers: 0, activeLoads: l || 0, completedTrips: 0 };
  }
};
