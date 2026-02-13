import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth'; 
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Navigation, Truck, MapPin, Clock, Info, ShieldCheck, Activity } from 'lucide-react';

// حل مشكلة الأيقونة: استخدام أيقونة مدمجة بدلاً من الرابط غير المعتمد
// أو يمكن استخدام أيقونة من مكتبة lucide أو أيقونة Leaflet الافتراضية المعدلة
const truckIcon = new L.Icon({
    // خيار 1: استخدام أيقونة Leaflet قياسية مع تعديل الأبعاد واللون
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [45, 45],
    iconAnchor: [22, 45],
    popupAnchor: [-3, -76],
    shadowSize: [41, 41]
});

// خيار 2 (بديل أفضل): إنشاء أيقونة شاحنة مخصصة باستخدام SVG (لا يتطلب رابط خارجي)
// const truckIconSvg = L.divIcon({
//     html: `
//         <div style="background-color: #3b82f6; border-radius: 50%; padding: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
//             <svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path d="M7 17V19H21V17H7Z" fill="white"/>
//                 <path d="M4 17H2V5C2 3.89543 2.89543 3 4 3H15C15.5523 3 16 3.44772 16 4V12L13 9H6C5.44772 9 5 9.44772 5 10V17H4Z" fill="white"/>
//                 <path d="M19 8C20.1046 8 21 7.10457 21 6C21 4.89543 20.1046 4 19 4C17.8954 4 17 4.89543 17 6C17 7.10457 17.8954 8 19 8Z" fill="white"/>
//                 <path d="M19 12C20.1046 12 21 11.1046 21 10C21 8.89543 20.1046 8 19 8C17.8954 8 17 8.89543 17 10C17 11.1046 17.8954 12 19 12Z" fill="white"/>
//             </svg>
//         </div>
//     `,
//     className: 'custom-truck-marker',
//     iconSize: [45, 45],
//     iconAnchor: [22, 45]
// });

export default function ShipperTrack() {
  const { userProfile } = useAuth();
  const [load, setLoad] = useState<any>(null);
  const [location, setLocation] = useState<[number, number]>([24.7136, 46.6753]);
  const [loading, setLoading] = useState(true);
  const [driverStats, setDriverStats] = useState({ speed: 82, temperature: -4 });

  // محاكاة تحديث الموقع والبيانات في الوقت الفعلي
  useEffect(() => {
    // جلب بيانات الشحنة
    const fetchLoadData = setTimeout(() => {
        setLoad({ id: 'TRK-99281', origin: 'الرياض', destination: 'جدة', status: 'moving', driver: 'فهد العتيبي' });
        setLoading(false);
    }, 1000);

    // تحديث الموقع كل 5 ثوانٍ (محاكاة التتبع الفعلي)
    const liveUpdateInterval = setInterval(() => {
        if (load?.status === 'moving') {
            // تحريك الشاحنة قليلاً نحو الوجهة
            setLocation(prev => [
                prev[0] - 0.02,
                prev[1] + 0.03
            ]);
            // تحديث السرعة بشكل عشوائي
            setDriverStats(prev => ({
                ...prev,
                speed: Math.floor(Math.random() * 20) + 70
            }));
        }
    }, 5000);

    return () => {
        clearTimeout(fetchLoadData);
        clearInterval(liveUpdateInterval);
    };
  }, [load?.status]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Navigation size={28} className="animate-pulse" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-900">نظام التتبع المباشر (V2.0)</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time Satellite Tracking Active</p>
                </div>
            </div>
            <Badge className="bg-emerald-500 h-8 px-4 rounded-full font-black animate-bounce">Live</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-3 relative group">
            <div className="absolute -inset-1 bg-blue-500/10 rounded-[3rem] blur-2xl transition duration-1000 group-hover:opacity-100 opacity-50"></div>
            <Card className="relative rounded-[3rem] overflow-hidden border-none shadow-2xl h-[650px] bg-slate-100">
                <MapContainer center={location} zoom={7} className="h-full w-full">
                    <TileLayer 
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    {/* استخدام الأيقونة المصلحة */}
                    <Marker position={location} icon={truckIcon} title={load.driver} />
                    <Polyline 
                        positions={[location, [21.5433, 39.1728]]} 
                        color="#3b82f6" 
                        weight={4} 
                        dashArray="10, 10" 
                        opacity={0.8}
                    />
                </MapContainer>

                {/* Map Overlays */}
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none">
                    <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-[2rem] text-white shadow-2xl pointer-events-auto border border-white/10 w-72">
                        <div className="flex items-center gap-3 mb-4">
                            <Activity size={18} className="text-blue-400" />
                            <span className="text-xs font-black uppercase tracking-tighter">Sensors Status</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-bold opacity-60">
                                <span>Speed:</span> 
                                <span>{driverStats.speed} km/h</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${(driverStats.speed / 120) * 100}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold opacity-60">
                                <span>Temperature:</span> 
                                <span>{driverStats.temperature}°C (Refrigerated)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
          </div>

          {/* Side Info */}
          <div className="space-y-4">
             <Card className="rounded-[2.5rem] border-none shadow-lg bg-blue-600 text-white p-8">
                <p className="text-xs font-bold opacity-60 uppercase">الناقل الحالي</p>
                <h3 className="text-2xl font-black mt-1">{load.driver}</h3>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                    <Truck size={16} />
                    <span className="text-sm font-bold">شاحنة تريلا - مبردة</span>
                </div>
             </Card>

             <Card className="rounded-[2.5rem] border-none shadow-lg p-8 bg-white space-y-6">
                <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100"></div>
                        <div className="w-0.5 h-16 bg-slate-100 my-1"></div>
                        <MapPin className="text-rose-500" size={18} />
                    </div>
                    <div className="space-y-8 flex-1">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">المنطلق</p>
                            <p className="font-black text-slate-700">مدينة الرياض</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">الوجهة</p>
                            <p className="font-black text-slate-700">ميناء جدة الإسلامي</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100">
                    <Clock className="text-blue-600" size={20}/>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">الوصول المتوقع</p>
                        <p className="font-black text-slate-800 text-sm">اليوم، 10:30 مساءً</p>
                    </div>
                </div>

                <Button className="w-full h-14 rounded-2xl bg-slate-900 font-black gap-2 shadow-xl shadow-slate-900/10">
                    <ShieldCheck size={20}/> فتح بوليصة التأمين
                </Button>
             </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
