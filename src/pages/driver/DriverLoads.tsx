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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils'; // الاستيراد المصلح

export default function DriverLoads() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pendingContact, setPendingContact] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const fetchLoads = async () => {
    try {
      const data = await api.getAvailableLoads();
      setLoads(data.filter(l => l.owner_id !== userProfile?.id));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('market-live').on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, fetchLoads).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

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

  const handleConfirmAgreement = async () => {
    if (!selectedLoad || !userProfile?.id) return;
    
    // فحص الحقول الإجبارية للسائق قبل القبول
    if (!userProfile.full_name || !userProfile.phone) {
        toast.error("يرجى إكمال بيانات ملفك الشخصي (الاسم والجوال) أولاً");
        navigate('/driver/account');
        return;
    }

    setIsAccepting(true);
    try {
      // إرسال بيانات السائق (ID الشحنة، ID السائق، ID التاجر، اسم السائق، رقم السائق)
      await api.acceptLoad(
        selectedLoad.id, 
        userProfile.id, 
        selectedLoad.owner_id, 
        userProfile.full_name, 
        userProfile.phone
      );
      
      toast.success("تم قبول الشحنة وإبلاغ التاجر ببياناتك ✅");
      setShowFeedback(false);
      setSelectedLoad(null);
      navigate('/driver/history');
    } catch (err: any) {
      toast.error("فشل قبول الشحنة، حاول مرة أخرى");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 pb-20">
        <h2 className="text-xl font-black text-slate-800 italic uppercase">Logistics Marketplace</h2>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div> : (
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
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black text-[10px]">{load.weight} طن</Badge>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 font-black text-[10px]">{load.price} ر.س</Badge>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-slate-300" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Sheet open={!!selectedLoad} onOpenChange={() => setSelectedLoad(null)}>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-[3rem] p-0 bg-slate-50 border-none shadow-2xl overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2"></div>
              <div className="px-6 py-4 flex justify-between items-center bg-white border-b font-black italic">
                <span>Shipment Details</span>
                <Button variant="ghost" size="icon" onClick={() => setSelectedLoad(null)} className="rounded-full bg-slate-100"><X size={20}/></Button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm text-center border border-slate-100">
                    <Truck size={40} className="mx-auto text-blue-600 mb-4" />
                    <h3 className="text-2xl font-black text-slate-800">{selectedLoad?.origin} إلى {selectedLoad?.destination}</h3>
                    <div className="flex justify-center gap-4 mt-4 font-bold">
                        <span className="bg-slate-50 px-4 py-2 rounded-xl">وزن: {selectedLoad?.weight} طن</span>
                        <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl">أجرة: {selectedLoad?.price} ر.س</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 font-bold text-slate-500">
                    <p className="text-xs font-black uppercase text-slate-300 mb-2">وصف الحمولة</p>
                    {selectedLoad?.description || 'لا توجد ملاحظات إضافية.'}
                </div>
              </div>
              <div className="p-6 bg-white border-t flex gap-4 pb-12">
                <Button className="flex-1 h-16 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-lg gap-2 shadow-xl shadow-green-100" onClick={() => handleContact('wa')}>
                  <MessageCircle size={24} /> واتساب
                </Button>
                <Button className="flex-1 h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg gap-2 shadow-xl shadow-slate-300" onClick={() => handleContact('tel')}>
                  <Phone size={24} /> اتصال
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
            <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl sm:max-w-md">
                <DialogHeader className="sr-only"><DialogTitle>Status</DialogTitle><DialogDescription>Agreement</DialogDescription></DialogHeader>
                <div className="bg-slate-900 p-8 text-center text-white relative">
                    <CheckCircle2 size={60} className="mx-auto text-emerald-500 mb-2" />
                    <h2 className="text-xl font-black italic">Contact Feedback</h2>
                    <Button variant="ghost" onClick={() => setShowFeedback(false)} className="absolute top-4 right-4 text-white/30"><X size={20}/></Button>
                </div>
                <div className="p-8 space-y-6 bg-white text-center">
                    <h3 className="text-xl font-black text-slate-800">هل تم الاتفاق مع صاحب الحمولة؟</h3>
                    <div className="flex flex-col gap-3 pt-2">
                        <Button className="h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-100 gap-3 transition-all active:scale-95" onClick={handleConfirmAgreement} disabled={isAccepting}>
                            {isAccepting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24} /> نعم، تمت الموافقة</>}
                        </Button>
                        <Button variant="ghost" className="h-14 rounded-2xl text-slate-400 font-bold hover:bg-slate-50" onClick={() => setShowFeedback(false)}>ليس الآن</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
