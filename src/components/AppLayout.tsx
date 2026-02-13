import { ReactNode, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, Package, Truck, Settings, LogOut, 
  Plus, Globe, MapPin, User, Users, BarChart3, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import NotificationCenter from './NotificationCenter';
import { motion } from 'framer-motion';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { currentRole, logout, userProfile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // تحديد القوائم بناءً على الرتبة
  const navItems = useMemo(() => {
    if (!currentRole) return [];
    const menu = {
      admin: [
        { label: 'الإحصائيات', path: '/admin/dashboard', icon: <BarChart3 size={22}/> },
        { label: 'المستخدمين', path: '/admin/users', icon: <Users size={22}/> },
        { label: 'الشحنات', path: '/admin/loads', icon: <Package size={22}/> },
      ],
      shipper: [
        { label: 'الرئيسية', path: '/shipper/dashboard', icon: <LayoutDashboard size={22}/> },
        { label: 'نشر طلب', path: '/shipper/post', icon: <Plus size={22}/> },
        { label: 'تتبع', path: '/shipper/track', icon: <MapPin size={22}/> },
      ],
      driver: [
        { label: 'الرئيسية', path: '/driver/dashboard', icon: <LayoutDashboard size={22}/> },
        { label: 'السوق', path: '/driver/loads', icon: <Package size={22}/> },
        { label: 'شاحناتي', path: '/driver/trucks', icon: <Truck size={22}/> },
      ]
    };
    return menu[currentRole as keyof typeof menu] || menu.driver;
  }, [currentRole]);

  // حماية من الشاشة البيضاء أثناء التحميل
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0f172a]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-4">SAS Global Systems</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc]">
      
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-72 bg-[#0f172a] text-white flex-col h-screen sticky top-0 shrink-0 shadow-2xl">
        <div className="p-8 mb-4">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Truck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter italic text-white leading-none">SAS<span className="text-blue-400">.</span></h1>
              <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Logistics Intelligence</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300",
                isActive ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30" : "text-slate-400 hover:text-white hover:bg-white/5"
              )}>
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <Button variant="ghost" className="w-full justify-start gap-3 text-rose-400 font-black hover:bg-rose-500/10 rounded-2xl h-12" onClick={logout}>
            <LogOut size={18} /> خروج
          </Button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
          <div className="flex items-center gap-3">
             <div className="lg:hidden w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                <Truck size={18} className="text-white" />
             </div>
             <h2 className="font-black text-slate-800 text-sm md:text-md truncate">
                {navItems.find(i => i.path === location.pathname)?.label || 'الرئيسية'}
             </h2>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <User size={18} />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 w-full max-w-[1500px] mx-auto pb-24 lg:pb-8">
           {children}
        </div>
      </main>

      {/* Bottom Nav - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t px-1 h-16 flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={cn(
              "flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-300 relative",
              isActive ? "text-blue-600" : "text-slate-400"
            )}>
              {isActive && <motion.div layoutId="nav-line" className="absolute -top-[1px] w-8 h-0.5 bg-blue-600 rounded-full" />}
              <div className={cn("p-1.5 rounded-xl", isActive ? "bg-blue-50" : "")}>
                {item.icon}
              </div>
              <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
        <button onClick={logout} className="flex flex-col items-center justify-center gap-0.5 w-16 h-full text-rose-400">
             <LogOut size={20} />
             <span className="text-[8px] font-black uppercase tracking-tighter">خروج</span>
        </button>
      </nav>

    </div>
  );
}
