import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Package, CheckCircle, Plus, Truck, Phone, UserCheck, ShieldCheck, UserPlus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  const [allDrivers, setAllDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!userProfile?.id) return;
    try {
      // جلب الإحصائيات
      api.getShipperStats(userProfile.id).then(setStats).catch(() => {});

      // جلب السائقين الأساسيين
      const mainDriversData = await api.getAllDrivers().catch(() => []);
      const mainMapped = (mainDriversData || []).map((d: any) => ({
        id: d.id,
        name: d.profiles?.full_name || 'ناقل مسجل',
        phone: d.profiles?.phone || '',
        type: 'main',
        truck: d.truck_type || 'ناقل معتمد',
      }));

      // جلب السائقين الفرعيين
      const subDriversData = await api.getAllSubDrivers().catch(() => []);
      const subMapped = (subDriversData || []).map((d: any) => ({
        id: d.id,
        name: d.driver_name || 'سائق فرعي',
        phone: d.driver_phone || '',
        type: 'sub',
        truck: 'سائق فرعي معتمد',
      }));

      // دمج القائمتين
      setAllDrivers([...mainMapped, ...subMapped]);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // التحديث الفوري للجداول
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_details' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sub_drivers' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">مرحباً بك، {userProfile?.full_name}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title={t('active_loads')} value={stats.activeLoads} icon={<Package size={24} />} color="primary" />
          <StatCard title={t('completed_trips')} value={stats.completedTrips} icon={<CheckCircle size={24} />} color="accent" />
        </div>

        <Card className="cursor-pointer hover:shadow-lg transition-all border-dashed border-2 border-primary/40 bg-primary/5" onClick={() => navigate('/shipper/post')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl bg-primary text-white"><Plus size={28} /></div>
            <div>
              <p className="font-bold text-lg text-primary">{t('post_load')}</p>
              <p className="text-sm text-muted-foreground">انشر طلبك وشاهد السائقين المتاحين</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">الناقلون النشطون الآن</h2>
            <Badge variant="outline" className="text-green-600 bg-green-50 animate-pulse">تحديث فوري نشط</Badge>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : allDrivers.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed rounded-2xl text-muted-foreground">
               لا يوجد سائقون متاحون حالياً
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {allDrivers.map((driver) => (
                  <motion.div key={driver.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className={`relative overflow-hidden border-r-4 ${driver.type === 'main' ? 'border-r-green-500' : 'border-r-blue-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${driver.type === 'main' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {driver.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <h3 className="font-bold text-sm truncate">{driver.name}</h3>
                                {driver.type === 'main' ? <ShieldCheck size={14} className="text-green-600" /> : <UserPlus size={14} className="text-blue-600" />}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{driver.truck}</p>
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full mt-4 h-8 text-xs font-bold">عرض بيانات التواصل</Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-3xl">
                            <DialogHeader><DialogTitle className="text-center">بيانات التواصل</DialogTitle></DialogHeader>
                            <div className="flex flex-col items-center py-4 gap-4">
                                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-3xl font-black text-primary">
                                    {driver.name.charAt(0)}
                                </div>
                                <div className="text-center">
                                    <h2 className="text-xl font-black">{driver.name}</h2>
                                    <Badge className={driver.type === 'main' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                                        {driver.type === 'main' ? 'ناقل أساسي' : 'سائق فرعي'}
                                    </Badge>
                                </div>
                                <div className="w-full space-y-3">
                                    <Button className="w-full h-12 rounded-xl bg-green-600 font-bold" onClick={() => window.open(`https://wa.me/${driver.phone?.replace(/^0/, '966')}`)}>واتساب</Button>
                                    <Button variant="outline" className="w-full h-12 rounded-xl font-bold" onClick={() => window.open(`tel:${driver.phone}`)}>إتصال هاتفي</Button>
                                </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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
