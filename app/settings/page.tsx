'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Save, RotateCcw, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import type { User } from '@supabase/supabase-js';

interface Settings {
  exporterName: string;
  exporterAddress: string;
  exporterPhone: string;
  exporterFax: string;
  exporterGSTIN: string;
  exporterIEC: string;
  exporterBank: string;
  exporterAccount: string;
  adCode: string;
  exporterArnNo: string;
  countryOrigin: string;
  portOfLoading: string;
  termsOfDelivery: string;
  currency: string;
  exchangeRate: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    exporterName: 'SHIVA EXPORTS INDIA',
    exporterAddress: '35 - FARSH ROAD, KANNAUJ - 209725, UP (INDIA)',
    exporterPhone: '+91 9838 332079',
    exporterFax: '+91 5694 235218',
    exporterGSTIN: '09AEOPT2938Q1ZC',
    exporterIEC: '0609004549',
    exporterBank: 'HDFC BANK LTD',
    exporterAccount: '50200025599210',
    adCode: '63914712100009',
    exporterArnNo: 'AD090424005074G',
    countryOrigin: 'INDIA',
    portOfLoading: 'NEW DELHI',
    termsOfDelivery: 'CNF',
    currency: 'USD',
    exchangeRate: 84.50,
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    } else {
      setUser(session.user);
    }
  };

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/settings?userId=${user.id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setSettings({
          exporterName: result.data.exporter_name || settings.exporterName,
          exporterAddress: result.data.exporter_address || settings.exporterAddress,
          exporterPhone: result.data.exporter_phone || settings.exporterPhone,
          exporterFax: result.data.exporter_fax || settings.exporterFax,
          exporterGSTIN: result.data.exporter_gstin || settings.exporterGSTIN,
          exporterIEC: result.data.exporter_iec || settings.exporterIEC,
          exporterBank: result.data.exporter_bank || settings.exporterBank,
          exporterAccount: result.data.exporter_account || settings.exporterAccount,
          adCode: result.data.ad_code || settings.adCode,
          exporterArnNo: result.data.exporter_arn_no || settings.exporterArnNo,
          countryOrigin: result.data.country_origin || settings.countryOrigin,
          portOfLoading: result.data.port_of_loading || settings.portOfLoading,
          termsOfDelivery: result.data.terms_of_delivery || settings.termsOfDelivery,
          currency: result.data.currency || settings.currency,
          exchangeRate: result.data.exchange_rate || settings.exchangeRate,
        });
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Settings, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          settings,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Settings saved successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      const err = error as Error;
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset to default values?')) {
      setSettings({
        exporterName: 'SHIVA EXPORTS INDIA',
        exporterAddress: '35 - FARSH ROAD, KANNAUJ - 209725, UP (INDIA)',
        exporterPhone: '+91 9838 332079',
        exporterFax: '+91 5694 235218',
        exporterGSTIN: '09AEOPT2938Q1ZC',
        exporterIEC: '0609004549',
        exporterBank: 'HDFC BANK LTD',
        exporterAccount: '50200025599210',
        adCode: '63914712100009',
        exporterArnNo: 'AD090424005074G',
        countryOrigin: 'INDIA',
        portOfLoading: 'NEW DELHI',
        termsOfDelivery: 'CNF',
        currency: 'USD',
        exchangeRate: 84.50,
      });
      toast.success('Reset to defaults');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      
      <main className="flex-1 ml-72 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Invoice Defaults</h1>
            </div>
            <p className="text-gray-600">Manage your default settings. These values will be pre-filled in all new invoices.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
              {/* Exporter Information */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600">
                  Exporter Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exporter Name
                    </label>
                    <input
                      type="text"
                      value={settings.exporterName}
                      onChange={(e) => handleChange('exporterName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={settings.exporterPhone}
                      onChange={(e) => handleChange('exporterPhone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fax
                    </label>
                    <input
                      type="text"
                      value={settings.exporterFax}
                      onChange={(e) => handleChange('exporterFax', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AD Code
                    </label>
                    <input
                      type="text"
                      value={settings.adCode}
                      onChange={(e) => handleChange('adCode', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ARN No
                    </label>
                    <input
                      type="text"
                      value={settings.exporterArnNo}
                      onChange={(e) => handleChange('exporterArnNo', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={settings.exporterAddress}
                      onChange={(e) => handleChange('exporterAddress', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tax & Bank Information */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600">
                  Tax & Bank Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      value={settings.exporterGSTIN}
                      onChange={(e) => handleChange('exporterGSTIN', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IEC
                    </label>
                    <input
                      type="text"
                      value={settings.exporterIEC}
                      onChange={(e) => handleChange('exporterIEC', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={settings.exporterBank}
                      onChange={(e) => handleChange('exporterBank', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={settings.exporterAccount}
                      onChange={(e) => handleChange('exporterAccount', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping & Trade Information */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600">
                  Shipping & Trade Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country of Origin
                    </label>
                    <input
                      type="text"
                      value={settings.countryOrigin}
                      onChange={(e) => handleChange('countryOrigin', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Port of Loading
                    </label>
                    <input
                      type="text"
                      value={settings.portOfLoading}
                      onChange={(e) => handleChange('portOfLoading', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terms of Delivery
                    </label>
                    <select
                      value={settings.termsOfDelivery}
                      onChange={(e) => handleChange('termsOfDelivery', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="FOB">FOB</option>
                      <option value="CIF">CIF</option>
                      <option value="CNF">CNF</option>
                      <option value="CFR">CFR</option>
                      <option value="DDP">DDP</option>
                      <option value="DAP">DAP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="INR">INR - Indian Rupee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exchange Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.exchangeRate}
                      onChange={(e) => handleChange('exchangeRate', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 font-semibold"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Settings
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> These settings will be automatically filled in new invoices. You can still modify them per invoice.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
