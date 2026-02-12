import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Package, CheckCircle, Star, Truck, MapPin, CheckCircle2, Navigation, Loader2, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function DriverDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeLoads: 0, completedTrips: 0, rating: 4.8 });
  const [activeLoads, setActiveLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!userProfile?.id) return;
    try {
        const [s, data] = await Promise.all([
            api.getDriverStats(userProfile.id),
            api.getUserLoads(userProfile.id)
        ]);
        setStats(s);
        setActiveLoads(data?.filter((l: any) => l.status === 'in_progress') || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    const sub = supabase.channel('tracking-live').on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => loadData()).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [userProfile]);

  const handleComplete = async (load: any) => {
    try {
      await api.completeLoad(load.id);
      await api.sendNotification(load.owner_id, "تم التوصيل بنجاح", `قام الناقل ${userProfile?.full_name} بتسليم الشحنة في ${load.destination}`);
      toast.success("تم تحديث حالة الشحنة إلى مكتملة");
    } catch (e) { toast.error("حدث خطأ في النظام"); }
  };

  return (
    <AppLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">مرحباً بك، {userProfile?.full_name}</h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">لوحة التحكم والمتابعة</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="الرحلات النشطة" value={stats.activeLoads} icon={<Truck size={20}/>} color="primary" />
          <StatCard title="الرحلات المكتملة" value={stats.completedTrips} icon={<CheckCircle size={20}/>} color="accent" />
          <StatCard title="التقييم العام" value={stats.rating} icon={<Star size={20}/>} color="secondary" />
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-2 border-r-4 border-primary pr-3">
            <h2 className="text-xl font-black text-slate-800">المهام الحالية</h2>
          </div>
          
          <AnimatePresence>
              {activeLoads.map(load => (
                <motion.div key={load.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/40 overflow-hidden bg-white relative">
                    <CardContent className="p-7">
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-5">
                                {/* تم استبدال الأيقونة القديمة بشاحنة بتصميم فخم */}
                                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                                    <Truck size={32} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <p className="font-black text-xl text-slate-800">{load.origin}</p>
                                        <ArrowLeftRight size={16} className="text-slate-300" />
                                        <p className="font-black text-xl text-slate-800">{load.destination}</p>
                                    </div>
                                    <p className="text-xs text-slate-400 font-black tracking-widest uppercase">رقم الشحنة: #{load.id.slice(0, 5)}</p>
                                </div>
                            </div>
                            <div className="bg-blue-50 text-blue-600 font-black text-[10px] px-3 py-1.5 rounded-full border border-blue-100 uppercase">قيد النقل</div>
                        </div>

                        <div className="bg-slate-50 rounded-3xl p-5 mb-6 flex justify-around border border-slate-100">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">الوزن</p>
                                <p className="font-black text-slate-700">{load.weight} طن</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200 my-auto"></div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">الأجرة</p>
                                <p className="font-black text-emerald-600">{load.price} ر.س</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button 
                                className="rounded-2xl h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-md gap-2 shadow-lg shadow-emerald-100" 
                                onClick={() => handleComplete(load)}
                            >
                                <CheckCircle2 size={20}/> إتمام التوصيل
                            </Button>
                            <Button 
                                variant="outline" 
                                className="rounded-2xl h-14 border-slate-200 font-black text-md gap-2 text-slate-600 hover:bg-slate-50" 
                                onClick={() => navigate('/shipper/track')}
                            >
                                <MapPin size={20}/> تتبع المسار
                            </Button>
                        </div>
                    </CardContent>
                    </Card>
                </motion.div>
              ))}
          </AnimatePresence>
          
          {activeLoads.length === 0 && !loading && (
              <div className="py-24 text-center border-2 border-dashed rounded-[3.5rem] bg-white/50 border-slate-200">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck size={32} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-black text-lg">لا توجد رحلات نشطة</p>
                  <p className="text-slate-400 text-sm font-medium">ابدأ الآن بتصفح الشحنات المتاحة في السوق</p>
                  <Button variant="link" onClick={() => navigate('/driver/loads')} className="text-primary font-black mt-4 text-md underline">تصفح الطلبات</Button>
              </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
