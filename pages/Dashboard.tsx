
import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, AlertCircle, ShoppingBag, Utensils, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { db } from '../services/db';
import { Order, Product, Category } from '../types';

interface DashboardStats {
  totalSales: number;
  ordersCount: number;
  averageTicket: number;
  stockAlerts: number;
  salesTrend: any[];
  categoryDistribution: any[];
}

const StatCard = ({ label, value, trend, icon: Icon, color, suffix = "" }: any) => (
  <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-500/5 rounded-full blur-2xl group-hover:bg-${color}-500/10 transition-all duration-500`}></div>
    <div className="flex justify-between items-start mb-6 relative z-10">
      <div className={`p-4 rounded-2xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`text-[10px] font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest`}>
          +{trend}%
        </span>
      )}
    </div>
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
    <h3 className="text-3xl font-black text-slate-100 italic tracking-tighter">
      {suffix}{value}
    </h3>
  </div>
);

export const Dashboard: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    ordersCount: 0,
    averageTicket: 0,
    stockAlerts: 0,
    salesTrend: [],
    categoryDistribution: []
  });

  useEffect(() => {
    calculateStats();
  }, [tenantId]);

  const calculateStats = () => {
    const orders = db.query<Order>('orders', tenantId).filter(o => o.status === 'PAID');
    const products = db.query<Product>('products', tenantId);
    const categories = db.query<Category>('categories', tenantId);

    // 1. Basic Metrics
    const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
    const ordersCount = orders.length;
    const averageTicket = ordersCount > 0 ? Math.round(totalSales / ordersCount) : 0;
    const stockAlerts = products.filter(p => p.stockEnabled && p.stockQuantity <= p.stockMin).length;

    // 2. Sales Trend (Last 7 Days)
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const trendMap: Record<string, number> = {};
    
    // Pre-fill last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = days[d.getDay()];
      trendMap[dayLabel] = 0;
    }

    orders.forEach(o => {
      if (!o.closedAt) return;
      const date = new Date(o.closedAt);
      const dayLabel = days[date.getDay()];
      if (trendMap[dayLabel] !== undefined) {
        trendMap[dayLabel] += o.total;
      }
    });

    const salesTrend = Object.entries(trendMap).map(([name, sales]) => ({ name, sales }));

    // 3. Category Distribution
    const catMap: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = categories.find(c => c.id === prod?.categoryId);
        const catName = cat?.name || 'Otros';
        catMap[catName] = (catMap[catName] || 0) + (item.price * item.quantity);
      });
    });

    const categoryDistribution = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories

    setStats({
      totalSales,
      ordersCount,
      averageTicket,
      stockAlerts,
      salesTrend,
      categoryDistribution
    });
  };

  const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Ventas Totales" 
          value={stats.totalSales.toLocaleString()} 
          trend="12.5" 
          icon={DollarSign} 
          color="blue" 
          suffix="$"
        />
        <StatCard 
          label="Órdenes Cerradas" 
          value={stats.ordersCount.toLocaleString()} 
          trend="8.2" 
          icon={ShoppingBag} 
          color="purple" 
        />
        <StatCard 
          label="Ticket Promedio" 
          value={stats.averageTicket.toLocaleString()} 
          trend="4.1" 
          icon={TrendingUp} 
          color="emerald" 
          suffix="$"
        />
        <StatCard 
          label="Alertas de Stock" 
          value={stats.stockAlerts.toLocaleString()} 
          icon={AlertCircle} 
          color="amber" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Trend Chart */}
        <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-100 italic tracking-tight flex items-center gap-3">
                <Calendar className="text-blue-400" size={24} /> Tendencia Semanal
              </h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Evolución de ingresos últimos 7 días</p>
            </div>
            <div className="flex items-center gap-2">
               <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas $</span>
            </div>
          </div>
          
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.salesTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={15}
                  tick={{ fontWeight: 800, textTransform: 'uppercase' }}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${val > 999 ? (val/1000).toFixed(1) + 'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #1e293b', 
                    borderRadius: '20px',
                    padding: '15px'
                  }}
                  itemStyle={{ color: '#f8fafc', fontWeight: '900', fontSize: '14px' }}
                  labelStyle={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories Chart */}
        <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <h3 className="text-2xl font-black text-slate-100 italic tracking-tight mb-2 flex items-center gap-3">
            <Utensils className="text-purple-400" size={24} /> Top Mix
          </h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10">Ingresos por categoría</p>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  width={80}
                  tick={{ fontWeight: 800 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '15px' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                  {stats.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 space-y-3">
            {stats.categoryDistribution.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></div>
                  <span className="font-bold text-slate-400">{cat.name}</span>
                </div>
                <span className="font-black text-slate-200">${cat.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
