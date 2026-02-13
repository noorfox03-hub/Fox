import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Phone, MessageCircle, X, ChevronLeft, Truck, CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function DriverLoads() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pendingContact, setPendingContact] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // جلب الحمولات المتاحة
  const fetchLoads = async () => {
    try {
      const data = await api.getAvailableLoads();
      // تصفية الشحنات لمنع السائق من رؤية شحناته الخاصة
      setLoads(data.filter(l => l.owner_id !== userProfile?.id));
    } catch (e) {
      console.error("Error fetching loads:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
    // تحديث لحظي للسوق
    const channel = supabase.channel('market-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, fetchLoads)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  // مراقبة عودة المستخدم للمتصفح بعد الاتصال لإظهار نافذة "هل اتفقت؟"
  useEffect(() => {
    const handleFocus = () => {
      if (pendingContact) {
        setPendingContact(false);
        setTimeout(() => setShowFeedback(true), 800);
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

  // وظيفة قبول الشحنة مع إرسال بيانات السائق للتاجر
  const handleConfirmAgreement = async () => {
    if (!selectedLoad || !userProfile?.id) return;

    // تحقق إجباري من وجود بيانات السائق
    if (!userProfile.full_name || !userProfile.phone) {
      toast.error("يرجى إكمال بيانات ملفك الشخصي (الاسم والجوال) أولاً");
      navigate('/driver/account');
      return;
    }

    setIsAccepting(true);
    try {
      // إرسال طلب القبول مع بيانات السائق (ID الشحنة، ID السائق، ID التاجر، اسم السائق، جوال السائق)
      await api.acceptLoad(
        selectedLoad.id, 
        userProfile.id, 
        selectedLoad.owner_id, 
        userProfile.full_name, 
        userProfile.phone
      );

      toast.success("تم قبول الشحنة وإبلاغ التاجر ببياناتك بنجاح ✅");
      setShowFeedback(false);
      setSelectedLoad(null);
      
      // التوجيه لصفحة "شحناتي" لمتابعة الرحلة
      navigate('/driver/history'); 
    } catch (err: any) {
      toast.error("فشل قبول الشحنة، قد تكون حُجزت بالفعل");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 pb-20">
        <div className="flex flex-col gap-1 mb-4">
            <h1 className="text-2xl font-black text-slate-800">سوق الحمولات</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Global Logistics Market</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : loads.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
             <Truck size={48} className="mx-auto text-slate-200 mb-2" />
             <p className="text-slate-400 font-bold">لا توجد شحنات متاحة في السوق حالياً</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {loads.map(load => (
              <Card key={load.id} className="rounded-3xl border-none shadow-sm bg-white cursor-pointer active:scale-95 transition-all" onClick={() => setSelectedLoad(load)}>
                <CardContent className="p-5 flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-black text-slate-700 text-lg">
                      <MapPin size={18} className="text-blue-600" />
                      {load.origin} ← {load.destination}
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase">{load.weight} طن</Badge>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">{load.price} ر.س</Badge>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <ChevronLeft size={20} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* تفاصيل الشحنة (Bottom Sheet) */}
        <Sheet open={!!selectedLoad} onOpenChange={() => setSelectedLoad(null)}>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-[3rem] p-0 bg-slate-50 border-none shadow-2xl overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2"></div>
              <div className="px-6 py-4 flex justify-between items-center bg-white border-b">
                <h3 className="text-xl font-black text-slate-800 italic">Cargo Information</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedLoad(null)} className="rounded-full bg-slate-100"><X size={20}/></Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm text-center border border-slate-100">
                    <Truck size={40} className="mx-auto text-blue-600 mb-4" />
                    <h3 className="text-2xl font-black text-slate-800">{selectedLoad?.origin} إلى {selectedLoad?.destination}</h3>
                    <div className="flex justify-center gap-4 mt-4">
                        <div className="bg-slate-50 px-4 py-2 rounded-xl text-sm font-bold text-slate-600">الوزن: {selectedLoad?.weight} طن</div>
                        <div className="bg-emerald-50 px-4 py-2 rounded-xl text-sm font-bold text-emerald-600">السعر: {selectedLoad?.price} ر.س</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">وصف الحمولة</p>
                    <p className="text-slate-700 font-bold leading-relaxed">{selectedLoad?.description || 'لا يوجد وصف إضافي متاح.'}</p>
                </div>
              </div>

              <div className="p-6 bg-white border-t flex gap-4 pb-12">
                <Button className="flex-1 h-16 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-lg gap-2 shadow-xl shadow-green-100" onClick={() => handleContact('wa')}>
                  <MessageCircle size={24} /> واتساب
                </Button>
                <Button className="flex-1 h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg gap-2 shadow-xl" onClick={() => handleContact('tel')}>
                  <Phone size={24} /> اتصال
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* نافذة التغذية الراجعة بعد الاتصال */}
        <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
            <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl sm:max-w-md">
                <DialogHeader className="sr-only">
                    <DialogTitle>تأكيد الاتفاق</DialogTitle>
                    <DialogDescription>تأكيد نتيجة التواصل مع الشاحن</DialogDescription>
                </DialogHeader>

                <div className="bg-slate-900 p-8 text-center text-white relative">
                    <CheckCircle2 size={60} className="mx-auto text-emerald-500 mb-2" />
                    <h2 className="text-2xl font-black italic">Contact Feedback</h2>
                    <Button variant="ghost" onClick={() => setShowFeedback(false)} className="absolute top-4 right-4 text-white/30 hover:text-white rounded-full"><X size={20}/></Button>
                </div>

                <div className="p-8 space-y-6 bg-white text-center">
                    <h3 className="text-xl font-black text-slate-800">هل تم الاتفاق مع صاحب الحمولة؟</h3>
                    <p className="text-slate-500 text-sm font-bold">عند ضغط "نعم"، سيتم حجز الشحنة باسمك وإبلاغ التاجر ببياناتك فوراً.</p>
                    
                    <div className="flex flex-col gap-3 pt-2">
                        <Button 
                            className="h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-100 gap-3 transition-all active:scale-95" 
                            onClick={handleConfirmAgreement} 
                            disabled={isAccepting}
                        >
                            {isAccepting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24} /> نعم، تمت الموافقة</>}
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="h-14 rounded-2xl text-slate-400 font-bold hover:bg-slate-50" 
                            onClick={() => setShowFeedback(false)}
                        >
                            ليس الآن / لم نتفق
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
