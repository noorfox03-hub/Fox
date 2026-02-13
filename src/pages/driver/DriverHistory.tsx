import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, MapPin, Loader2, Truck, 
  ArrowLeftRight, XCircle, AlertTriangle 
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

export default function DriverHistory() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // جلب البيانات من السيرفر
  const fetchData = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getUserLoads(userProfile.id);
      setLoads(data || []);
    } catch (e) {
      console.error("Error fetching history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // تفعيل التحديث اللحظي: إذا تغيرت حالة أي شحنة في قاعدة البيانات، يتم تحديث القائمة فوراً
    const channel = supabase.channel('history-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, fetchData)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  // وظيفة إنهاء الرحلة (تم التوصيل)
  const handleFinish = async (load: any) => {
    setProcessingId(load.id);
    try {
      await api.completeLoad(load.id, load.owner_id, userProfile?.full_name || 'السائق');
      toast.success("تم إرسال إشعار الوصول للتاجر بنجاح ✅");
      fetchData();
    } catch (e) {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    } finally {
      setProcessingId(null);
    }
  };

  // وظيفة إلغاء قبول الشحنة (إعادتها للسوق)
  const handleReleaseLoad = async (loadId: string) => {
    setProcessingId(loadId);
    try {
      await api.cancelLoadAssignment(loadId);
      toast.success("تمت إزالة الشحنة وإعادتها للسوق بنجاح");
      fetchData();
    } catch (e) {
      toast.error("فشل إلغاء الشحنة");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-20">
        <div className="flex flex-col gap-1 mb-4">
            <h1 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">My Active Fleet</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">إدارة شحناتك الحالية وسجل الرحلات</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : (
          <div className="grid gap-5">
            {loads.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <Truck size={64} className="mx-auto text-slate-100 mb-4" />
                <p className="text-slate-400 font-black text-lg">قائمة شحناتك فارغة</p>
                <p className="text-slate-300 text-sm">الحمولات التي تقبلها من السوق ستظهر هنا</p>
              </div>
            ) : (
              loads.map(load => (
                <Card key={load.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white overflow-hidden group relative">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <Badge className={cn(
                        "rounded-full px-5 py-1.5 font-black text-[10px] uppercase tracking-widest border-none",
                        load.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
                      )}>
                        {load.status === 'completed' ? 'تمت الرحلة' : 'قيد النقل'}
                      </Badge>
                      
                      {/* زر الإلغاء (X) - يظهر فقط إذا كانت الشحنة لم تكتمل بعد */}
                      {load.status === 'in_progress' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full h-11 w-11 transition-all">
                              {processingId === load.id ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={26} />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2.5rem] border-none p-8 shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <AlertTriangle className="text-rose-500" size={32} />
                                تراجع عن الشحنة؟
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-500 font-bold text-md leading-relaxed pt-4">
                                هل أنت متأكد من رغبتك في إزالة هذه الشحنة من حسابك؟ ستعود الشحنة "متاحة" في السوق ليراها السائقون الآخرون.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-3 mt-6">
                              <AlertDialogCancel className="h-14 rounded-2xl border-slate-100 font-black flex-1">تراجع</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleReleaseLoad(load.id)}
                                className="h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black flex-1"
                              >
                                نعم، إزالة وإعادتها للسوق
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-lg group-hover:rotate-6 transition-transform">
                          <Truck size={30} />
                      </div>
                      <div className="flex-1">
                          <div className="flex items-center gap-3 font-black text-slate-800 text-xl md:text-2xl tracking-tighter">
                              {load.origin} <ArrowLeftRight size={18} className="text-slate-300" /> {load.destination}
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2">
                             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> الأجرة: {load.price} ريال
                             </p>
                             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> الوزن: {load.weight} طن
                             </p>
                          </div>
                      </div>
                    </div>

                    {load.status === 'in_progress' && (
                      <Button 
                        className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-md gap-3 shadow-xl shadow-emerald-100 transition-all active:scale-95"
                        onClick={() => handleFinish(load)}
                        disabled={processingId === load.id}
                      >
                        {processingId === load.id ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={22} /> تم توصيل البضاعة (إنهاء الرحلة)</>}
                      </Button>
                    )}
                    
                    {load.status === 'completed' && (
                       <div className="w-full h-14 rounded-2xl bg-slate-50 flex items-center justify-center gap-2 text-slate-400 font-bold border border-slate-100">
                          <CheckCircle2 size={18} className="text-emerald-500" />
                          تم التسليم في {new Date(load.updated_at).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}
                       </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
