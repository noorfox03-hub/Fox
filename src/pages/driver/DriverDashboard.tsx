import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // هذا السطر الذي كان ناقصاً
import { Star, Truck, CheckCircle, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DriverDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({ activeLoads: 0, completedTrips: 0, rating: 5.0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.id) {
      api.getDriverStats(userProfile.id)
        .then(setStats)
        .catch(err => console.error("Failed to fetch stats:", err))
        .finally(() => setLoading(false));
    }
  }, [userProfile]);

  if (!userProfile) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle size={48} className="text-amber-500 mb-4" />
          <h3 className="text-xl font-bold text-slate-800">لم يتم العثور على الملف الشخصي</h3>
          <p className="text-slate-500 mb-6">يرجى تسجيل الدخول للوصول إلى لوحة التحكم</p>
          <Button onClick={() => navigate('/login')}>تسجيل الدخول</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Fleet Intelligence</h1>
          <p className="text-slate-500 font-bold mt-1">مرحباً {userProfile?.full_name}، إليك ملخص أدائك اليوم.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-6 shadow-lg">
                  <Navigation size={24} />
                </div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">الرحلات النشطة</p>
                <p className="text-4xl font-black text-slate-900 mt-2">{stats.activeLoads || 0}</p>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white mb-6 shadow-lg">
                  <CheckCircle size={24} />
                </div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">الرحلات المكتملة</p>
                <p className="text-4xl font-black text-slate-900 mt-2">{stats.completedTrips || 0}</p>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white mb-6 shadow-lg">
                  <Star size={24} />
                </div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">التقييم العام</p>
                <div className="flex items-center gap-2 mt-2">
                    <p className="text-4xl font-black text-slate-900">
                        {(stats.rating || 5.0).toFixed(1)}
                    </p>
                    <div className="flex text-amber-500">
                        <Star size={16} fill="currentColor" />
                    </div>
                </div>
            </Card>
          </div>
        )}

        <div className="bg-slate-900 rounded-[3rem] p-12 text-white text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.2),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <Truck size={48} className="mx-auto mb-6 text-blue-500" />
            <h2 className="text-2xl font-black italic mb-2">Ready for your next cargo?</h2>
            <p className="text-slate-400 font-bold max-w-md mx-auto mb-8">سوق الحمولات يحتوي على طلبات نقل جديدة في منطقتك الحالية.</p>
            <Button 
              onClick={() => navigate('/driver/loads')} 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-10 font-black text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-95"
            >
                تصفح سوق الحمولات
            </Button>
        </div>
      </div>
    </AppLayout>
  );
}
