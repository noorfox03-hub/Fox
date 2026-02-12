import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Package, CheckCircle, Star, Truck, MapPin, CheckCircle2, Navigation, Loader2 } from 'lucide-react';
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
    api.getDriverStats(userProfile.id).then(setStats);
    const data = await api.getUserLoads(userProfile.id);
    setActiveLoads(data?.filter((l: any) => l.status === 'in_progress') || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const sub = supabase.channel('driver-dash').on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => loadData()).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [userProfile]);

  const handleComplete = async (load: any) => {
    try {
      await api.completeLoad(load.id);
      // إرسال إشعار للتاجر
      await api.sendNotification(
          load.owner_id, 
          "تم توصيل شحنتك! ✅", 
          `الناقل ${userProfile?.full_name} قام بتوصيل شحنة ${load.origin} بنجاح.`
      );
      toast.success("تم إنهاء الرحلة بنجاح!");
    } catch (e) { toast.error("حدث خطأ"); }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-black text-slate-800">أهلاً، {userProfile?.full_name}</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="رحلات حالية" value={stats.activeLoads} icon={<Package size={20}/>} color="primary" />
          <StatCard title="إجمالي الرحلات" value={stats.completedTrips} icon={<CheckCircle size={20}/>} color="accent" />
          <StatCard title="تقييمك" value={stats.rating} icon={<Star size={20}/>} color="secondary" />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-2 text-slate-700">
            <Truck className="text-primary" size={24}/> شحنات قيد التنفيذ
          </h2>
          
          <AnimatePresence>
              {activeLoads.map(load => (
                <motion.div key={load.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner"><Navigation size={28}/></div>
                                <div>
                                    <p className="font-black text-xl text-slate-800">{load.origin} ← {load.destination}</p>
                                    <p className="text-sm text-slate-400 font-bold">{load.weight} طن • {load.price} ر.س</p>
                                </div>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1 rounded-lg">جاري العمل</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button className="rounded-[1.2rem] h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-md gap-2" onClick={() => handleComplete(load)}>
                                <CheckCircle2 size={20}/> تم التوصيل
                            </Button>
                            <Button variant="outline" className="rounded-[1.2rem] h-14 border-slate-200 font-black text-md gap-2 text-slate-600" onClick={() => navigate('/shipper/track')}>
                                <MapPin size={20}/> تتبع المسار
                            </Button>
                        </div>
                    </CardContent>
                    </Card>
                </motion.div>
              ))}
          </AnimatePresence>
          
          {activeLoads.length === 0 && !loading && (
              <div className="py-20 text-center border-2 border-dashed rounded-[3rem] bg-slate-50">
                  <p className="text-slate-400 font-bold">لا توجد رحلات نشطة حالياً</p>
                  <Button variant="link" onClick={() => navigate('/driver/loads')} className="text-primary font-black mt-2">تصفح الحمولات المتاحة</Button>
              </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
