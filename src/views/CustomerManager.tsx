import React, { useState, useEffect } from 'react';
import { Customer, Quotation, Contract } from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  MoreVertical,
  ExternalLink,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronDown,
  Eye
} from 'lucide-react';
import { cn, formatDate, formatCurrency } from '../lib/utils';

export default function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingDetails, setViewingDetails] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
    notes: ''
  });

  const fetchCustomers = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/customers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      setCustomers(await response.json());
    }
  };

  const fetchQuotations = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/quotations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      setQuotations(await response.json());
    }
  };

  const fetchContracts = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/contracts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      setContracts(await response.json());
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchQuotations();
    fetchContracts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const data = {
      ...formData,
      createdAt: editingId ? customers.find(c => c.id === editingId)?.createdAt : new Date().toISOString()
    };
    
    try {
      if (editingId) {
        await fetch(`/api/customers/${editingId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
        setEditingId(null);
      } else {
        await fetch('/api/customers', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
        setIsAdding(false);
      }
      setFormData({ name: '', contactPerson: '', phone: '', email: '', address: '', taxId: '', notes: '' });
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("保存失败，请检查权限。");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该客户吗？')) {
      const token = localStorage.getItem('token');
      await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCustomers();
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            客户管理
          </h2>
          <p className="text-gray-500">维护客户档案、联系方式及开票信息</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 w-fit font-semibold"
        >
          <Plus className="w-5 h-5" />
          新增客户
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索客户名称、联系人或电话..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center bg-gray-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium",
              viewMode === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <List className="w-4 h-4" />
            列表
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium",
              viewMode === 'grid' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            卡片
          </button>
        </div>
        <div className="text-sm text-gray-400 font-medium whitespace-nowrap">
          共 {filteredCustomers.length} 位客户
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-gray-900">{editingId ? '编辑客户信息' : '录入新客户'}</h3>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">客户/单位名称</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="请输入完整的单位名称"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">联系人</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">联系电话</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="手机或座机"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">电子邮箱</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="example@mail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">纳税人识别号</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="开票用税号"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-bold text-gray-700 mb-2">详细地址</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="公司或个人详细地址"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-bold text-gray-700 mb-2">备注信息</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                placeholder="客户偏好、合作历史等..."
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="px-8 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all font-semibold"
              >
                取消
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-12 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-100"
              >
                {editingId ? '更新资料' : '保存客户'}
              </button>
            </div>
          </form>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => (
            <CustomerCard 
              key={customer.id} 
              customer={customer}
              onView={() => setViewingDetails(customer)}
              onEdit={() => {
                setEditingId(customer.id);
                setFormData(customer);
              }}
              onDelete={() => handleDelete(customer.id)}
            />
          ))}
          
          {filteredCustomers.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium italic">未找到匹配的客户记录</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-10"></th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">客户名称</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">联系人</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">联系电话</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">业务统计</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCustomers.map(customer => (
                  <CustomerRow 
                    key={customer.id}
                    customer={customer}
                    isExpanded={expandedIds.has(customer.id)}
                    onToggleExpand={() => toggleExpand(customer.id)}
                    onView={() => setViewingDetails(customer)}
                    onEdit={() => {
                      setEditingId(customer.id);
                      setFormData(customer);
                    }}
                    onDelete={() => handleDelete(customer.id)}
                    quotations={quotations.filter(q => q.customerId === customer.id)}
                    contracts={contracts.filter(c => c.customerId === customer.id)}
                  />
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-medium italic">未找到匹配的客户记录</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewingDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">客户详情与关联记录</h3>
              <button onClick={() => setViewingDetails(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">基本信息</h4>
                  <div className="space-y-3">
                    <p className="text-xl font-bold text-gray-900">{viewingDetails.name}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 mb-1">联系人</p>
                        <p className="font-medium text-gray-900">{viewingDetails.contactPerson || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">联系电话</p>
                        <p className="font-medium text-gray-900">{viewingDetails.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">电子邮箱</p>
                        <p className="font-medium text-gray-900">{viewingDetails.email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">税号</p>
                        <p className="font-medium text-blue-600">{viewingDetails.taxId || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1 text-sm">详细地址</p>
                      <p className="text-sm text-gray-900">{viewingDetails.address || '-'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">业务概览</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">累计报价</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-blue-700">
                          {quotations.filter(q => q.customerId === viewingDetails.id).length}
                        </span>
                        <span className="text-xs font-bold text-blue-500">份</span>
                      </div>
                      <p className="text-[10px] text-blue-600 font-bold mt-1">
                        总额: ¥{quotations.filter(q => q.customerId === viewingDetails.id).reduce((sum, q) => sum + q.totalDiscounted, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">累计合同</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-purple-700">
                          {contracts.filter(c => c.customerId === viewingDetails.id).length}
                        </span>
                        <span className="text-xs font-bold text-purple-500">份</span>
                      </div>
                      <p className="text-[10px] text-purple-600 font-bold mt-1">
                        总额: ¥{contracts.filter(c => c.customerId === viewingDetails.id).reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 min-h-[60px] whitespace-pre-wrap">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">备注信息</p>
                    {viewingDetails.notes || '暂无备注'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">关联报价单</h4>
                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {quotations.filter(q => q.customerId === viewingDetails.id).length} 份
                    </span>
                  </div>
                  <div className="space-y-2">
                    {quotations.filter(q => q.customerId === viewingDetails.id).map(q => (
                      <div key={q.id} className="p-3 border border-gray-100 rounded-xl hover:border-blue-200 transition-all bg-gray-50/30">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-gray-900 truncate pr-2">{q.clientName}</p>
                          <span className="text-xs font-bold text-blue-600 shrink-0">¥{q.totalDiscounted.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span>{formatDate(q.createdAt)}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full",
                            q.status === 'confirmed' ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                          )}>
                            {q.status === 'confirmed' ? '已确认' : '草稿'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {quotations.filter(q => q.customerId === viewingDetails.id).length === 0 && (
                      <p className="text-sm text-gray-400 italic py-4 text-center">暂无报价记录</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">关联合同</h4>
                    <span className="text-xs font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                      {contracts.filter(c => c.customerId === viewingDetails.id).length} 份
                    </span>
                  </div>
                  <div className="space-y-2">
                    {contracts.filter(c => c.customerId === viewingDetails.id).map(c => (
                      <div key={c.id} className="p-3 border border-gray-100 rounded-xl hover:border-purple-200 transition-all bg-gray-50/30">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-gray-900 truncate pr-2">{c.contractNumber}</p>
                          <span className="text-xs font-bold text-purple-600 shrink-0">¥{c.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span>{formatDate(c.createdAt)}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full",
                            c.status === 'signed' ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"
                          )}>
                            {c.status === 'signed' ? '已签约' : '草稿'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {contracts.filter(c => c.customerId === viewingDetails.id).length === 0 && (
                      <p className="text-sm text-gray-400 italic py-4 text-center">暂无合同记录</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CustomerCard: React.FC<{
  customer: Customer;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ customer, onView, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl">
            {customer.name.charAt(0)}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={onView}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="查看详情与记录"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button 
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="编辑"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{customer.name}</h4>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <User className="w-3.5 h-3.5" />
          {customer.contactPerson || '未填写联系人'}
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-gray-400" />
            </div>
            {customer.phone || '无电话'}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-gray-400" />
            </div>
            <span className="truncate">{customer.email || '无邮箱'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-gray-400" />
            </div>
            <span className="truncate">{customer.address || '无地址'}</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          录入于 {formatDate(customer.createdAt)}
        </span>
        {customer.taxId && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
            <FileText className="w-3 h-3" />
            有税号
          </div>
        )}
      </div>
    </div>
  );
};

const CustomerRow: React.FC<{
  customer: Customer;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  quotations: Quotation[];
  contracts: Contract[];
}> = ({ customer, isExpanded, onToggleExpand, onView, onEdit, onDelete, quotations, contracts }) => {
  return (
    <>
      <tr className={cn(
        "hover:bg-gray-50 transition-colors group",
        isExpanded && "bg-gray-50"
      )}>
        <td className="px-6 py-4">
          <button 
            onClick={onToggleExpand}
            className="text-gray-400 hover:text-blue-600 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-gray-900 line-clamp-1">{customer.name}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">录入于 {formatDate(customer.createdAt)}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-600">{customer.contactPerson || '-'}</div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-600">{customer.phone || '-'}</div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-xs font-bold text-blue-600">{quotations.length}</div>
              <div className="text-[10px] text-gray-400 uppercase">报价</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-purple-600">{contracts.length}</div>
              <div className="text-[10px] text-gray-400 uppercase">合同</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onView} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="详情">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="编辑">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="删除">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50/30 border-b border-gray-100">
          <td className="px-6 py-4" colSpan={6}>
            <div className="pl-14 pr-6 pb-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">联系信息</h5>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {customer.email || '无邮箱'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {customer.address || '无地址'}
                  </div>
                  {customer.taxId && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      税号: {customer.taxId}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">业务统计</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-bold text-blue-400 uppercase mb-1">报价总额</div>
                    <div className="text-sm font-bold text-blue-700">
                      ¥{quotations.reduce((sum, q) => sum + q.totalDiscounted, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-bold text-purple-400 uppercase mb-1">合同总额</div>
                    <div className="text-sm font-bold text-purple-700">
                      ¥{contracts.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">备注信息</h5>
                <p className="text-sm text-gray-600 whitespace-pre-wrap italic">
                  {customer.notes || '暂无备注'}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
