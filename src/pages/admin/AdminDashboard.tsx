import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Users, Package, Truck, CheckCircle, Activity, Bell } from 'lucide-react';
import { AdminStats } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalDrivers: 0, totalShippers: 0, activeLoads: 0, completedTrips: 0 });

  const fetchStats = async () => {
    api.getAdminStats().then(setStats).catch(console.error);
  };

  useEffect(() => {
    fetchStats();

    // مراقبة أي تغيير في الجداول الأساسية لتحديث الأرقام فوراً
    const channel = supabase.channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => fetchStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-black text-slate-800">{t('dashboard')}</h1>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                <Activity size={14} className="animate-pulse" /> مراقبة النظام الحية
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="إجمالي المستخدمين" value={stats.totalUsers} icon={<Users size={24} />} color="primary" />
          <StatCard title="السائقين" value={stats.totalDrivers} icon={<Truck size={24} />} color="accent" />
          <StatCard title="الشاحنين" value={stats.totalShippers} icon={<Package size={24} />} color="secondary" />
          <StatCard title="شحنات نشطة" value={stats.activeLoads} icon={<Bell size={24} />} color="destructive" />
        </div>

        {/* مساحة لإضافة رسوم بيانية مستقبلاً */}
        <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 text-center">
                <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800">النظام يعمل بكفاءة</h3>
                <p className="text-slate-500">يتم مراقبة كافة العمليات وتحديث الإحصائيات لحظياً</p>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
