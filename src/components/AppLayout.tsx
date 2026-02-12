import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Package, Truck, Users, Settings, LogOut, 
  FileText, MessageSquare, History, Plus, Menu, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NotificationCenter from './NotificationCenter'; // استيراد الجرس

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userProfile, currentRole, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // الدوال المساعدة لجلب عناصر القائمة...
  const navItems = getNavItems(currentRole || 'driver', t);

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      <aside className={cn(
        "fixed lg:static inset-y-0 start-0 z-50 w-72 bg-[#0f172a] text-white flex flex-col transition-transform duration-300 shadow-2xl",
        sidebarOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-xl italic">SAS</div>
          <div>
            <h1 className="font-black text-lg tracking-tight">SAS Transport</h1>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{currentRole}</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={cn("flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all",
                location.pathname === item.path ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/50 hover:bg-white/5 hover:text-white"
              )}>
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <Button variant="ghost" className="w-full justify-start gap-4 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl h-14 font-bold" onClick={logout}>
            <LogOut size={20} /> {t('logout')}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden rounded-xl bg-slate-100" onClick={() => setSidebarOpen(true)}>
                <Menu size={22} />
              </Button>
              <h2 className="font-black text-xl text-slate-800 hidden sm:block">
                {navItems.find(i => i.path === location.pathname)?.label || t('dashboard')}
              </h2>
          </div>
          <NotificationCenter /> {/* جرس الإشعارات هنا */}
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}

// عناصر القائمة (تأكد من وجودها)
function getNavItems(role: string, t: any) {
    if (role === 'driver') return [
        { label: 'لوحة القيادة', path: '/driver/dashboard', icon: <LayoutDashboard size={20}/> },
        { label: 'الشحنات المتاحة', path: '/driver/loads', icon: <Package size={20}/> },
        { label: 'شاحناتي', path: '/driver/trucks', icon: <Truck size={20}/> },
        { label: 'سجل الرحلات', path: '/driver/history', icon: <History size={20}/> },
        { label: 'حسابي', path: '/driver/account', icon: <Settings size={20}/> },
    ];
    if (role === 'shipper') return [
        { label: 'لوحة القيادة', path: '/shipper/dashboard', icon: <LayoutDashboard size={20}/> },
        { label: 'نشر شحنة', path: '/shipper/post', icon: <Plus size={20}/> },
        { label: 'شحناتي', path: '/shipper/loads', icon: <Package size={20}/> },
        { label: 'تتبع', path: '/shipper/track', icon: <Navigation size={20}/> },
        { label: 'حسابي', path: '/shipper/account', icon: <Settings size={20}/> },
    ];
    return [
        { label: 'الأدمن', path: '/admin/dashboard', icon: <LayoutDashboard size={20}/> },
        { label: 'المستخدمين', path: '/admin/users', icon: <Users size={20}/> },
        { label: 'الشحنات', path: '/admin/loads', icon: <Package size={20}/> },
    ];
}

function Navigation(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>; }
