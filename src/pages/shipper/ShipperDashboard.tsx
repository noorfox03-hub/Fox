import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, CheckCircle, Navigation, ShieldCheck, ArrowUpRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // السطر المصلح

export default function ShipperDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [pendingRating, setPendingRating] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!userProfile?.id) return;
    try {
      const [s, loads] = await Promise.all([
        api.getAdminStats(),
        api.getUserLoads(userProfile.id)
      ]);
      setStats(s);
      // عرض الشحنات المكتملة التي لم يتم تقييمها بعد
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
      await api.submitRating(driverId, loadId, rating, "تقييم من التاجر");
      toast.success("شكراً لك! تم إرسال التقييم بنجاح.");
      setPendingRating(prev => prev.filter(l => l.id !== loadId));
    } catch (e) {
      toast.error("فشل إرسال التقييم");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-10 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Mission Control</h1>
            <p className="text-slate-500 font-medium mt-1">أهلاً بك {userProfile?.full_name}، شحناتك تحت السيطرة.</p>
          </div>
          <Button onClick={() => window.location.href='/shipper/post'} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-16 px-8 font-black text-lg shadow-xl shadow-blue-500/20 gap-3">
            نشر شحنة جديدة
          </Button>
        </div>

        {pendingRating.length > 0 && (
          <div className="space-y-4 animate-in fade-in duration-700">
            <h2 className="text-xl font-black text-blue-600 flex items-center gap-2 italic">
               <Star size={22} className="fill-blue-600" /> تقييمات معلقة
            </h2>
            <div className="grid gap-4">
              {pendingRating.map(load => (
                <Card key={load.id} className="rounded-[2.5rem] border-2 border-blue-100 bg-white p-8 shadow-xl">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-800">وصلت شحنتك من {load.origin}</p>
                      <p className="text-sm text-slate-400 font-bold">يرجى تقييم السائق: {load.profiles?.full_name || 'ناقل معتمد'}</p>
                    </div>
                    <div className="flex gap-2">
                       {[1, 2, 3, 4, 5].map(num => (
                         <button key={num} onClick={() => handleRate(load.driver_id, load.id, num)} className="p-2 hover:scale-125 transition-all text-amber-400">
                            <Star size={35} fill={num <= 4 ? "currentColor" : "none"} />
                         </button>
                       ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'شحنات نشطة', value: stats?.activeLoads || 0, icon: <Navigation />, color: 'bg-blue-600' },
            { label: 'تم توصيلها', value: stats?.completedTrips || 0, icon: <CheckCircle />, color: 'bg-emerald-500' },
            { label: 'معدل الأمان', value: "100%", icon: <ShieldCheck />, color: 'bg-slate-900' }
          ].map((s, i) => (
            <Card key={i} className="rounded-[2.5rem] border-none p-8 bg-white shadow-sm relative overflow-hidden group">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg", s.color)}>
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
