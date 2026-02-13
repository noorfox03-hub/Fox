import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Truck, CheckCircle, Navigation, Phone, MessageSquare, Star, ArrowUpRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ShipperDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboardStats(), api.getAllDrivers()])
      .then(([s, d]) => { setStats(s); setDrivers(d); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Mission Control</h1>
            <p className="text-slate-500 font-medium mt-1">أهلاً بك {userProfile?.full_name}، شحناتك تحت السيطرة.</p>
          </div>
          <Button onClick={() => navigate('/shipper/post')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-16 px-8 font-black text-lg shadow-xl shadow-blue-500/20 gap-3 transition-all active:scale-95">
            <Plus size={24} /> نشر شحنة جديدة
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'شحنات قيد النقل', value: stats?.active || 0, icon: <Navigation />, color: 'bg-blue-600' },
            { label: 'تم تسليمها', value: stats?.completed || 0, icon: <CheckCircle />, color: 'bg-emerald-500' },
            { label: 'معدل الأمان', value: stats?.safety_rate || "100%", icon: <ShieldCheck />, color: 'bg-slate-900' }
          ].map((s, i) => (
            <motion.div key={i} whileHover={{ y: -5 }} className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group border-none shadow-sm bg-white">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg", s.color)}>
                {s.icon}
              </div>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{s.label}</p>
              <p className="text-4xl font-black text-slate-900 mt-2">{s.value}</p>
              <ArrowUpRight className="absolute top-8 end-8 text-slate-200 group-hover:text-blue-500 transition-colors" />
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">Verified Premium Carriers</h2>
          {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" size={32} /></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drivers.slice(0, 6).map((driver, idx) => (
                <motion.div key={driver.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}>
                  <Card className="rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 uppercase">
                          {driver.profiles?.full_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-800 truncate">{driver.profiles?.full_name}</h3>
                            <ShieldCheck size={16} className="text-blue-500 flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-1 text-amber-500 mt-1">
                            <Star size={12} fill="currentColor" />
                            <span className="text-xs font-black">
                                {/* تم إصلاح الخطأ هنا باستخدام حماية Null */}
                                {(driver.rating || 5.0).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">الشاحنة</p>
                          <p className="text-xs font-black text-slate-700 mt-1 truncate">{driver.truck_type || 'نقل عام'}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">التواجد</p>
                          <p className="text-xs font-black text-emerald-600 mt-1">متاح الآن</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl h-12 font-bold shadow-lg" onClick={() => window.open(`https://wa.me/${driver.profiles?.phone?.replace(/^0/, '966')}`)}>
                           واتساب
                        </Button>
                        <Button variant="outline" className="h-12 w-12 rounded-xl border-slate-200" onClick={() => window.open(`tel:${driver.profiles?.phone}`)}>
                          <Phone size={18} className="text-slate-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
