import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Package, CheckCircle, Navigation, Star, ArrowUpRight, Loader2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function DriverDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeLoads: 0, completedTrips: 0, rating: 5.0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!userProfile?.id) return;
      try {
        const data = await api.getDriverStats(userProfile.id);
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Driver Hub</h1>
            <p className="text-slate-500 font-medium mt-1">أهلاً بك كابتن {userProfile?.full_name?.split(' ')[0]}، رحلاتك بانتظارك.</p>
          </div>
          <Button onClick={() => navigate('/driver/loads')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-16 px-8 font-black text-lg shadow-xl shadow-blue-500/20 gap-3">
            <Package size={24} /> تصفح سوق الحمولات
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'رحلات جارية', value: stats.activeLoads, icon: <Navigation />, color: 'bg-blue-600' },
            { label: 'رحلات مكتملة', value: stats.completedTrips, icon: <CheckCircle />, color: 'bg-emerald-500' },
            { label: 'تقييمك الحالي', value: stats.rating, icon: <Star />, color: 'bg-amber-500' }
          ].map((s, i) => (
            <motion.div key={i} whileHover={{ y: -5 }} className="bg-white p-8 rounded-[2.5rem] relative overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg", s.color)}>
                {s.icon}
              </div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">{s.label}</p>
              <p className="text-4xl font-black text-slate-900 mt-2">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Action Card */}
        <Card className="rounded-[3rem] border-none bg-slate-900 text-white overflow-hidden shadow-2xl relative">
            <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 text-center md:text-right">
                    <h2 className="text-3xl font-black italic">أمن شاحنتك الآن</h2>
                    <p className="text-slate-400 font-bold max-w-md">تأكد من تسجيل كافة شاحناتك لتتمكن من المنافسة على أكبر الحمولات في منطقتك.</p>
                    <Button onClick={() => navigate('/driver/trucks')} variant="outline" className="rounded-xl border-white/20 text-white hover:bg-white/5 font-black px-8">إدارة أسطولي</Button>
                </div>
                <div className="w-48 h-48 bg-blue-600/20 rounded-full flex items-center justify-center border border-white/5 animate-pulse">
                    <Truck size={80} className="text-blue-500" />
                </div>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
