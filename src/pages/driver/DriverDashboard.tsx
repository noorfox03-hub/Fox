import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Package, CheckCircle, Star, ArrowUpRight, Loader2, AlertCircle, Bell, Check, FileText, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// تعريف أنواع البيانات
interface DriverStats {
  activeLoads: number;
  completedTrips: number;
  rating: number;
}

interface Truck {
  id: string;
  model: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export default function DriverDashboard() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DriverStats>({ activeLoads: 0, completedTrips: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<{ text: string; type: 'success' | 'info' | 'error' }[]>([]);
  const [showAlert, setShowAlert] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loadFilter, setLoadFilter] = useState<'all' | 'urgent' | 'heavy' | 'refrigerated'>('all');
  const [trucks, setTrucks] = useState<Truck[]>([]);

  // دالة جلب الإحصائيات
  const fetchStats = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getDriverStats(userProfile.id);
      setStats(data);
    } catch (e) {
      addNotification(t('stats_error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // دالة إضافة إشعار
  const addNotification = (text: string, type: 'success' | 'info' | 'error') => {
    setNotifications(prev => [...prev, { text, type }]);
    setTimeout(() => setNotifications(prev => prev.slice(1)), 4000);
  };

  // دالة عرض إشعار عابر
  const displayAlert = (text: string, type: 'success' | 'error') => {
    setShowAlert({ text, type });
    setTimeout(() => setShowAlert(null), 4000);
  };

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 300000);
    return () => clearInterval(interval);
  }, [userProfile]);

  // جلب بيانات الشاحنات
  useEffect(() => {
    if (userProfile?.id) {
      api.getDriverTrucks(userProfile.id).then(data => setTrucks(data));
    }
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* إشعار عابر */}
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg ${
              showAlert.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {showAlert.text}
          </motion.div>
        )}

        {/* قسم الإشعارات */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-50"
        >
          <Button variant="ghost" className="rounded-full p-2 bg-white shadow">
            <Bell className={cn(notifications.length > 0 && 'text-amber-500')} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </Button>
        </motion.div>

        {/* قسم الترحيب */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">{t('driver_dashboard')}</h1>
          <p className="text-gray-600">{t('welcome_back', { name: userProfile?.full_name || '' })}</p>
        </motion.div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent>
              <h3 className="font-bold mb-2">{t('active_loads')}</h3>
              {loading ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                <p className="text-2xl font-bold">{stats.activeLoads}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-bold mb-2">{t('completed_trips')}</h3>
              {loading ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                <p className="text-2xl font-bold">{stats.completedTrips}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-bold mb-2">{t('rating')}</h3>
              {loading ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                <div className="flex items-center">
                  <span className="text-xl font-bold mr-2">{stats.rating.toFixed(1)}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn(i < Math.floor(stats.rating) ? 'text-amber-500' : 'text-gray-300')} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* تصفية الحملات */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">{t('find_loads')}</h2>
          <div className="flex gap-2 mb-4">
            <Button 
              variant={loadFilter === 'all' ? 'default' : 'ghost'} 
              onClick={() => setLoadFilter('all')}
            >
              {t('all_loads')}
            </Button>
            <Button 
              variant={loadFilter === 'urgent' ? 'default' : 'ghost'} 
              onClick={() => setLoadFilter('urgent')}
            >
              {t('urgent_loads')}
            </Button>
            <Button 
              variant={loadFilter === 'heavy' ? 'default' : 'ghost'} 
              onClick={() => setLoadFilter('heavy')}
            >
              {t('heavy_loads')}
            </Button>
            <Button 
              variant={loadFilter === 'refrigerated' ? 'default' : 'ghost'} 
              onClick={() => setLoadFilter('refrigerated')}
            >
              {t('refrigerated_loads')}
            </Button>
          </div>
        </div>

        {/* تصفح الحملات */}
        <Card>
          <div className="bg-gray-900 text-white p-4">
            <h2 className="text-xl font-bold">{t('available_loads')}</h2>
          </div>
          <CardContent>
            {loading ? (
              <Loader2 className="animate-spin h-8 w-8 mx-auto my-8" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-4 rounded-lg">
                  <h3 className="font-bold">حمولة طعام مجمد</h3>
                  <p className="text-sm text-gray-600">من مدينة طنطا إلى برج العرب</p>
                  <Badge className="mt-2">{t('refrigerated')}</Badge>
                  <Button className="mt-4" onClick={() => {
                    displayAlert(t('load_selected'), 'success');
                    navigate('/driver/load-details');
                  }}>
                    {t('accept_load')}
                  </Button>
                </div>

                <div className="border p-4 rounded-lg">
                  <h3 className="font-bold">حمولة مواد بناء</h3>
                  <p className="text-sm text-gray-600">من بنها إلى القاهرة</p>
                  <Badge className="mt-2">{t('heavy_load')}</Badge>
                  <Button className="mt-4" onClick={() => {
                    displayAlert(t('load_selected'), 'success');
                    navigate('/driver/load-details');
                  }}>
                    {t('view_details')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* قسم إدارة الشاحنات */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">{t('your_trucks')}</h2>
          {trucks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trucks.map(truck => (
                <div key={truck.id} className="border p-4 rounded-lg">
                  <h3 className="font-bold">{truck.model}</h3>
                  <Badge>{truck.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">{t('no_trucks_registered')}</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
