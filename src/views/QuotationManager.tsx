import React, { useState, useEffect, useMemo } from 'react';
import { Quotation, Product, Category, QuotationItem, Contract } from '../types';
import { useAuth } from '../components/AuthContext';
import { 
  Plus, 
  Search, 
  FileText, 
  Download, 
  Copy, 
  Trash2, 
  Edit2, 
  ChevronRight, 
  ChevronDown,
  Printer,
  FileDown,
  Presentation,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Users,
  FileSignature,
  MoreVertical,
  Eye
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import QuotationForm from './QuotationForm';
import { exportToPDF, exportToWord, exportToPPT, exportToExcel, printQuotation } from '../lib/exportUtils';

export default function QuotationManager() {
  const { profile } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    fetchQuotations();
    fetchContracts();
  }, []);

  const filteredQuotations = quotations.filter(q => 
    q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    const hasContract = contracts.some(c => c.quotationId === id);
    if (hasContract) {
      alert('该报价单已关联合同，请先删除对应的合同后再删除报价单。');
      return;
    }

    if (confirm('确定要删除该报价单吗？')) {
      const token = localStorage.getItem('token');
      await fetch(`/api/quotations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchQuotations();
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: Quotation['status']) => {
    const token = localStorage.getItem('token');
    const quotation = quotations.find(q => q.id === id);
    if (!quotation) return;

    try {
      await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...quotation, status: newStatus })
      });
      fetchQuotations();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('更新状态失败');
    }
  };

  const handleCreateContract = async (quotation: Quotation) => {
    const hasContract = contracts.some(c => c.quotationId === quotation.id);
    if (hasContract) {
      alert('该报价单已有关联合同。');
      return;
    }

    if (confirm(`确定要为 ${quotation.clientName} 生成合同吗？`)) {
      const token = localStorage.getItem('token');
      try {
        await fetch('/api/contracts', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            quotationId: quotation.id,
            customerId: quotation.customerId || null,
            contractNumber: `HT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`,
            clientName: quotation.clientName,
            amount: quotation.totalDiscounted,
            status: 'draft',
            content: '一、服务内容：\n根据双方确认的报价单执行。\n\n二、费用支付：\n合同签订后支付50%预付款，活动结束后3个工作日内支付余款。\n\n三、违约责任：\n任何一方违约需承担相应损失。',
            createdAt: new Date().toISOString()
          })
        });
        fetchContracts();
        alert('合同已生成，请前往合同管理页面查看。');
      } catch (error) {
        console.error('Error creating contract:', error);
        alert('生成合同失败');
      }
    }
  };

  const handleCopy = async (quotation: Quotation) => {
    const { id, ...rest } = quotation;
    const token = localStorage.getItem('token');
    await fetch('/api/quotations', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...rest,
        clientName: `${rest.clientName} (副本)`,
        createdAt: new Date().toISOString(),
        status: 'draft'
      })
    });
    fetchQuotations();
  };

  const getStatusBadge = (status: Quotation['status']) => {
    switch (status) {
      case 'confirmed': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle2 className="w-3 h-3" /> 已确认</span>;
      case 'sent': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-bold"><Clock className="w-3 h-3" /> 已发送</span>;
      case 'cancelled': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold"><XCircle className="w-3 h-3" /> 已取消</span>;
      default: return <span className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded-full text-xs font-bold"><AlertCircle className="w-3 h-3" /> 草稿</span>;
    }
  };

  if (isAdding || editingQuotation) {
    return (
      <QuotationForm 
        initialData={editingQuotation || undefined} 
        onClose={() => { setIsAdding(false); setEditingQuotation(null); }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">报价管理</h2>
          <p className="text-gray-500">创建、编辑并导出活动报价单</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 w-fit font-semibold"
        >
          <Plus className="w-5 h-5" />
          新建报价单
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索活动单位或联系人..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuotations.map(q => (
          <div key={q.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
            <div className="p-3 flex-1">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-gray-900 truncate mb-0.5">{q.clientName}</h3>
                  <div className="flex items-center gap-2 text-[9px] text-gray-500">
                    <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" /> {q.headCount}人</span>
                    <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {formatDate(q.date)}</span>
                  </div>
                </div>
                <div className="scale-75 origin-top-right -mr-2">
                  {getStatusBadge(q.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">总金额</p>
                  <p className="text-xs font-bold text-gray-900">{formatCurrency(q.totalDiscounted)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">折扣率</p>
                  <p className="text-xs font-bold text-orange-600">{((q.totalDiscounted / q.totalRetail) * 10).toFixed(1)} 折</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-0.5">
                  <button 
                    onClick={() => setPreviewQuotation(q)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                    title="预览"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => setEditingQuotation(q)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                    title="编辑"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleCopy(q)}
                    className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                    title="复制"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleDelete(q.id)}
                    className={cn(
                      "p-1 rounded transition-all",
                      contracts.some(c => c.quotationId === q.id) 
                        ? "text-gray-200 cursor-not-allowed" 
                        : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                    )}
                    title={contracts.some(c => c.quotationId === q.id) ? "已关联合同，无法删除" : "删除"}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="flex items-center gap-0.5">
                  <button 
                    onClick={() => printQuotation(q)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                    title="打印"
                  >
                    <Printer className="w-3 h-3" />
                  </button>
                  <div className="relative group/menu">
                    <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded">
                      <Download className="w-3 h-3" />
                    </button>
                    <div className="absolute right-0 bottom-full mb-2 w-28 bg-white border border-gray-100 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 py-1">
                      <button onClick={() => exportToPDF(q)} className="w-full px-2 py-1 text-left text-[9px] hover:bg-gray-50 flex items-center gap-1.5">
                        <FileDown className="w-2.5 h-2.5 text-red-500" /> PDF
                      </button>
                      <button onClick={() => exportToExcel(q)} className="w-full px-2 py-1 text-left text-[9px] hover:bg-gray-50 flex items-center gap-1.5">
                        <Download className="w-2.5 h-2.5 text-green-600" /> Excel
                      </button>
                      <button onClick={() => exportToWord(q)} className="w-full px-2 py-1 text-left text-[9px] hover:bg-gray-50 flex items-center gap-1.5">
                        <FileDown className="w-2.5 h-2.5 text-blue-600" /> Word
                      </button>
                      <button onClick={() => exportToPPT(q)} className="w-full px-2 py-1 text-left text-[9px] hover:bg-gray-50 flex items-center gap-1.5">
                        <Presentation className="w-2.5 h-2.5 text-orange-500" /> PPT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {q.status === 'confirmed' && !contracts.some(c => c.quotationId === q.id) && (
              <button 
                onClick={() => handleCreateContract(q)}
                className="w-full py-1.5 bg-purple-600 text-white text-[9px] font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-1"
              >
                <FileSignature className="w-2.5 h-2.5" /> 生成合同
              </button>
            )}
          </div>
        ))}
        {filteredQuotations.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">暂无报价单，点击右上角新建</p>
          </div>
        )}
      </div>

      {previewQuotation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">报价单预览</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => printQuotation(previewQuotation)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all font-semibold text-sm"
                >
                  <Printer className="w-4 h-4" />
                  立即打印
                </button>
                <button
                  onClick={() => setPreviewQuotation(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
              <div className="bg-white shadow-sm mx-auto p-[20mm] min-h-[297mm] w-[210mm] text-gray-900 font-serif" id="quotation-preview-content">
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-bold mb-2 tracking-widest">活动服务报价单</h1>
                  <div className="h-0.5 bg-blue-600 w-full"></div>
                </div>
                
                <div className="flex justify-between mb-10 text-sm">
                  <div className="space-y-1">
                    <p><span className="font-bold">客户名称:</span> {previewQuotation.clientName}</p>
                    <p><span className="font-bold">联系人:</span> {previewQuotation.contactPerson}</p>
                    <p><span className="font-bold">联系电话:</span> {previewQuotation.phone}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p><span className="font-bold">活动人数:</span> {previewQuotation.headCount} 人</p>
                    <p><span className="font-bold">活动日期:</span> {formatDate(previewQuotation.date)}</p>
                    <p><span className="font-bold">报价日期:</span> {formatDate(previewQuotation.createdAt)}</p>
                  </div>
                </div>

                <div className="mb-10">
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
                      {previewQuotation.items.map((item, idx) => (
                        <tr key={idx} className="border border-gray-200">
                          <td className="p-2 border border-gray-200">{item.name}</td>
                          <td className="p-2 text-center border border-gray-200">{item.quantity}</td>
                          <td className="p-2 text-center border border-gray-200">{item.days}</td>
                          <td className="p-2 text-right border border-gray-200">{formatCurrency(item.retailPrice)}</td>
                          <td className="p-2 text-right border border-gray-200">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold bg-gray-50 border border-gray-200">
                        <td colSpan={4} className="p-2 text-right border border-gray-200">总计金额:</td>
                        <td className="p-2 text-right border border-gray-200 text-blue-600">{formatCurrency(previewQuotation.totalDiscounted)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-20 flex justify-between text-sm">
                  <div className="w-[45%] space-y-8">
                    <p>客户确认：____________________</p>
                    <p>日期：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;年&nbsp;&nbsp;&nbsp;&nbsp;月&nbsp;&nbsp;&nbsp;&nbsp;日</p>
                  </div>
                  <div className="w-[45%] space-y-8 text-right">
                    <p>报价单位：____________________</p>
                    <p>日期：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;年&nbsp;&nbsp;&nbsp;&nbsp;月&nbsp;&nbsp;&nbsp;&nbsp;日</p>
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
