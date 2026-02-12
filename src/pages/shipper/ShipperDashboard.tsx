import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Package, CheckCircle, Plus, Truck, User, Phone, Mail, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShipperDashboard() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeLoads: 0, completedTrips: 0 });
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  const fetchInitialData = async () => {
    if (userProfile?.id) {
      api.getShipperStats(userProfile.id).then(setStats).catch(console.error);
      try {
        const driversData = await api.getAllDrivers();
        setDrivers(driversData || []);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      } finally {
        setLoadingDrivers(false);
      }
    }
  };

  useEffect(() => {
    fetchInitialData();

    // تفعيل التحديث الفوري للسائقين
    const channel = supabase
      .channel('public:driver_details')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_details' },
        () => {
          console.log('تغيير في حالة السائقين!');
          api.getAllDrivers().then(data => setDrivers(data || []));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('welcome')}، {userProfile?.full_name}</h1>
          <p className="text-muted-foreground">إليك نظرة عامة على نشاطك اليوم</p>
        </div>

        {/* البطاقات العلوية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title={t('active_loads')} value={stats.activeLoads} icon={<Package size={24} />} color="primary" />
          <StatCard title={t('completed_trips')} value={stats.completedTrips} icon={<CheckCircle size={24} />} color="accent" />
        </div>

        {/* زر نشر شحنة */}
        <Card className="cursor-pointer hover:shadow-lg transition-all border-dashed border-2 border-primary/30 bg-primary/5" onClick={() => navigate('/shipper/post')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl bg-primary text-white"><Plus size={28} /></div>
            <div>
              <p className="font-bold text-lg text-primary">{t('post_load')}</p>
              <p className="text-sm text-muted-foreground">أنشئ شحنة جديدة وابحث عن ناقل متوفر الآن</p>
            </div>
          </CardContent>
        </Card>

        {/* قسم السائقين المتوفرين (Realtime) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Truck className="text-primary" size={24} />
              الناقلون المتاحون الآن
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium bg-green-50 px-2 py-1 rounded-full border border-green-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              تحديث مباشر
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {drivers.map((driver) => (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-primary border-2 border-primary/10">
                          {driver.profiles?.full_name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold leading-none">{driver.profiles?.full_name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{driver.truck_type || 'شاحنة نقل'}</p>
                        </div>
                        <Badge className={driver.is_available ? "bg-green-500" : "bg-gray-400"}>
                          {driver.is_available ? "متاح" : "مشغول"}
                        </Badge>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full text-xs h-9">عرض البيانات والتواصل</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>بيانات الناقل</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col items-center py-6 gap-4">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                                {driver.profiles?.full_name?.charAt(0)}
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold">{driver.profiles?.full_name}</h2>
                                <p className="text-muted-foreground">{driver.truck_type}</p>
                            </div>
                            
                            <div className="w-full space-y-3 mt-4">
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                                    <Phone className="text-primary" size={18} />
                                    <span dir="ltr" className="font-medium">{driver.profiles?.phone || 'غير مسجل'}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                                    <Mail className="text-primary" size={18} />
                                    <span className="font-medium">{driver.profiles?.email}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                                    <Circle className={driver.is_available ? "text-green-500 fill-green-500" : "text-gray-400 fill-gray-400"} size={18} />
                                    <span className="font-medium">الحالة الآن: {driver.is_available ? "مستعد للعمل" : "غير متاح حالياً"}</span>
                                </div>
                            </div>
                            
                            <Button className="w-full mt-2" onClick={() => window.open(`tel:${driver.profiles?.phone}`)}>
                                إتصال هاتفي سريع
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {drivers.length === 0 && !loadingDrivers && (
               <div className="col-span-full py-10 text-center border-2 border-dashed rounded-2xl text-muted-foreground">
                   لا يوجد سائقون مسجلون حالياً
               </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
