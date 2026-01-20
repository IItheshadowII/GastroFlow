
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  ChevronRight, 
  ChevronDown, 
  Filter, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  BarChart2, 
  PieChart as PieIcon,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  FileText,
  // Added Loader2 to fix the error on line 134
  Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { db } from '../services/db';
import { Order, Product, Category } from '../types';

type Timeframe = 'daily' | 'weekly' | 'monthly';

export const ReportsPage: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
  const [reportData, setReportData] = useState<any>(null);

  const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  useEffect(() => {
    calculateReports();
  }, [tenantId, timeframe]);

  const calculateReports = () => {
    const orders = db.query<Order>('orders', tenantId).filter(o => o.status === 'PAID' && o.closedAt);
    const products = db.query<Product>('products', tenantId);
    const categories = db.query<Category>('categories', tenantId);

    const now = new Date();
    let startDate = new Date();

    if (timeframe === 'daily') startDate.setHours(0, 0, 0, 0);
    else if (timeframe === 'weekly') startDate.setDate(now.getDate() - 7);
    else if (timeframe === 'monthly') startDate.setMonth(now.getMonth() - 1);

    const periodOrders = orders.filter(o => new Date(o.closedAt!) >= startDate);
    
    // Comparación periodo anterior para tendencias
    let prevStartDate = new Date(startDate);
    if (timeframe === 'daily') prevStartDate.setDate(prevStartDate.getDate() - 1);
    else if (timeframe === 'weekly') prevStartDate.setDate(prevStartDate.getDate() - 7);
    else if (timeframe === 'monthly') prevStartDate.setMonth(prevStartDate.getMonth() - 1);
    
    const prevPeriodOrders = orders.filter(o => {
      const date = new Date(o.closedAt!);
      return date >= prevStartDate && date < startDate;
    });

    // 1. Métricas Principales
    const totalSales = periodOrders.reduce((acc, o) => acc + o.total, 0);
    const prevTotalSales = prevPeriodOrders.reduce((acc, o) => acc + o.total, 0);
    const salesGrowth = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;

    const totalOrders = periodOrders.length;
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    // 2. Tendencia Temporal (Chart)
    const trendData: any[] = [];
    if (timeframe === 'daily') {
      // Por horas del día
      for (let i = 0; i < 24; i++) {
        const hourSales = periodOrders
          .filter(o => new Date(o.closedAt!).getHours() === i)
          .reduce((acc, o) => acc + o.total, 0);
        trendData.push({ label: `${i}:00`, value: hourSales });
      }
    } else {
      // Por días
      const daysCount = timeframe === 'weekly' ? 7 : 30;
      for (let i = daysCount; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
        const daySales = periodOrders
          .filter(o => new Date(o.closedAt!).toDateString() === d.toDateString())
          .reduce((acc, o) => acc + o.total, 0);
        trendData.push({ label: dayLabel, value: daySales });
      }
    }

    // 3. Distribución Metodos Pago
    const payments = [
      { name: 'Efectivo', value: periodOrders.filter(o => o.paymentMethod === 'CASH').reduce((acc, o) => acc + o.total, 0) },
      { name: 'Tarjeta', value: periodOrders.filter(o => o.paymentMethod === 'CARD').reduce((acc, o) => acc + o.total, 0) },
      { name: 'Transferencia', value: periodOrders.filter(o => o.paymentMethod === 'TRANSFER').reduce((acc, o) => acc + o.total, 0) }
    ].filter(p => p.value > 0);

    // 4. Top Productos
    const prodMap: Record<string, { name: string, qty: number, total: number }> = {};
    periodOrders.forEach(o => {
      o.items.forEach(item => {
        if (!prodMap[item.productId]) prodMap[item.productId] = { name: item.name, qty: 0, total: 0 };
        prodMap[item.productId].qty += item.quantity;
        prodMap[item.productId].total += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(prodMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    setReportData({
      totalSales,
      salesGrowth,
      totalOrders,
      avgTicket,
      trendData,
      payments,
      topProducts
    });
  };

  const handleExport = () => {
    alert("Generando informe consolidado en formato PDF/CSV...");
    window.print();
  };

  if (!reportData) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={48} /></div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 print:p-0">
      {/* Header UI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button 
            onClick={() => setTimeframe('daily')} 
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeframe === 'daily' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Diario
          </button>
          <button 
            onClick={() => setTimeframe('weekly')} 
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeframe === 'weekly' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Semanal
          </button>
          <button 
            onClick={() => setTimeframe('monthly')} 
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeframe === 'monthly' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Mensual
          </button>
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center gap-3 px-8 py-3.5 bg-slate-100 hover:bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95"
        >
          <Printer size={18} /> Exportar Reporte
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Ingresos Totales" 
          value={`$${reportData.totalSales.toLocaleString()}`} 
          trend={reportData.salesGrowth} 
          icon={DollarSign} 
          color="blue"
        />
        <MetricCard 
          label="Volumen Órdenes" 
          value={reportData.totalOrders.toString()} 
          icon={ShoppingCart} 
          color="purple"
        />
        <MetricCard 
          label="Ticket Promedio" 
          value={`$${Math.round(reportData.avgTicket).toLocaleString()}`} 
          icon={TrendingUp} 
          color="emerald"
        />
        <MetricCard 
          label="Clientes Estimados" 
          value={(reportData.totalOrders * 2.5).toFixed(0)} 
          icon={Users} 
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Trend Chart */}
        <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-xl">
           <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-100 italic tracking-tight">Curva de Rendimiento</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Ingresos acumulados en el periodo</p>
              </div>
              <div className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20">
                <BarChart2 size={24} />
              </div>
           </div>

           <div className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={reportData.trendData}>
                 <defs>
                   <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                 <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                 <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '15px' }}
                   itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                 />
                 <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Payment Methods */}
        <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-xl flex flex-col">
          <h3 className="text-2xl font-black text-slate-100 italic tracking-tight mb-8">Mix de Cobro</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.payments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {reportData.payments.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Dato de Interés</p>
             <p className="text-xs text-slate-300 italic font-medium">El {((reportData.payments.find((p: any) => p.name === 'Efectivo')?.value || 0) / reportData.totalSales * 100).toFixed(1)}% de tus ingresos ingresan como cash físico.</p>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-slate-900/50 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl">
         <div className="flex items-center justify-between mb-10">
            <div>
               <h3 className="text-2xl font-black text-slate-100 italic tracking-tight">Top Performance</h3>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Los productos que más facturan en tu local</p>
            </div>
            <div className="flex items-center gap-3">
               <FileText className="text-slate-500" size={20} />
            </div>
         </div>

         <div className="space-y-4">
            {reportData.topProducts.map((prod: any, idx: number) => (
              <div key={idx} className="flex items-center gap-6 p-5 bg-slate-800/20 rounded-3xl border border-slate-800/50 hover:border-blue-500/30 transition-all group">
                 <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center font-black text-blue-400 border border-slate-700">
                    {idx + 1}
                 </div>
                 <div className="flex-1">
                    <h5 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{prod.name}</h5>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{prod.qty} Unidades vendidas</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xl font-black text-slate-100 italic">${prod.total.toLocaleString()}</p>
                    <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                       <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(prod.total / reportData.totalSales) * 100}%` }}></div>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, trend, icon: Icon, color }: any) => {
  const isPositive = trend >= 0;
  return (
    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
      <div className={`absolute -right-4 -top-4 w-20 h-20 bg-${color}-500/5 rounded-full blur-2xl group-hover:bg-${color}-500/10 transition-all`}></div>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
          <Icon size={24} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full border ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-100 italic tracking-tighter">{value}</h3>
    </div>
  );
};
