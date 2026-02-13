import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, MapPin, Loader2, Truck, ArrowLeftRight, XCircle, AlertTriangle } from 'lucide-react';
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
import { cn } from '@/lib/utils'; // الاستيراد المصلح

export default function DriverHistory() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getUserLoads(userProfile.id);
      setLoads(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('history-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, fetchData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  const handleFinish = async (load: any) => {
    setProcessingId(load.id);
    try {
      await api.completeLoad(load.id, load.owner_id, userProfile?.full_name || 'السائق');
      toast.success("تم تأكيد وصول الشحنة وإبلاغ التاجر بالوقت ✅");
      fetchData();
    } catch (e) { toast.error("حدث خطأ"); }
    finally { setProcessingId(null); }
  };

  const handleRelease = async (loadId: string) => {
    setProcessingId(loadId);
    try {
      await api.cancelLoadAssignment(loadId);
      toast.success("تم إزالة الشحنة وإعادتها للسوق");
      fetchData();
    } catch (e) { toast.error("فشل الإلغاء"); }
    finally { setProcessingId(null); }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-20">
        <h1 className="text-2xl font-black italic uppercase italic">Shipment Logs</h1>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div> : (
          <div className="grid gap-5">
            {loads.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed">
                <p className="text-slate-400 font-bold">لا توجد شحنات مقبولة حالياً</p>
              </div>
            ) : loads.map(load => (
              <Card key={load.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group relative">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <Badge className={cn("rounded-full px-5 py-1.5 font-black text-[10px] uppercase", load.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white')}>
                      {load.status === 'completed' ? 'مكتملة' : 'قيد النقل'}
                    </Badge>
                    
                    {load.status === 'in_progress' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-rose-500 rounded-full h-12 w-12 transition-all">
                            {processingId === load.id ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={28} />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black flex items-center gap-2">
                                <AlertTriangle className="text-rose-500" size={32} /> إلغاء قبول الشحنة؟
                            </AlertDialogTitle>
                            <AlertDialogDescription className="font-bold py-4 text-slate-500">ستعود هذه الشحنة للسوق ليراها السائقون الآخرون وتختفي من حسابك.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-3">
                            <AlertDialogCancel className="rounded-2xl h-12 flex-1">تراجع</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRelease(load.id)} className="rounded-2xl h-12 bg-rose-500 flex-1">تأكيد الإلغاء</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-lg"><Truck size={30} /></div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 font-black text-slate-800 text-xl md:text-2xl tracking-tighter">
                            {load.origin} <ArrowLeftRight size={18} className="text-slate-300" /> {load.destination}
                        </div>
                        <p className="text-[11px] font-black text-slate-400 mt-2 uppercase tracking-widest">أجرة النقل: {load.price} ر.س | وزن: {load.weight} طن</p>
                    </div>
                  </div>

                  {load.status === 'in_progress' && (
                    <Button className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black gap-2 shadow-xl" onClick={() => handleFinish(load)}>
                      <CheckCircle2 size={20} /> تم توصيل البضاعة (إنهاء الرحلة)
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
