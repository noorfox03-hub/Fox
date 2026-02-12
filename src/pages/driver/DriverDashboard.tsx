import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Package, CheckCircle, Star, Truck, MapPin, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';

export default function DriverDashboard() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ activeLoads: 0, completedTrips: 0, rating: 0 });
  const [activeLoads, setActiveLoads] = useState<any[]>([]);
  const [loadingLoads, setLoadingLoads] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // دالة جلب الإحصائيات والشحنات الحالية
  const fetchData = async () => {
    if (!userProfile?.id) return;
    
    // جلب الإحصائيات
    api.getDriverStats(userProfile.id).then(setStats).catch(console.error);
    
    // جلب الشحنات التي قبلها السائق وهي قيد التنفيذ حالياً
    try {
      const data = await api.getUserLoads(userProfile.id);
      const current = (data as any[])?.filter(l => l.status === 'in_progress') || [];
      setActiveLoads(current);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLoads(false);
    }
  };

  useEffect(() => {
    fetchData();

    // تحديث فوري عند حدوث أي تغيير في الشحنات
    const channel = supabase
      .channel('driver-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  // دالة التراجع عن قبول الشحنة (إعادتها للمتاحة)
  const handleReleaseLoad = async (loadId: string) => {
    setIsProcessing(loadId);
    try {
      await api.cancelLoadAssignment(loadId);
      toast.success("تم التراجع عن الشحنة بنجاح وعادت للقائمة العامة");
      // سيتم التحديث تلقائياً عبر الـ Realtime
    } catch (err: any) {
      toast.error("حدث خطأ أثناء التراجع: " + err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('welcome')}، {userProfile?.full_name}</h1>
          <p className="text-muted-foreground">{t('dashboard')}</p>
        </div>

        {/* مربعات الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title={t('active_loads')} value={stats.activeLoads} icon={<Package size={24} />} color="primary" />
          <StatCard title={t('completed_trips')} value={stats.completedTrips} icon={<CheckCircle size={24} />} color="accent" />
          <StatCard title={t('rating')} value={stats.rating} icon={<Star size={24} />} color="secondary" />
        </div>

        {/* أزرار التنقل السريع */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-all border-none bg-primary text-white" onClick={() => navigate('/driver/loads')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-xl bg-white/20"><Package size={28} /></div>
              <div>
                <p className="font-bold text-lg">{t('available_loads')}</p>
                <p className="text-sm opacity-80">ابحث عن حمولة جديدة الآن</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-all border-none bg-slate-800 text-white" onClick={() => navigate('/driver/trucks')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-xl bg-white/10"><Truck size={28} /></div>
              <div>
                <p className="font-bold text-lg">{t('my_trucks')}</p>
                <p className="text-sm opacity-80">إدارة الأسطول والسائقين</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* قسم الشحنات الحالية مع زر الحذف (التراجع) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package className="text-primary" size={22} />
              شحنات قيد التنفيذ حالياً
            </h2>
            {activeLoads.length > 0 && <Badge className="bg-blue-100 text-blue-700">{activeLoads.length}</Badge>}
          </div>

          {loadingLoads ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : activeLoads.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/20">
              <CardContent className="p-10 text-center text-muted-foreground">
                <p>لا توجد شحنات تعمل عليها حالياً</p>
                <Button variant="link" onClick={() => navigate('/driver/loads')} className="text-primary font-bold">تصفح الشحنات المتاحة</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {activeLoads.map((load) => (
                  <motion.div key={load.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <Card className="border-r-4 border-r-blue-500 shadow-sm overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 font-bold text-lg">
                              <MapPin size={18} className="text-primary" />
                              {load.origin} ← {load.destination}
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground font-medium">
                              <span>الوزن: {load.weight} طن</span>
                              <span className="text-green-600">السعر: {load.price} ر.س</span>
                            </div>
                          </div>

                          {/* زر سلة المحذوفات للتراجع عن الشحنة */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-12 w-12 rounded-full">
                                {isProcessing === load.id ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={24} />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="text-destructive" />
                                  إلغاء قبول هذه الشحنة؟
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  عند التراجع، ستعود هذه الشحنة للقائمة العامة ليراها السائقون الآخرون وتختفي من لوحة تحكمك. هل أنت متأكد؟
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel className="rounded-xl">لا، تراجع</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleReleaseLoad(load.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                                >
                                  نعم، أريد إلغاءها
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        
                        <Button className="w-full mt-4 h-9 text-xs bg-slate-100 text-slate-800 hover:bg-slate-200" onClick={() => navigate('/driver/history')}>
                          عرض كامل التفاصيل
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
