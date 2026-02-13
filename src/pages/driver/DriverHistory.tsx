import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, XCircle, Truck, ArrowLeftRight, AlertTriangle } from 'lucide-react';
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

export default function DriverHistory() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchMyLoads = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getUserLoads(userProfile.id);
      setLoads(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMyLoads();
    const channel = supabase.channel('history-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, fetchMyLoads).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  const handleReleaseLoad = async (loadId: string) => {
    setProcessingId(loadId);
    try {
      await api.cancelLoadAssignment(loadId);
      toast.success("تمت إزالة الشحنة وإعادتها للسوق");
      fetchMyLoads();
    } catch (err) { toast.error("فشل الإلغاء"); }
    finally { setProcessingId(null); }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-20">
        <h1 className="text-2xl font-black text-slate-800 italic uppercase">My Active Shipments</h1>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div> : (
          <div className="grid gap-5">
            {loads.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed">
                <Truck size={40} className="mx-auto text-slate-200 mb-2" />
                <p className="text-slate-400 font-bold">لا توجد لديك شحنات مقبولة حالياً</p>
              </div>
            ) : loads.map((load) => (
              <Card key={load.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <Badge className={load.status === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'}>
                      {load.status === 'in_progress' ? 'جاري التنفيذ' : 'مكتملة'}
                    </Badge>
                    
                    {/* زر الإلغاء X */}
                    {load.status === 'in_progress' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-rose-500 rounded-full h-12 w-12">
                            {processingId === load.id ? <Loader2 className="animate-spin" /> : <XCircle size={28} />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black flex items-center gap-2">
                                <AlertTriangle className="text-rose-500" /> إزالة الشحنة؟
                            </AlertDialogTitle>
                            <AlertDialogDescription className="font-bold py-4">سيتم إرجاع هذه الشحنة للسوق ليراها السائقون الآخرون وتختفي من حسابك.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-3">
                            <AlertDialogCancel className="rounded-2xl h-12">تراجع</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleReleaseLoad(load.id)} className="rounded-2xl h-12 bg-rose-500">نعم، إزالة</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white"><Truck size={30} /></div>
                    <div>
                        <div className="flex items-center gap-3 font-black text-slate-800 text-xl">
                            {load.origin} <ArrowLeftRight size={16} className="text-slate-300" /> {load.destination}
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">أجرة النقل: {load.price} ر.س | وزن: {load.weight} طن</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
