import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, CheckCircle, Navigation, ShieldCheck, ArrowUpRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ShipperDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [pendingRating, setPendingRating] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!userProfile?.id) return;
    try {
      const [s, loads] = await Promise.all([
        api.getAdminStats(), // لجلب أرقام عامة
        api.getUserLoads(userProfile.id)
      ]);
      setStats(s);
      // تصفية الشحنات التي اكتملت ولم يتم تقييمها (مبدئياً كل المكتملة تظهر هنا)
      setPendingRating(loads.filter((l: any) => l.status === 'completed'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userProfile]);

  const handleRate = async (driverId: string, loadId: string, rating: number) => {
    try {
      await api.submitRating(driverId, loadId, rating, "خدمة ممتازة من الناقل");
      toast.success("تم إرسال تقييمك بنجاح، شكراً لك!");
      setPendingRating(prev => prev.filter(l => l.id !== loadId));
    } catch (e) {
      toast.error("حدث خطأ أثناء التقييم");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-10 pb-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Shipper Control</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">إدارة العمليات والتقييمات</p>
        </div>

        {/* نظام التقييم الفوري للشحنات الواصلة */}
        {pendingRating.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <h2 className="text-xl font-black text-blue-600 flex items-center gap-2">
               <Star size={22} className="fill-blue-600" /> شحنات وصلت وجهتها (قيم الناقل الآن)
            </h2>
            <div className="grid gap-4">
              {pendingRating.map(load => (
                <Card key={load.id} className="rounded-[2.5rem] border-2 border-blue-100 bg-white p-8 shadow-xl shadow-blue-500/5">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-right">
                      <p className="text-lg font-black text-slate-800">وصلت البضاعة من {load.origin}</p>
                      <p className="text-sm text-slate-400 font-bold">الناقل: {load.profiles?.full_name || 'سائق معتمد'}</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اختر عدد النجوم</p>
                       <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(num => (
                            <button key={num} onClick={() => handleRate(load.driver_id, load.id, num)} className="p-2 hover:scale-125 transition-all text-amber-400">
                               <Star size={32} fill={num <= 4 ? "currentColor" : "none"} strokeWidth={2} />
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'شحنات قيد النقل', value: stats?.activeLoads || 0, icon: <Navigation />, color: 'bg-blue-600' },
            { label: 'تم تسليمها', value: stats?.completedTrips || 0, icon: <CheckCircle />, color: 'bg-emerald-500' },
            { label: 'معدل الأمان', value: "100%", icon: <ShieldCheck />, color: 'bg-slate-900' }
          ].map((s, i) => (
            <Card key={i} className="rounded-[2.5rem] border-none p-8 bg-white shadow-sm relative overflow-hidden group">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6", s.color)}>
                {s.icon}
              </div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{s.label}</p>
              <p className="text-4xl font-black text-slate-900 mt-1">{s.value}</p>
              <ArrowUpRight className="absolute top-8 end-8 text-slate-100 group-hover:text-blue-500 transition-colors" />
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
