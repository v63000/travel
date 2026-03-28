import React, { useState, useEffect, useMemo } from 'react';
import { Contract, Quotation, Customer } from '../types';
import { useAuth } from '../components/AuthContext';
import { 
  FileSignature, 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText,
  Save,
  X,
  Settings as SettingsIcon,
  Layout,
  Eye
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { exportToPDF, exportToWord, exportContractToPDF, printContract } from '../lib/exportUtils';

export default function ContractManager() {
  const { profile } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingTemplates, setIsManagingTemplates] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [previewContract, setPreviewContract] = useState<{ contract: Contract; quotation?: Quotation } | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [templateSortOrder, setTemplateSortOrder] = useState<'desc' | 'asc'>('desc');
  
  const [formData, setFormData] = useState<Partial<Contract>>({
    quotationId: '',
    contractNumber: `HT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`,
    clientName: '',
    amount: 0,
    status: 'draft',
    content: ''
  });

  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    content: ''
  });

  const fetchContracts = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/contracts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      setContracts(await response.json());
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

  const fetchTemplates = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/contract_templates', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const fetchedTemplates = await response.json();
      setTemplates(fetchedTemplates);
      
      // Seed initial templates if empty
      if (fetchedTemplates.length === 0) {
        const initialTemplates = [
          { name: '标准合作协议', content: '一、合作内容：\n甲方委托乙方提供活动策划与执行服务，具体项目详见附件报价单。\n\n二、合同金额：\n本合同总金额为人民币（大写）：[金额]，（小写）：¥[金额]。\n\n三、付款方式：\n1. 预付款：合同签订后3个工作日内支付总额的50%。\n2. 尾款：项目执行完毕并验收合格后7个工作日内支付剩余50%。\n\n四、双方权利与义务：\n1. 甲方应按时提供活动所需的基础资料和场地支持。\n2. 乙方应确保活动质量，按约定的时间节点完成各项工作。\n\n五、违约责任：\n任何一方未能履行合同义务，应向对方支付合同总额20%的违约金。' },
          { name: '补充协议', content: '本协议为原合同（编号：[原合同编号]）的补充协议。\n\n一、补充事项：\n经双方协商一致，对原合同中以下条款进行调整：\n[调整内容]\n\n二、其他：\n除本补充协议明确修改的条款外，原合同其他条款继续有效。\n\n三、生效：\n本协议自双方签字盖章之日起生效。' },
          { name: '简易服务合同', content: '一、服务项目：\n由乙方为甲方提供活动策划与执行服务。\n\n二、费用：\n总金额见报价单，一次性支付。\n\n三、其他：\n未尽事宜双方协商解决。' },
          { name: '长期合作协议', content: '一、合作范围：\n甲方委托乙方作为年度活动供应商。\n\n二、结算方式：\n按月结算，次月10日前支付上月费用。\n\n三、有效期：\n本协议自签订之日起有效期一年。' }
        ];
        await Promise.all(initialTemplates.map(t => 
          fetch('/api/contract_templates', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(t)
          })
        ));
        fetchTemplates();
      }
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchQuotations();
    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates
      .filter(t => t.name.toLowerCase().includes(templateSearchQuery.toLowerCase()))
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return templateSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [templates, templateSearchQuery, templateSortOrder]);

  const handleQuotationSelect = (qId: string) => {
    const q = quotations.find(item => item.id === qId);
    if (q) {
      setFormData({
        ...formData,
        quotationId: qId,
        customerId: q.customerId || null,
        clientName: q.clientName,
        amount: q.totalDiscounted
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const data = {
      ...formData,
      createdAt: editingId ? contracts.find(c => c.id === editingId)?.createdAt : new Date().toISOString()
    };
    if (editingId) {
      await fetch(`/api/contracts/${editingId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      setEditingId(null);
    } else {
      await fetch('/api/contracts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      setIsAdding(false);
    }
    setFormData({
      quotationId: '',
      customerId: '',
      contractNumber: `HT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`,
      clientName: '',
      amount: 0,
      status: 'draft',
      content: templates[0]?.content || ''
    });
    fetchContracts();
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const data = {
      ...templateFormData,
      createdAt: editingTemplateId ? templates.find(t => t.id === editingTemplateId)?.createdAt : new Date().toISOString()
    };
    if (editingTemplateId) {
      await fetch(`/api/contract_templates/${editingTemplateId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      setEditingTemplateId(null);
    } else {
      await fetch('/api/contract_templates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    }
    setTemplateFormData({ name: '', content: '' });
    fetchTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('确定要删除该模板吗？')) {
      const token = localStorage.getItem('token');
      await fetch(`/api/contract_templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTemplates();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该合同吗？')) {
      const token = localStorage.getItem('token');
      await fetch(`/api/contracts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchContracts();
    }
  };

  const getStatusBadge = (status: Contract['status']) => {
    switch (status) {
      case 'signed': return <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-bold">已签约</span>;
      case 'completed': return <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold">已完成</span>;
      case 'cancelled': return <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold">已取消</span>;
      default: return <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded-full text-xs font-bold">草稿</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">合同管理</h2>
          <p className="text-gray-500">管理活动合同、签约状态及打印</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsManagingTemplates(!isManagingTemplates)}
            className="bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-all w-fit font-semibold"
          >
            <SettingsIcon className="w-5 h-5" />
            模板管理
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 w-fit font-semibold"
          >
            <Plus className="w-5 h-5" />
            新建合同
          </button>
        </div>
      </div>

      {isManagingTemplates && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Layout className="w-5 h-5 text-blue-600" />
              合同模板管理
            </h3>
            <button onClick={() => setIsManagingTemplates(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 border-r border-gray-100 pr-8">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                {editingTemplateId ? '编辑模板' : '新增模板'}
              </h4>
              <form onSubmit={handleTemplateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模板名称</label>
                  <input
                    type="text"
                    required
                    value={templateFormData.name}
                    onChange={e => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="例如：标准合作协议"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模板内容</label>
                  <textarea
                    required
                    value={templateFormData.content}
                    onChange={e => setTemplateFormData({ ...templateFormData, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-96 resize-none text-sm"
                    placeholder="输入合同条款内容..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  {editingTemplateId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplateId(null);
                        setTemplateFormData({ name: '', content: '' });
                      }}
                      className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 font-semibold"
                    >
                      取消
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-10 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
                  >
                    {editingTemplateId ? '更新模板' : '保存模板'}
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">现有模板列表</h4>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setTemplateSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                    title={templateSortOrder === 'desc' ? '按时间降序' : '按时间升序'}
                  >
                    <SettingsIcon className={cn("w-3.5 h-3.5", templateSortOrder === 'asc' && "rotate-180")} />
                  </button>
                </div>
              </div>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="搜索模板名称..."
                  value={templateSearchQuery}
                  onChange={e => setTemplateSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-100 bg-gray-50 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredTemplates.map(template => (
                  <div key={template.id} className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-all group bg-gray-50/30">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-gray-900 truncate pr-2 flex-1">{template.name}</h5>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => setPreviewTemplate(template)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                          title="预览"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTemplateId(template.id);
                            setTemplateFormData({ name: template.name, content: template.content });
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                          title="编辑"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-3 whitespace-pre-wrap">
                      {template.content}
                    </p>
                  </div>
                ))}
                {filteredTemplates.length === 0 && (
                  <div className="py-12 text-center text-gray-400 italic border-2 border-dashed border-gray-100 rounded-2xl">
                    {templateSearchQuery ? '未找到匹配模板' : '暂无模板'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {(isAdding || editingId) && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">{editingId ? '编辑合同' : '新建合同'}</h3>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关联报价单</label>
              <select
                required
                value={formData.quotationId}
                onChange={e => handleQuotationSelect(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">请选择报价单</option>
                {quotations.map(q => (
                  <option key={q.id} value={q.id}>{q.clientName} - {formatCurrency(q.totalDiscounted)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客户名称</label>
              <input
                type="text"
                readOnly
                value={formData.clientName}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 outline-none cursor-not-allowed"
                placeholder="选择报价单后自动填充"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">合同编号</label>
              <input
                type="text"
                required
                value={formData.contractNumber}
                onChange={e => setFormData({ ...formData, contractNumber: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">合同金额</label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">合同状态</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="draft">草稿</option>
                <option value="signed">已签约</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">合同条款</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">导入模板:</span>
                  <select
                    onChange={(e) => {
                      const template = templates.find(t => t.name === e.target.value);
                      if (template) {
                        setFormData({ ...formData, content: template.content });
                      }
                    }}
                    className="text-xs px-2 py-1 border border-gray-200 rounded bg-gray-50 hover:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    defaultValue=""
                  >
                    <option value="" disabled>选择模板...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.name}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-40 resize-none"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold"
              >
                保存合同
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">合同信息</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">金额</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">状态</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contracts.map(contract => (
              <tr key={contract.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{contract.clientName}</div>
                  <div className="text-xs text-gray-400">{contract.contractNumber}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-blue-600">{formatCurrency(contract.amount)}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  {getStatusBadge(contract.status)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => {
                        const q = quotations.find(item => item.id === contract.quotationId);
                        setPreviewContract({ contract, quotation: q });
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="预览合同"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        const q = quotations.find(item => item.id === contract.quotationId);
                        printContract(contract, q);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="打印合同"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        const q = quotations.find(item => item.id === contract.quotationId);
                        exportContractToPDF(contract, q);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="导出PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingId(contract.id);
                        setFormData(contract);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(contract.id)}
                      className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                  暂无合同记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {previewContract && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">打印预览</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => printContract(previewContract.contract, previewContract.quotation)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all font-semibold text-sm"
                >
                  <Printer className="w-4 h-4" />
                  立即打印
                </button>
                <button
                  onClick={() => setPreviewContract(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
              <div className="bg-white shadow-sm mx-auto p-[20mm] min-h-[297mm] w-[210mm] text-gray-900 font-serif" id="contract-preview-content">
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-bold mb-2 tracking-widest">活动服务合同</h1>
                  <div className="h-0.5 bg-blue-600 w-full"></div>
                </div>
                
                <div className="flex justify-between mb-10 text-sm">
                  <div className="space-y-1">
                    <p><span className="font-bold">甲方(客户):</span> {previewContract.contract.clientName}</p>
                    <p><span className="font-bold">合同金额:</span> {formatCurrency(previewContract.contract.amount)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p><span className="font-bold">合同编号:</span> {previewContract.contract.contractNumber}</p>
                    <p><span className="font-bold">签订日期:</span> {formatDate(previewContract.contract.createdAt)}</p>
                  </div>
                </div>

                <div className="mb-10">
                  <h3 className="text-base font-bold mb-4 border-b border-gray-100 pb-2">合同条款</h3>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap min-h-[200px]">
                    {previewContract.contract.content}
                  </div>
                </div>

                {previewContract.quotation && (
                  <div className="mt-10 pt-10 border-t border-dashed border-gray-200">
                    <h3 className="text-base font-bold mb-4 border-b border-gray-100 pb-2">附件：费用明细表</h3>
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border border-gray-200">
                          <th className="p-2 text-left border border-gray-200">项目名称</th>
                          <th className="p-2 text-center border border-gray-200 w-12">数量</th>
                          <th className="p-2 text-center border border-gray-200 w-12">天数</th>
                          <th className="p-2 text-right border border-gray-200 w-24">单价</th>
                          <th className="p-2 text-right border border-gray-200 w-24">小计</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewContract.quotation.items.map((item, idx) => (
                          <tr key={idx} className="border border-gray-200">
                            <td className="p-2 border border-gray-200">{item.name}</td>
                            <td className="p-2 text-center border border-gray-200">{item.quantity}</td>
                            <td className="p-2 text-center border border-gray-200">{item.days}</td>
                            <td className="p-2 text-right border border-gray-200">{formatCurrency(item.retailPrice)}</td>
                            <td className="p-2 text-right border border-gray-200">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-20 flex justify-between text-sm">
                  <div className="w-[45%] space-y-8">
                    <p>甲方盖章：____________________</p>
                    <p>日期：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;年&nbsp;&nbsp;&nbsp;&nbsp;月&nbsp;&nbsp;&nbsp;&nbsp;日</p>
                  </div>
                  <div className="w-[45%] space-y-8">
                    <p>乙方盖章：____________________</p>
                    <p>日期：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;年&nbsp;&nbsp;&nbsp;&nbsp;月&nbsp;&nbsp;&nbsp;&nbsp;日</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">模板预览：{previewTemplate.name}</h3>
              <button onClick={() => setPreviewTemplate(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <div className="prose prose-sm max-w-none">
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 font-serif">
                  {previewTemplate.content}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-6 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                关闭预览
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
