import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Phone, MessageCircle, Info, X, ChevronLeft, Truck, CheckCircle2, DollarSign, Weight, Calendar, Box } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'; // أضفنا الاستيرادات الناقصة هنا
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function DriverLoads() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pendingContact, setPendingContact] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const fetchLoads = async () => {
    try {
      const data = await api.getAvailableLoads();
      setLoads((data as any[])?.filter(l => l.owner_id !== userProfile?.id) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('loads-live').on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => fetchLoads()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  useEffect(() => {
    const handleFocus = () => {
      if (pendingContact) {
        setPendingContact(false);
        setTimeout(() => setShowFeedback(true), 600);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [pendingContact]);

  const handleContact = (type: 'tel' | 'wa') => {
    setPendingContact(true);
    const phone = selectedLoad?.profiles?.phone || '';
    if (type === 'tel') window.location.href = `tel:${phone}`;
    else window.open(`https://wa.me/${phone.replace(/^0/, '966')}`, '_blank');
  };

  const handleConfirmAgreement = async () => {
    if (!selectedLoad || !userProfile?.id) return;
    setIsAccepting(true);
    try {
      await api.acceptLoad(selectedLoad.id, userProfile.id);
      toast.success("تم نقل الشحنة إلى شاحنتك بنجاح!");
      setShowFeedback(false);
      setSelectedLoad(null);
    } catch (err: any) {
      toast.error("حدث خطأ: " + err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 pb-20">
        <h2 className="text-xl font-black text-slate-800">الحمولات المتاحة</h2>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : (
          <div className="grid gap-3">
            {loads.map(load => (
              <Card key={load.id} className="rounded-3xl border-none shadow-sm active:scale-[0.98] transition-all cursor-pointer bg-white" onClick={() => setSelectedLoad(load)}>
                <CardContent className="p-5 flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-black text-slate-700 text-lg">
                      <MapPin size={18} className="text-primary" />
                      {load.origin} <ChevronLeft size={16} className="text-slate-300" /> {load.destination}
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0 text-[10px] font-bold">{load.weight} طن</Badge>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-0 text-[10px] font-bold">{load.price} ر.س</Badge>
                    </div>
                  </div>
                  <ChevronLeft className="text-slate-300" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* نافذة تفاصيل الشحنة */}
        <Sheet open={!!selectedLoad} onOpenChange={() => setSelectedLoad(null)}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-[3rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="h-full flex flex-col bg-slate-50">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2"></div>
              <div className="px-6 py-4 flex justify-between items-center bg-white border-b">
                <h3 className="text-xl font-black text-slate-800">تفاصيل الحمولة</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedLoad(null)} className="rounded-full bg-slate-100"><X size={20}/></Button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center">
                        <div className="text-center flex-1">
                            <p className="text-[10px] font-bold text-slate-400 mb-1">التحميل</p>
                            <p className="font-black text-slate-800">{selectedLoad?.origin}</p>
                        </div>
                        <div className="px-4 flex flex-col items-center flex-1">
                            <span className="text-[10px] font-black text-primary mb-1">{selectedLoad?.distance || '---'} كم</span>
                            <div className="w-full border-t-2 border-dashed border-slate-200"></div>
                            <Truck className="text-primary mt-1" size={18} />
                        </div>
                        <div className="text-center flex-1">
                            <p className="text-[10px] font-bold text-slate-400 mb-1">التفريغ</p>
                            <p className="font-black text-slate-800">{selectedLoad?.destination}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><DollarSign size={20}/></div>
                        <div><p className="text-[9px] font-bold text-slate-400">السعر</p><p className="font-black text-sm">{selectedLoad?.price} ر.س</p></div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Weight size={20}/></div>
                        <div><p className="text-[9px] font-bold text-slate-400">الوزن</p><p className="font-black text-sm">{selectedLoad?.weight} طن</p></div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 font-black text-sm"><Info size={18} className="text-primary"/> وصف إضافي</div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{selectedLoad?.description || 'لا يوجد وصف متاح.'}</p>
                </div>
              </div>

              <div className="p-6 bg-white border-t flex gap-3 pb-10">
                <Button className="flex-1 h-14 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white text-lg font-black gap-2 shadow-lg" onClick={() => handleContact('wa')}>
                  <MessageCircle size={22} /> واتساب
                </Button>
                <Button className="flex-1 h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-lg font-black gap-2 shadow-lg" onClick={() => handleContact('tel')}>
                  <Phone size={22} /> اتصال
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* نافذة تقرير الاتصال - تم إصلاح مشكلة العنوان هنا */}
        <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
            <DialogContent className="sm:max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="sr-only"> {/* هذا الجزء يحل الخطأ ولكنه مخفي للمستخدم */}
                    <DialogTitle>تقرير الاتصال</DialogTitle>
                    <DialogDescription>تأكيد حالة الاتفاق مع صاحب الحمولة</DialogDescription>
                </DialogHeader>
                
                <div className="bg-slate-900 p-8 text-center text-white relative">
                    <Truck className="mx-auto mb-2 text-blue-500" size={40} />
                    <h2 className="text-xl font-black italic">Contact Feedback</h2>
                    <Button variant="ghost" onClick={() => setShowFeedback(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20}/></Button>
                </div>
                <div className="p-6 space-y-6 bg-white">
                    <p className="text-center font-black text-slate-700 text-lg">هل اتفقت مع صاحب الحمولة؟</p>
                    <div className="grid gap-3">
                        <Button 
                            className="h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg shadow-lg gap-3 transition-all active:scale-95" 
                            onClick={handleConfirmAgreement}
                            disabled={isAccepting}
                        >
                           {isAccepting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24} /> نعم، اتفقت</>}
                        </Button>
                        
                        <Button variant="ghost" className="h-12 rounded-xl text-slate-400 font-bold hover:bg-slate-50" onClick={() => setShowFeedback(false)}>
                            لا، لم نتفق / لم يرد
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
