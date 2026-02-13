import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Truck, Package, CheckCircle, Navigation, Phone, MessageSquare, Star, ArrowUpRight, ShieldCheck, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // استدعاء الدالة من المكتبة المعيارية

// تعريف أنواع البيانات للتحقق من الأنواع
interface DriverProfile {
  full_name: string;
  phone: string;
}

interface Driver {
  id: string;
  profiles: DriverProfile;
  truck_type: string;
  is_available: boolean;
  rating: number;
}

interface DashboardStats {
  active: number;
  completed: number;
  safety_rate: string;
}

export default function ShipperDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // دالة لتحميل كل البيانات (الإحصائيات والناقلين)
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // تحميل الإحصائيات من API بدلاً من القيم الثابتة
      const [statsData, driversData] = await Promise.all([
        api.getDashboardStats(),
        api.getAllDrivers()
      ]);
      
      setStats(statsData);
      setDrivers(driversData || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("حدث خطأ أثناء تحميل البيانات، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // التعامل مع حالة عدم وجود ناقلين
  if (!loading && error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <XCircle size={60} className="text-red-500" />
          <h3 className="text-2xl font-black text-slate-800">{error}</h3>
          <Button 
            onClick={loadDashboardData} 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2"
          >
            <RefreshCw size={18} /> إعادة المحاولة
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Mission Control</h1>
            <p className="text-slate-500 font-medium mt-1">
              أهلاً بك {userProfile?.full_name || 'أيها التاجر'}، إدارة شحناتك أصبحت أسهل.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/shipper/post')} 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-16 px-8 font-black text-lg shadow-xl shadow-blue-500/20 gap-3"
          >
            <Plus size={24} /> نشر شحنة جديدة
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats ? (
            [
              { label: 'شحنات قيد النقل', value: stats.active, icon: <Navigation />, color: 'bg-blue-600' },
              { label: 'تم تسليمها', value: stats.completed, icon: <CheckCircle />, color: 'bg-emerald-500' },
              { label: 'معدل الأمان', value: stats.safety_rate, icon: <ShieldCheck />, color: 'bg-slate-900' }
            ].map((s, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -5 }} 
                className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group"
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg", s.color)}>
                  {s.icon}
                </div>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{s.label}</p>
                <p className="text-4xl font-black text-slate-900 mt-2">{s.value}</p>
                <ArrowUpRight className="absolute top-8 end-8 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </motion.div>
            ))
          ) : (
            // عرض بطاقات تحميل للإحصائيات
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card p-8 rounded-[2.5rem] animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 mb-6"></div>
                <p className="h-4 w-1/3 bg-slate-200 rounded mb-2"></p>
                <p className="h-8 w-1/2 bg-slate-200 rounded"></p>
              </div>
            ))
          )}
        </div>

        {/* Drivers Market */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">الناقلون المعتمدون (Premium)</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : drivers.length === 0 ? (
            // عرض رسالة عند عدم وجود ناقلين
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Truck size={50} className="text-slate-300" />
              <h3 className="text-xl font-black text-slate-700">لا يوجد ناقلون متاحون حالياً</h3>
              <p className="text-slate-500 text-center max-w-md">سيتم إضافة الناقلين المعتمدين قريباً، أو يمكنك نشر شحنتك للانتظار بالقبول من الناقلين</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drivers.slice(0, 6).map((driver, idx) => (
                <motion.div 
                  key={driver.id} // استخدام معرف فريد بدلاً من المؤشر
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 uppercase">
                          {/* قيمة افتراضية موحدة */}
                          {driver.profiles?.full_name?.[0] || 'N'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-800 truncate">
                              {driver.profiles?.full_name || 'ناقل معتمد'}
                            </h3>
                            <ShieldCheck size={16} className="text-blue-500 flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-1 text-amber-500 mt-1">
                            <Star size={12} fill="currentColor" />
                            <span className="text-xs font-black">{driver.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">الشاحنة</p>
                          <p className="text-xs font-black text-slate-700 mt-1 truncate">
                            {driver.truck_type || 'نقل عام'}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">التواجد</p>
                          <p className={`text-xs font-black mt-1 ${driver.is_available ? 'text-emerald-600' : 'text-red-500'}`}>
                            {driver.is_available ? 'متاح الآن' : 'غير متاح'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {/* تقسيم الوظائف بين الأزرار */}
                        <Button 
                          className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl h-12 font-bold"
                          onClick={() => window.open(`sms:${driver.profiles?.phone}`)}
                        >
                          <MessageSquare size={18} className="ml-2" /> إرسال رسالة
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-12 w-12 rounded-xl border-slate-200"
                          onClick={() => window.open(`tel:${driver.profiles?.phone}`)}
                        >
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
