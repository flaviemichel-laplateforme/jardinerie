import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle, 
  PackageOpen, 
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminService } from '@/services/adminService';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [chartRange, setChartRange] = useState('month'); 

  const [data, setData] = useState({
    salesDay: null,
    salesWeek: null,
    salesMonth: null,
    pendingOrdersCount: 0,
    stockAlertsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dayRes, weekRes, monthRes, ordersRes, stockRes] = await Promise.all([
          adminService.getSalesKpi('day'),
          adminService.getSalesKpi('week'),
          adminService.getSalesKpi('month'),
          adminService.getOrdersByStatus('pending'),
          adminService.getStockAlerts()
        ]);

        setData({
          salesDay: dayRes.data,
          salesWeek: weekRes.data,
          salesMonth: monthRes.data,
          pendingOrdersCount: ordersRes.data?.pagination?.total_items || 0,
          stockAlertsCount: stockRes.data?.alerts_count || 0,
        });
      } catch (error) {
        console.error("Échec du chargement des composants du tableau de bord:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };

  // Optimisation de la mémoire et des calculs
  const averageOrderValue = useMemo(() => {
    if (!data.salesMonth || data.salesMonth.total_orders === 0) return 0;
    return data.salesMonth.total_sales / data.salesMonth.total_orders;
  }, [data.salesMonth]);

  const chartData = useMemo(() => {
    return chartRange === 'week' ? data.salesWeek?.breakdown : data.salesMonth?.breakdown;
  }, [chartRange, data.salesWeek, data.salesMonth]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-jardinerie-primary/60 animate-pulse font-medium text-lg tracking-wide">
          Initialisation de l'espace...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1880px] p-6 md:p-10 space-y-8 bg-slate-50/30 min-h-screen font-sans">
      
      <div className="mb-10 flex flex-col md:flex-row items-start md:items-end justify-between border-b border-jardinerie-primary/20 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-jardinerie-text">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm font-medium text-jardinerie-text/60">
            Indicateurs clés de votre activité commerciale.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CA DU MOIS */}
        <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col justify-between min-h-[150px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">CA du mois</CardTitle>
            <div className="p-2.5 bg-jardinerie-primary/5 rounded-xl">
              <TrendingUp className="h-4 w-4 text-jardinerie-primary" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="text-3xl font-extrabold text-slate-700 tracking-tight">
              {formatCurrency(data.salesMonth?.total_sales)}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Consolidé sur 30 jours</p>
          </CardContent>
        </Card>

        {/* PANIER MOYEN */}
        <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col justify-between min-h-[150px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Panier Moyen</CardTitle>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <ShoppingBag className="h-4 w-4 text-slate-500" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="text-3xl font-extrabold text-slate-700 tracking-tight">
              {formatCurrency(averageOrderValue)}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Sur le mois en cours</p>
          </CardContent>
        </Card>

        {/* COMMANDES EN ATTENTE */}
        <Card 
          className="bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl cursor-pointer group flex flex-col justify-between min-h-[150px]"
          onClick={() => navigate('/admin/commandes')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">À expédier</CardTitle>
            <div className="p-2.5 bg-blue-50/50 rounded-xl group-hover:bg-blue-50 transition-colors">
              <PackageOpen className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="text-3xl font-extrabold text-slate-700 tracking-tight">
              {data.pendingOrdersCount}
            </div>
            <div className="text-xs text-blue-600 mt-2 font-semibold flex items-center group-hover:text-blue-700 transition-colors">
              Traiter les expéditions <ArrowRight className="h-3 w-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>

        {/* ALERTES STOCK */}
        <Card 
          className="bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl cursor-pointer group flex flex-col justify-between min-h-[150px]"
          onClick={() => navigate('/admin/catalogue?filter=critical')} 
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Critique</CardTitle>
            <div className={`p-2.5 rounded-xl transition-colors ${data.stockAlertsCount > 0 ? 'bg-red-50/50 group-hover:bg-red-50' : 'bg-green-50/50'}`}>
              <AlertTriangle className={`h-4 w-4 ${data.stockAlertsCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className={`text-3xl font-extrabold tracking-tight ${data.stockAlertsCount > 0 ? 'text-red-600' : 'text-slate-700'}`}>
              {data.stockAlertsCount}
            </div>
            <div className={`text-xs mt-2 font-semibold flex items-center transition-colors ${data.stockAlertsCount > 0 ? 'text-red-600 group-hover:text-red-700' : 'text-green-600'}`}>
              {data.stockAlertsCount > 0 ? 'Réapprovisionner' : 'Stock sain'} <ArrowRight className="h-3 w-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRAPHIQUE */}
        <Card className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-700">Dynamique des ventes</CardTitle>
            
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setChartRange('week')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  chartRange === 'week' ? 'bg-white text-jardinerie-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                7 jours
              </button>
              <button 
                onClick={() => setChartRange('month')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  chartRange === 'month' ? 'bg-white text-jardinerie-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                30 jours
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="px-6 pb-6 pt-0">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  {/* 🚀 IMPLÉMENTATION DES REM */}
                  <XAxis 
                    dataKey="label" 
                    tickFormatter={formatXAxis} 
                    tick={{ fill: '#94a3b8', fontSize: '0.75rem' }} 
                    axisLine={false} tickLine={false} dy={12} 
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: '0.75rem' }} 
                    axisLine={false} tickLine={false} 
                    tickFormatter={(val) => `${val}€`} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                    formatter={(value) => [formatCurrency(value), 'Chiffre d\'Affaires']}
                    labelFormatter={(label) => `Le ${formatXAxis(label)}`}
                  />
                  <Bar dataKey="total" fill="#027148" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PANNEAU LATÉRAL */}
        <Card className="lg:col-span-1 bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col">
          <CardHeader className="p-6 border-b border-slate-50 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-700">Performances récentes</CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 flex-grow flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="group flex items-start space-x-4">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:text-jardinerie-primary group-hover:bg-jardinerie-primary/5 transition-colors">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aujourd'hui</p>
                  <p className="text-xl font-extrabold text-slate-700 mt-1">{formatCurrency(data.salesDay?.total_sales)}</p>
                </div>
              </div>

              <div className="group flex items-start space-x-4">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:text-jardinerie-primary group-hover:bg-jardinerie-primary/5 transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">7 derniers jours</p>
                  <p className="text-xl font-extrabold text-slate-700 mt-1">{formatCurrency(data.salesWeek?.total_sales)}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/admin/catalogue')}
              className="w-full py-3 px-4 bg-jardinerie-primary/5 text-jardinerie-primary text-sm font-bold rounded-xl hover:bg-jardinerie-primary hover:text-white transition-all duration-300 flex items-center justify-between group outline-none"
            >
              <span>Accéder au catalogue</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
            
          </CardContent>
        </Card>

      </div>
    </div>
  );
}