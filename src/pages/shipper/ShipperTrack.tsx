import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Truck, MapPin, Navigation, Clock, ShieldCheck, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// استيراد Leaflet
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// إصلاح مشكلة ظهور الأيقونات في Leaflet مع React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// أيقونة مخصصة للشاحنة
const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448327.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

// مكون لتغيير مركز الخريطة تلقائياً عند تحرك الشاحنة
function RecenterMap({ coords }: { coords: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView(coords, map.getZoom());
    }, [coords]);
    return null;
}

export default function ShipperTrack() {
  const { userProfile } = useAuth();
  const [activeLoads, setActiveLoads] = useState<any[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. جلب الشحنات النشطة
  const fetchActiveLoads = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getUserLoads(userProfile.id);
      const active = data?.filter(l => l.status === 'in_progress') || [];
      setActiveLoads(active);
      if (active.length > 0 && !selectedLoad) setSelectedLoad(active[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchActiveLoads(); }, [userProfile]);

  // 2. الاستماع لتحديثات الموقع لحظة بلحظة (Real-time)
  useEffect(() => {
    if (!selectedLoad) return;

    const channel = supabase
      .channel(`live-track-${selectedLoad.id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'loads', filter: `id=eq.${selectedLoad.id}` }, 
        (payload) => {
          if (payload.new.driver_lat && payload.new.driver_lng) {
            setCurrentLocation([payload.new.driver_lat, payload.new.driver_lng]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLoad]);

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <Navigation className="text-primary animate-pulse" /> تتبع الشحنة مجاناً (OSM)
            </h1>
            
            {activeLoads.length > 0 && (
                <div className="w-full md:w-64">
                    <Select value={selectedLoad?.id} onValueChange={(val) => setSelectedLoad(activeLoads.find(l => l.id === val))}>
                        <SelectTrigger className="rounded-2xl border-none shadow-sm bg-white h-12 font-bold">
                            <SelectValue placeholder="اختر شحنة" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl font-bold">
                            {activeLoads.map(load => (
                                <SelectItem key={load.id} value={load.id}>{load.origin} ← {load.destination}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>

        {activeLoads.length === 0 ? (
            <Card className="rounded-[2.5rem] border-none shadow-sm py-20 text-center">
                <p className="text-slate-500 font-bold">لا توجد شحنات جارية حالياً</p>
            </Card>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* الخريطة - Leaflet (Free) */}
                <Card className="lg:col-span-2 rounded-[2.5rem] overflow-hidden border-none shadow-xl h-[600px] z-10">
                    <MapContainer 
                        center={[24.7136, 46.6753]} 
                        zoom={6} 
                        style={{ width: '100%', height: '100%' }}
                    >
                        {/* طبقة الخريطة المجانية من OpenStreetMap */}
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />

                        {/* نقطة التحميل */}
                        {selectedLoad?.origin_lat && (
                            <Marker position={[selectedLoad.origin_lat, selectedLoad.origin_lng]}>
                                <Popup>نقطة التحميل: {selectedLoad.origin}</Popup>
                            </Marker>
                        )}

                        {/* نقطة التوصيل */}
                        {selectedLoad?.dest_lat && (
                            <Marker position={[selectedLoad.dest_lat, selectedLoad.dest_lng]}>
                                <Popup>نقطة الوصول: {selectedLoad.destination}</Popup>
                            </Marker>
                        )}

                        {/* موقع الشاحنة المباشر */}
                        {currentLocation && (
                            <>
                                <Marker position={currentLocation} icon={truckIcon}>
                                    <Popup>الشاحنة الآن</Popup>
                                </Marker>
                                <RecenterMap coords={currentLocation} />
                            </>
                        )}

                        {/* رسم خط الرحلة */}
                        {selectedLoad?.origin_lat && selectedLoad?.dest_lat && (
                            <Polyline 
                                positions={[
                                    [selectedLoad.origin_lat, selectedLoad.origin_lng],
                                    currentLocation || [selectedLoad.origin_lat, selectedLoad.origin_lng],
                                    [selectedLoad.dest_lat, selectedLoad.dest_lng]
                                ]}
                                color="blue"
                                dashArray="10, 10"
                            />
                        )}
                    </MapContainer>
                </Card>

                {/* لوحة المعلومات الجانبية */}
                <div className="space-y-4">
                    <Card className="rounded-[2rem] border-none shadow-md bg-slate-900 text-white p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center"><Truck size={24}/></div>
                            <div>
                                <p className="text-xs opacity-70">رقم الرحلة</p>
                                <p className="font-black">#{selectedLoad?.id.slice(0, 8)}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-[2rem] border-none shadow-md p-6 space-y-6 bg-white">
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <div className="w-0.5 h-10 bg-slate-100"></div>
                                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                </div>
                                <div className="space-y-5">
                                    <div className="text-sm font-bold text-slate-700">{selectedLoad?.origin}</div>
                                    <div className="text-sm font-bold text-slate-700">{selectedLoad?.destination}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <div className="flex justify-between items-center text-blue-700">
                                <span className="text-xs font-bold">الحالة:</span>
                                <span className="text-xs font-black animate-pulse">يتم التتبع الآن...</span>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full h-12 rounded-xl border-2 font-bold gap-2 text-slate-600">
                            <ShieldCheck size={18}/> ضمان SAS فعال
                        </Button>
                    </Card>
                </div>
            </div>
        )}
      </div>
    </AppLayout>
  );
}
