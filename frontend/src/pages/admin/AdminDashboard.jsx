import { useState, useEffect } from 'react';
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-jardinerie-primary/60 animate-pulse font-medium text-lg tracking-wide">
          Initialisation de l'espace...
        </div>
      </div>
    );
  }

  // Calcul du panier moyen (sécurisé contre la division par zéro)
  const averageOrderValue = data.salesMonth?.total_orders > 0 
    ? (data.salesMonth.total_sales / data.salesMonth.total_orders) 
    : 0;

  return (
    <div className="p-6 md:p-10 space-y-8 bg-slate-50/30 min-h-screen font-sans">
      
      {/* HEADER ÉPURÉ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vue d'ensemble</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">Indicateurs clés de votre activité commerciale.</p>
        </div>
      </div>

      {/* LIGNE 1 : KPIs FLOTTANTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CA DU MOIS */}
        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">CA du mois</CardTitle>
            <div className="p-2.5 bg-jardinerie-primary/5 rounded-xl">
              <TrendingUp className="h-4 w-4 text-jardinerie-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              {formatCurrency(data.salesMonth?.total_sales)}
            </div>
            <p className="text-xs text-gray-400 mt-2 font-medium">Consolidé sur 30 jours</p>
          </CardContent>
        </Card>

        {/* PANIER MOYEN */}
        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">Panier Moyen</CardTitle>
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <ShoppingBag className="h-4 w-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              {formatCurrency(averageOrderValue)}
            </div>
            <p className="text-xs text-gray-400 mt-2 font-medium">Sur le mois en cours</p>
          </CardContent>
        </Card>

        {/* COMMANDES EN ATTENTE */}
        <Card 
          className="bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl cursor-pointer group"
          onClick={() => navigate('/admin/commandes')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">À expédier</CardTitle>
            <div className="p-2.5 bg-blue-50/50 rounded-xl group-hover:bg-blue-50 transition-colors">
              <PackageOpen className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              {data.pendingOrdersCount}
            </div>
            <div className="text-xs text-blue-600 mt-2 font-semibold flex items-center group-hover:text-blue-700 transition-colors">
              Traiter les commandes <ArrowRight className="h-3 w-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>

        {/* ALERTES STOCK */}
        {/* Dans la carte ALERTES STOCK, modifiez le onClick ainsi : */}
<Card 
  className="bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl cursor-pointer group"
  onClick={() => navigate('/admin/catalogue?filter=critical')} 
>
{/* ... le reste de la carte ne change pas ... */}
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stock Critique</CardTitle>
            <div className={`p-2.5 rounded-xl transition-colors ${data.stockAlertsCount > 0 ? 'bg-red-50/50 group-hover:bg-red-50' : 'bg-green-50/50'}`}>
              <AlertTriangle className={`h-4 w-4 ${data.stockAlertsCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black tracking-tight ${data.stockAlertsCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {data.stockAlertsCount}
            </div>
            <div className={`text-xs mt-2 font-semibold flex items-center transition-colors ${data.stockAlertsCount > 0 ? 'text-red-600 group-hover:text-red-700' : 'text-green-600'}`}>
              {data.stockAlertsCount > 0 ? 'Réapprovisionner' : 'Stock sain'} <ArrowRight className="h-3 w-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* LIGNE 2 : GRAPHIQUE + PANNEAU LÉGER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRAPHIQUE ÉPURÉ */}
        <Card className="lg:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-sm font-bold text-gray-900">Ventes journalières</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesMonth?.breakdown || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="label" 
                    tickFormatter={formatXAxis} 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    axisLine={false} tickLine={false} dy={12} 
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    axisLine={false} tickLine={false} 
                    tickFormatter={(val) => `${val}€`} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                    formatter={(value) => [formatCurrency(value), 'CA']}
                    labelFormatter={(label) => `Le ${formatXAxis(label)}`}
                  />
                  {/* Barres affinées pour plus d'élégance */}
                  <Bar dataKey="total" fill="#027148" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PANNEAU LATÉRAL ALLÉGÉ */}
        <Card className="lg:col-span-1 bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-50">
            <CardTitle className="text-sm font-bold text-gray-900">Performances récentes</CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6 flex-grow flex flex-col justify-between space-y-6">
            
            <div className="space-y-6">
              {/* Aujourd'hui */}
              <div className="group flex items-start space-x-4">
                <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 group-hover:text-jardinerie-primary group-hover:bg-jardinerie-primary/5 transition-colors">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aujourd'hui</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(data.salesDay?.total_sales)}</p>
                </div>
              </div>

              {/* 7 derniers jours */}
              <div className="group flex items-start space-x-4">
                <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 group-hover:text-jardinerie-primary group-hover:bg-jardinerie-primary/5 transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">7 derniers jours</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(data.salesWeek?.total_sales)}</p>
                </div>
              </div>
            </div>

            {/* Bouton d'action doux ("Ghost/Soft Button") */}
            <button 
              onClick={() => navigate('/admin/catalogue')}
              className="w-full py-3 px-4 bg-jardinerie-primary/5 text-jardinerie-primary text-sm font-bold rounded-xl hover:bg-jardinerie-primary hover:text-white transition-all duration-300 flex items-center justify-between group"
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