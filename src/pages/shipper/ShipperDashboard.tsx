import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { 
  Package, CheckCircle, Plus, Bell, Loader2, 
  ShieldCheck, UserPlus, Phone, MessageSquare, 
  Truck, LayoutDashboard 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';

export default function ShipperDashboard() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ activeLoads: 0, completedTrips: 0 });
  const [allDrivers, setAllDrivers] = useState<any[]>([]);
  const [myLoads, setMyLoads] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!userProfile?.id) return;
    try {
      const [s, loads, notifs, mainDriversData, subDriversData] = await Promise.all([
        api.getShipperStats(userProfile.id).catch(() => ({ activeLoads: 0, completedTrips: 0 })),
        api.getUserLoads(userProfile.id).catch(() => []),
        api.getNotifications(userProfile.id).catch(() => []),
        api.getAllDrivers().catch(() => []),
        api.getAllSubDrivers().catch(() => [])
      ]);

      setStats(s);
      setMyLoads(loads || []);
      setNotifications(notifs || []);

      // معالجة بيانات السائقين
      const mainMapped = (mainDriversData || []).map((d: any) => ({
        id: d.id,
        name: d.profiles?.full_name || 'ناقل مسجل',
        phone: d.profiles?.phone || '',
        type: 'main',
        truck: d.truck_type || 'ناقل معتمد',
      }));

      const subMapped = (subDriversData || []).map((d: any) => ({
        id: d.id,
        name: d.driver_name || 'سائق فرعي',
        phone: d.driver_phone || '',
        type: 'sub',
        truck: 'سائق فرعي معتمد',
      }));

      setAllDrivers([...mainMapped, ...subMapped]);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // القنوات الموحدة للتحديث الفوري
    const channel = supabase.channel('shipper-dashboard-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_details' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sub_drivers' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => fetchData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile?.id}` }, (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async () => {
    if (userProfile?.id) {
      await api.markNotificationsAsRead(userProfile.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-20">
        
        {/* Header Section */}
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-black text-slate-800">أهلاً، {userProfile?.full_name?.split(' ')[0]}</h1>
                <p className="text-sm text-muted-foreground italic">إليك آخر مستجدات طلبات الشحن الخاصة بك</p>
            </div>
            
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="relative shadow-sm rounded-2xl h-12 w-12 bg-white">
                        <Bell size={22} className="text-slate-600" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 rounded-3xl overflow-hidden border-none shadow-2xl" align="end">
                    <div className="bg-primary p-4 text-white font-bold flex justify-between items-center">
                        <span className="flex items-center gap-2"><Bell size={16}/> الإشعارات</span>
                        <Button variant="ghost" size="sm" className="text-white/80 hover:text-white text-xs h-7 px-2" onClick={handleMarkAsRead}>تحديد الكل كمقروء</Button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto bg-white">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div key={n.id} className={`p-4 border-b last:border-0 transition-colors ${!n.is_read ? 'bg-blue-50/40' : 'opacity-70'}`}>
                                    <p className="font-bold text-sm text-slate-800">{n.title}</p>
                                    <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                                    <p className="text-[9px] text-slate-400 mt-2 flex items-center gap-1">
                                        <CheckCircle size={10} /> {new Date(n.created_at).toLocaleTimeString('ar-SA')}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center text-slate-400 text-sm">لا توجد إشعارات حالياً</div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard title={t('active_loads')} value={stats.activeLoads} icon={<Package size={20} />} color="primary" />
          <StatCard title={t('completed_trips')} value={stats.completedTrips} icon={<CheckCircle size={20} />} color="accent" />
        </div>

        {/* Action Button */}
        <Card className="cursor-pointer hover:shadow-xl transition-all border-dashed border-2 border-primary/40 bg-gradient-to-l from-primary/5 to-transparent overflow-hidden group" onClick={() => navigate('/shipper/post')}>
          <CardContent className="flex items-center gap-4 p-6 relative">
            <div className="p-3 rounded-2xl bg-primary text-white shadow-lg group-hover:scale-110 transition-transform"><Plus size={28} /></div>
            <div>
              <p className="font-bold text-lg text-primary leading-none mb-1">{t('post_load')}</p>
              <p className="text-xs text-muted-foreground">قم بإضافة طلب شحن جديد ليتلقى السائقون عروضهم</p>
            </div>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-10">
                <Truck size={60} />
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="drivers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-2xl h-12">
            <TabsTrigger value="drivers" className="rounded-xl font-bold">الناقلون المتاحون</TabsTrigger>
            <TabsTrigger value="my-loads" className="rounded-xl font-bold">حمولاتي</TabsTrigger>
          </TabsList>

          <TabsContent value="drivers" className="mt-6">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    الناقلون النشطون الآن
                </h2>
                <Badge variant="outline" className="text-xs font-normal">تحديث تلقائي</Badge>
            </div>
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <p className="text-sm text-muted-foreground italic">جاري البحث عن ناقلين...</p>
                </div>
            ) : allDrivers.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed rounded-3xl text-muted-foreground bg-slate-50/50">
                    <Truck className="mx-auto mb-3 opacity-20" size={48} />
                    <p>لا يوجد سائقون متاحون في منطقتك حالياً</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                    {allDrivers.map((driver, idx) => (
                    <motion.div 
                        key={driver.id} 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <Card className={`relative overflow-hidden border-r-4 hover:shadow-md transition-shadow ${driver.type === 'main' ? 'border-r-emerald-500' : 'border-r-sky-500'}`}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${driver.type === 'main' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                                {driver.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-bold text-sm truncate">{driver.name}</h3>
                                    {driver.type === 'main' ? <ShieldCheck size={14} className="text-emerald-600" /> : <UserPlus size={14} className="text-sky-600" />}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                    <Truck size={10} /> {driver.truck}
                                </p>
                            </div>
                            </div>

                            <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="secondary" className="w-full mt-4 h-9 text-xs font-bold rounded-xl">عرض بيانات التواصل</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md rounded-[2rem]">
                                <DialogHeader>
                                    <DialogTitle className="text-center font-black">ملف الناقل</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col items-center py-6 gap-5">
                                    <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-inner ${driver.type === 'main' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                                        {driver.name.charAt(0)}
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-2xl font-black text-slate-800">{driver.name}</h2>
                                        <div className="flex justify-center mt-2">
                                            <Badge className={driver.type === 'main' ? "bg-emerald-500" : "bg-sky-500"}>
                                                {driver.type === 'main' ? 'ناقل أساسي معتمد' : 'سائق فرعي نشط'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="w-full grid grid-cols-1 gap-3 px-4">
                                        <Button 
                                            className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold text-lg gap-2" 
                                            onClick={() => window.open(`https://wa.me/${driver.phone?.replace(/^0/, '966')}`)}
                                        >
                                            <MessageSquare size={20} /> واتساب
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="w-full h-14 rounded-2xl font-bold text-lg gap-2 border-2" 
                                            onClick={() => window.open(`tel:${driver.phone}`)}
                                        >
                                            <Phone size={20} /> إتصال هاتفي
                                        </Button>
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
          </TabsContent>

          <TabsContent value="my-loads" className="mt-6">
             {myLoads.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed rounded-3xl text-muted-foreground">
                    <Package className="mx-auto mb-3 opacity-20" size={48} />
                    <p>لم تقم بنشر أي حمولات بعد</p>
                    <Button variant="link" onClick={() => navigate('/shipper/post')}>انشر أول حمولة الآن</Button>
                </div>
             ) : (
                <div className="space-y-4">
                    {myLoads.map((load) => (
                        <Card key={load.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-800">{load.pickup_city} ← {load.delivery_city}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">نوع الشاحنة: {load.truck_type}</p>
                                    </div>
                                    <Badge variant={load.status === 'completed' ? 'secondary' : 'default'}>
                                        {load.status === 'pending' ? 'بانتظار سائق' : 'قيد التنفيذ'}
                                    </Badge>
                                </div>
                                <div className="mt-4 flex justify-between items-center text-[10px] text-muted-foreground border-t pt-3">
                                    <span className="flex items-center gap-1"><LayoutDashboard size={12}/> {new Date(load.created_at).toLocaleDateString('ar-SA')}</span>
                                    <span className="font-bold text-primary text-sm">{load.budget} ريال</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
             )}
          </TabsContent>
        </Tabs>

      </div>
    </AppLayout>
  );
}
