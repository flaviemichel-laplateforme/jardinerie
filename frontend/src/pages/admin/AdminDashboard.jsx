import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';

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

  // Optimisations
  const averageOrderValue = useMemo(() => {
    if (!data.salesMonth || data.salesMonth.total_orders === 0) return 0;
    return data.salesMonth.total_sales / data.salesMonth.total_orders;
  }, [data.salesMonth]);

  const chartData = useMemo(() => {
    return chartRange === 'week' ? data.salesWeek?.breakdown : data.salesMonth?.breakdown;
  }, [chartRange, data.salesWeek, data.salesMonth]);

  // 🚀 LOGIQUE DU GRAPHIQUE NATIF
  // On calcule la valeur maximale pour définir la hauteur à 100%
  const maxChartValue = useMemo(() => {
    if (!chartData || chartData.length === 0) return 1;
    return Math.max(...chartData.map(item => item.total), 1);
  }, [chartData]);

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
      
      {/* HEADER */}
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

      {/* LIGNE 1a : Indicateurs clés (informatifs, aucune action requise) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indicateurs clés</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* CA DU MOIS */}
        <div className="bg-white border border-slate-200 shadow rounded-2xl flex flex-col justify-between min-h-[150px]">
          <div className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">CA du mois</h3>
            <div className="p-2.5 bg-jardinerie-primary/5 rounded-xl">
              {/* SVG pur (TrendingUp) */}
              <svg className="w-4 h-4 text-jardinerie-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="px-6 pb-6 pt-0">
            <div className="text-3xl font-extrabold text-slate-700 tracking-tight">
              {formatCurrency(data.salesMonth?.total_sales)}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Consolidé sur 30 jours</p>
          </div>
        </div>

        {/* PANIER MOYEN */}
        <div className="bg-white border border-slate-200 shadow rounded-2xl flex flex-col justify-between min-h-[150px]">
          <div className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Panier Moyen</h3>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              {/* SVG pur (ShoppingBag) */}
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="px-6 pb-6 pt-0">
            <div className="text-3xl font-extrabold text-slate-700 tracking-tight">
              {formatCurrency(averageOrderValue)}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Sur le mois en cours</p>
          </div>
        </div>

        </div>
      </div>

      {/* LIGNE 1b : Actions requises (nécessitent une intervention de l'admin) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actions requises</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* COMMANDES EN ATTENTE */}
        <button
          type="button"
          className="w-full text-left bg-white border border-slate-200 shadow hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl group flex flex-col justify-between min-h-[150px]"
          onClick={() => navigate('/admin/commandes')}
        >
          <div className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">À expédier</h3>
            <div className="p-2.5 bg-blue-50/50 rounded-xl group-hover:bg-blue-50 transition-colors">
              {/* SVG pur (Package) */}
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="px-6 pb-6 pt-0">
            <div className="text-3xl font-extrabold text-slate-700 tracking-tight">
              {data.pendingOrdersCount}
            </div>
            <div className="text-xs text-blue-600 mt-2 font-semibold flex items-center group-hover:text-blue-700 transition-colors">
              Traiter les expéditions 
              {/* SVG pur (ArrowRight) */}
              <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </button>

        {/* ALERTES STOCK */}
        <button
          type="button"
          className="w-full text-left bg-white border border-slate-200 shadow hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl group flex flex-col justify-between min-h-[150px]"
          onClick={() => navigate('/admin/catalogue?filter=critical')}
        >
          <div className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Critique</h3>
            <div className={`p-2.5 rounded-xl transition-colors ${data.stockAlertsCount > 0 ? 'bg-red-50/50 group-hover:bg-red-50' : 'bg-green-50/50'}`}>
              {/* SVG pur (Alert) */}
              <svg className={`w-4 h-4 ${data.stockAlertsCount > 0 ? 'text-red-500' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="px-6 pb-6 pt-0">
            <div className={`text-3xl font-extrabold tracking-tight ${data.stockAlertsCount > 0 ? 'text-red-600' : 'text-slate-700'}`}>
              {data.stockAlertsCount}
            </div>
            <div className={`text-xs mt-2 font-semibold flex items-center transition-colors ${data.stockAlertsCount > 0 ? 'text-red-600 group-hover:text-red-700' : 'text-green-600'}`}>
              {data.stockAlertsCount > 0 ? 'Réapprovisionner' : 'Stock sain'}
              <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </button>

        </div>
      </div>

      {/* LIGNE 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRAPHIQUE NATIF 100% CSS/FLEXBOX */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow rounded-2xl flex flex-col">
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-slate-700">Dynamique des ventes</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setChartRange('week')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${chartRange === 'week' ? 'bg-white text-jardinerie-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                7 jours
              </button>
              <button 
                onClick={() => setChartRange('month')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${chartRange === 'month' ? 'bg-white text-jardinerie-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                30 jours
              </button>
            </div>
          </div>
          
          <div className="px-6 pb-6 flex-grow">
            {/* Conteneur du graphique flex */}
            <div className="h-[280px] w-full flex items-end justify-between pt-8 border-b border-slate-200 relative">
              {/* Lignes de repère (Optionnel, juste pour l'esthétique) */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-slate-50 w-full h-0"></div>
                <div className="border-t border-slate-50 w-full h-0"></div>
                <div className="border-t border-slate-50 w-full h-0"></div>
                <div className="border-t border-slate-50 w-full h-0"></div>
              </div>

              {chartData && chartData.map((item, index) => {
                // Calcul du pourcentage de hauteur par rapport au max (évite les divisions par zéro)
                const barHeight = maxChartValue > 0 ? Math.max((item.total / maxChartValue) * 100, 2) : 0; 
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group relative h-full justify-end z-10">
                    
                    {/* Tooltip CSS Pur (Visible au hover) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-8 bg-slate-800 text-white text-[11px] py-1 px-2 rounded pointer-events-none whitespace-nowrap shadow-lg">
                      {formatCurrency(item.total)}
                    </div>

                    {/* La barre de progression CSS */}
                    <div 
                      className="w-full max-w-[24px] bg-jardinerie-primary rounded-t-sm transition-all duration-500 ease-out hover:opacity-80" 
                      style={{ height: `${barHeight}%` }}
                    ></div>
                    
                    {/* L'étiquette de l'axe X (Optionnel: n'afficher qu'un jour sur deux si trop compressé) */}
                    <span className="text-[10px] text-slate-400 mt-2 truncate max-w-full px-1">
                      {formatXAxis(item.label)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANNEAU LATÉRAL */}
        <div className="lg:col-span-1 bg-white border border-slate-200 shadow rounded-2xl flex flex-col">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-700">Performances récentes</h3>
          </div>
          
          <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="group flex items-start space-x-4">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:text-jardinerie-primary group-hover:bg-jardinerie-primary/5 transition-colors">
                  {/* SVG pur (Clock) */}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aujourd'hui</p>
                  <p className="text-xl font-extrabold text-slate-700 mt-1">{formatCurrency(data.salesDay?.total_sales)}</p>
                </div>
              </div>

              <div className="group flex items-start space-x-4">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:text-jardinerie-primary group-hover:bg-jardinerie-primary/5 transition-colors">
                  {/* SVG pur (Calendar) */}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
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
              {/* SVG pur (ChevronRight) */}
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
          </div>
        </div>

      </div>
    </div>
  );
}