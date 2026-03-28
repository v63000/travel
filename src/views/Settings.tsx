import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { Save, Building2, Globe, Phone, Mail, Image as ImageIcon } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings>({
    companyName: '我的旅游策划公司',
    logo: '',
    contactInfo: '地址：XX省XX市XX路\n电话：400-XXX-XXXX'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSettings(await res.json());
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      alert('设置已保存');
    } catch (error) {
      console.error(error);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">系统设置</h2>
        <p className="text-gray-500">配置公司信息与系统参数</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              公司名称
            </label>
            <input
              type="text"
              required
              value={settings.companyName}
              onChange={e => setSettings({ ...settings, companyName: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="输入您的公司全称"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-400" />
              公司 Logo URL
            </label>
            <input
              type="text"
              value={settings.logo}
              onChange={e => setSettings({ ...settings, logo: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              联系信息 (将显示在报价单底部)
            </label>
            <textarea
              value={settings.contactInfo}
              onChange={e => setSettings({ ...settings, contactInfo: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
              placeholder="输入地址、电话、邮箱等..."
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-bold flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isSaving ? '正在保存...' : '保存设置'}
          </button>
        </div>
      </form>
    </div>
  );
}
