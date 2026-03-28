import React, { useState, useEffect, useMemo } from 'react';
import { Quotation, Product } from '../types';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, subMonths } from 'date-fns';

export default function Dashboard() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const [quotRes, prodRes] = await Promise.all([
      fetch('/api/quotations', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    if (quotRes.ok) setQuotations(await quotRes.json());
    if (prodRes.ok) setProducts(await prodRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = quotations.reduce((sum, q) => sum + q.totalDiscounted, 0);
    const confirmedCount = quotations.filter(q => q.status === 'confirmed').length;
    const totalProducts = products.length;
    const totalClients = new Set(quotations.map(q => q.clientName)).size;

    return [
      { label: '累计报价金额', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: '已确认订单', value: confirmedCount, icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
      { label: '活跃客户数', value: totalClients, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: '产品库总量', value: totalProducts, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];
  }, [quotations, products]);

  const chartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), i);
      return format(date, 'yyyy-MM');
    }).reverse();

    return last6Months.map(month => {
      const monthQuotes = quotations.filter(q => q.createdAt.startsWith(month));
      return {
        name: month,
        amount: monthQuotes.reduce((sum, q) => sum + q.totalDiscounted, 0),
        count: monthQuotes.length
      };
    });
  }, [quotations]);

  const statusData = useMemo(() => {
    const counts = quotations.reduce((acc, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: '草稿', value: counts.draft || 0, color: '#94a3b8' },
      { name: '已发送', value: counts.sent || 0, color: '#3b82f6' },
      { name: '已确认', value: counts.confirmed || 0, color: '#22c55e' },
      { name: '已取消', value: counts.cancelled || 0, color: '#ef4444' },
    ];
  }, [quotations]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">数据概览</h2>
        <p className="text-gray-500">实时监控业务动态与报价统计</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900">近六个月报价趋势</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span> 报价金额 (元)
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-8">报价单状态分布</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {statusData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">最新报价动态</h3>
        <div className="divide-y divide-gray-100">
          {quotations.slice(0, 5).map((q, i) => (
            <div key={i} className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{q.clientName}</p>
                  <p className="text-xs text-gray-400">{formatDate(q.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-blue-600">{formatCurrency(q.totalDiscounted)}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold">{q.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
