import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Weight, DollarSign, User, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DriverLoads() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchAvailableLoads = async () => {
    try {
      const data = await api.getAvailableLoads();
      // نعرض الشحنات المتاحة فقط والتي لم ينشرها هذا المستخدم
      setLoads((data as any[])?.filter(l => l.owner_id !== userProfile?.id) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableLoads();

    // تحديث فوري للشحنات: لو تاجر أضاف شحنة تظهر، ولو سواق قبل شحنة تختفي من عند الباقي
    const channel = supabase
      .channel('available-loads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => {
        fetchAvailableLoads();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  // دالة قبول الشحنة
  const handleAcceptLoad = async (loadId: string) => {
    if (!userProfile?.id) return;
    
    setAcceptingId(loadId); // تشغيل لودر على الزر المحدد
    try {
      await api.acceptLoad(loadId, userProfile.id);
      toast.success("تم قبول الشحنة بنجاح! اذهب لصفحة 'شحناتي' لمتابعتها");
      // الشحنة ستختفي تلقائياً من القائمة بفضل الـ Realtime
    } catch (err: any) {
      toast.error("فشل قبول الشحنة: " + err.message);
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">الشحنات المتاحة للتحميل</h2>
            <Badge className="bg-primary/10 text-primary border-primary/20">{loads.length} شحنة</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : loads.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl">
            <p className="text-muted-foreground font-medium">لا توجد شحنات متاحة في منطقتك حالياً</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {loads.map((load) => (
              <Card key={load.id} className="border-none shadow-sm bg-card hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-lg font-black text-slate-800">
                        <MapPin className="text-primary" size={20} />
                        {load.origin}
                        <span className="text-slate-300 mx-1">──</span>
                        {load.destination}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User size={12} /> صاحب الشحنة: {load.profiles?.full_name}
                      </p>
                    </div>
                    <div className="text-left">
                       <p className="text-2xl font-black text-green-600">{load.price} <span className="text-xs">ر.س</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-50 my-4">
                    <div className="text-center">
                        <p className="text-[10px] text-muted-foreground mb-1">الوزن التقديري</p>
                        <p className="font-bold text-sm">{load.weight} طن</p>
                    </div>
                    <div className="text-center border-x">
                        <p className="text-[10px] text-muted-foreground mb-1">نوع البضاعة</p>
                        <p className="font-bold text-sm">{load.package_type || 'عامة'}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-muted-foreground mb-1">تاريخ التحميل</p>
                        <p className="font-bold text-sm">{load.pickup_date || 'عاجل'}</p>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-primary/20"
                    onClick={() => handleAcceptLoad(load.id)}
                    disabled={acceptingId === load.id}
                  >
                    {acceptingId === load.id ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : (
                      <><CheckCircle2 className="ml-2" size={18} /> قبول الشحنة فوراً</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
