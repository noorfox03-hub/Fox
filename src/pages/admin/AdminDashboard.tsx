import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Users, Truck, Package, ShieldCheck, Activity } from 'lucide-react';
import { AdminStats } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.getAdminStats().then(setStats);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">Global Monitoring</h1>
            <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full font-black text-[10px] flex items-center gap-2 border border-emerald-100 uppercase tracking-widest">
                <Activity size={14} className="animate-pulse" /> Live Status: Operational
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="إجمالي المستخدمين" value={stats?.totalUsers || 0} icon={<Users size={24} />} color="primary" />
          <StatCard title="الشحنات النشطة" value={stats?.activeLoads || 0} icon={<Package size={24} />} color="accent" />
          <StatCard title="الرحلات المكتملة" value={stats?.completedTrips || 0} icon={<ShieldCheck size={24} />} color="secondary" />
          <StatCard title="الشكاوى والبلاغات" value={0} icon={<Activity size={24} />} color="destructive" />
        </div>

        <div className="bg-slate-900 p-16 rounded-[3rem] text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
            <ShieldCheck size={60} className="mx-auto text-blue-500 mb-6" />
            <h2 className="text-3xl font-black italic mb-4 tracking-tight">System Integrity Secured</h2>
            <p className="text-slate-400 font-bold max-w-xl mx-auto leading-relaxed">تتم مراقبة كافة العمليات اللوجستية والتحركات المالية لحظة بلحظة لضمان جودة الخدمة المقدمة عبر منصة SAS.</p>
        </div>
      </div>
    </AppLayout>
  );
}
