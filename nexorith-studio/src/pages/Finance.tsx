import React, { useState, useEffect, useMemo } from 'react';
import { 
  CircleDollarSign, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, Plus, 
  Search, Filter, Trash2, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { financeService, Transaction } from '../lib/financeService';
import { FinanceModal } from '../components/FinanceModal';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const FinancePage = () => {
  const { hasPermission } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const canManage = hasPermission('manage_finance');

  useEffect(() => {
    return financeService.subscribeToTransactions(setTransactions);
  }, []);

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    return { income, expenses, balance };
  }, [transactions]);

  const chartData = useMemo(() => {
    // Group transactions by month for the last 6 months
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return d.toLocaleString('default', { month: 'short' });
    }).reverse();

    return months.map(month => {
      const monthTransactions = transactions.filter(t => {
        const d = t.date.toDate ? t.date.toDate() : new Date(t.date);
        return d.toLocaleString('default', { month: 'short' }) === month;
      });
      
      return {
        name: month,
        income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expenses: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      };
    });
  }, [transactions]);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await financeService.deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Finance Engine</h1>
          <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1">Strategic financial overview and audit</p>
        </div>
        {canManage && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple/90 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            Add Transaction
          </button>
        )}
      </header>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Liquidity</p>
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <h3 className="text-2xl font-bold text-white">${stats.balance.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-green-400 mb-1">Net Balance</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Gross Revenue</p>
            <div className="w-8 h-8 rounded-lg bg-brand-purple/10 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-brand-purple" />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <h3 className="text-2xl font-bold text-white">${stats.income.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-brand-purple mb-1">Incoming</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Burn</p>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <h3 className="text-2xl font-bold text-white">${stats.expenses.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-red-400 mb-1">Outgoing</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Revenue Stream</h3>
              <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Income vs Expenses Analysis</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={10} 
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                   stroke="rgba(255,255,255,0.2)" 
                   fontSize={10} 
                   fontWeight="bold"
                   axisLine={false}
                   tickLine={false}
                   tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '12px'
                  }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="income" stroke="#a855f7" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
           <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Growth Projection</h3>
              <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Monthly Net Accumulation</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                 <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={10} 
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                   stroke="rgba(255,255,255,0.2)" 
                   fontSize={10} 
                   fontWeight="bold"
                   axisLine={false}
                   tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '12px'
                  }} 
                />
                <Bar 
                  dataKey={(d) => d.income - d.expenses} 
                  name="Net Profit"
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-white tracking-tight">Ledger entries</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input 
                type="text"
                placeholder="Search ledger..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all w-full md:w-64"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="all" className="bg-dark-bg">All Entries</option>
              <option value="income" className="bg-dark-bg">Income Only</option>
              <option value="expense" className="bg-dark-bg">Expenses Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-white/30 uppercase tracking-widest">Entry Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-white/30 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-white/30 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-white/30 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-white/30 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={t.id} 
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-white/20" />
                          <span className="text-xs text-white/60 font-medium">
                            {new Date(t.date.toDate ? t.date.toDate() : t.date).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-white font-semibold truncate max-w-[200px]">{t.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-white/40 uppercase tracking-widest">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xs font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canManage && (
                          <button 
                            onClick={() => handleDelete(t.id)}
                            className="p-2 text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <CircleDollarSign className="w-12 h-12 text-white/5 mb-4" />
                        <p className="text-sm font-bold text-white/20 uppercase tracking-widest">No ledger entries found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <FinanceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};
