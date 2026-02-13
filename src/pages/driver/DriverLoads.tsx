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
    const channel = supabase.channel('market').on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, fetchLoads).subscribe();
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
    setIsAccepting(true);
    try {
      await api.acceptLoad(selectedLoad.id, userProfile.id);
      toast.success("تمت إضافة الشحنة لمهامك بنجاح");
      setShowFeedback(false);
      setSelectedLoad(null);
      navigate('/driver/history'); // التوجه لصفحة شحناتي
    } catch (err: any) {
      toast.error("حدث خطأ في القبول");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 pb-20">
        <h2 className="text-xl font-black text-slate-800">الحمولات المتاحة بالسوق</h2>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div> : (
          <div className="grid gap-3">
            {loads.map(load => (
              <Card key={load.id} className="rounded-3xl border-none shadow-sm bg-white cursor-pointer active:scale-95 transition-all" onClick={() => setSelectedLoad(load)}>
                <CardContent className="p-5 flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-black text-slate-700">
                      <MapPin size={18} className="text-blue-600" />
                      {load.origin} ← {load.destination}
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px]">{load.weight} طن</Badge>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 text-[10px]">{load.price} ر.س</Badge>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-slate-300" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Sheet open={!!selectedLoad} onOpenChange={() => setSelectedLoad(null)}>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-[3rem] p-0 bg-slate-50 border-none shadow-2xl">
            <div className="p-6 space-y-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm text-center">
                    <Truck size={40} className="mx-auto text-blue-600 mb-4" />
                    <h3 className="text-2xl font-black text-slate-800">{selectedLoad?.origin} إلى {selectedLoad?.destination}</h3>
                    <p className="text-slate-400 font-bold mt-2">حمولة {selectedLoad?.weight} طن بسعر {selectedLoad?.price} ريال</p>
                </div>
                <div className="flex gap-4">
                    <Button className="flex-1 h-16 rounded-2xl bg-[#25D366] text-white font-black" onClick={() => handleContact('wa')}>واتساب</Button>
                    <Button className="flex-1 h-16 rounded-2xl bg-slate-900 text-white font-black" onClick={() => handleContact('tel')}>اتصال</Button>
                </div>
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
            <DialogContent className="rounded-[2.5rem] p-8 text-center border-none shadow-2xl">
                <DialogHeader className="sr-only"><DialogTitle>Feedback</DialogTitle><DialogDescription>Status</DialogDescription></DialogHeader>
                <CheckCircle2 size={60} className="mx-auto text-emerald-500 mb-4" />
                <h2 className="text-xl font-black text-slate-800 mb-6">هل اتفقت مع صاحب الحمولة؟</h2>
                <div className="flex flex-col gap-3">
                    <Button className="h-16 rounded-2xl bg-blue-600 text-white font-black text-lg" onClick={handleConfirmAgreement} disabled={isAccepting}>
                        {isAccepting ? <Loader2 className="animate-spin" /> : "نعم، تمت الموافقة"}
                    </Button>
                    <Button variant="ghost" className="text-slate-400 font-bold" onClick={() => setShowFeedback(false)}>ليس الآن</Button>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
