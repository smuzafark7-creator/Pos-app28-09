import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Building2, 
  Printer, 
  Percent, 
  RotateCcw, 
  Check, 
  FileText, 
  Info, 
  ShieldCheck, 
  Smartphone, 
  Store, 
  Receipt, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';
import { BRANCHES } from '../data/mockData';
import { BrandWatermark } from '../components/BrandWatermark';

export const SettingsPage: React.FC = () => {
  const { 
    resetDemoData, 
    showToast, 
    branches, 
    currentBranch, 
    restaurantSettings, 
    updateRestaurantSettings 
  } = useApp();

  // Restaurant Info
  const [restaurantName, setRestaurantName] = useState<string>(() => restaurantSettings?.name || 'Bilaal Restaurant');
  const [brandName, setBrandName] = useState<string>(() => restaurantSettings?.brandName || 'Bilaal Restaurant & Bar');
  const [gstNumber, setGstNumber] = useState<string>(() => restaurantSettings?.gstin || '29AAAAA0000A1Z5');
  const [fssaiNumber, setFssaiNumber] = useState<string>(() => restaurantSettings?.fssai || '11223344556677');
  const [cgstPercent, setCgstPercent] = useState<number>(() => restaurantSettings?.cgstPercent ?? 5.0);
  const [sgstPercent, setSgstPercent] = useState<number>(() => restaurantSettings?.sgstPercent ?? 5.0);

  // Branch Settings
  const [selectedBranchId, setSelectedBranchId] = useState<string>('main');
  const [branchDetails, setBranchDetails] = useState({
    main: {
      name: 'Main Branch',
      address: '102 MG Road, Central Business District, Bangalore',
      phone: '+91 80 2345 6789',
      headerText: 'Welcome to Bilaal Restaurant - Fine Dining & Bar',
      footerText: 'Thank you for dining with us! Please visit again. Follow @bilaalrestaurant'
    },
    city: {
      name: 'City Branch',
      address: '45, 11th Main, 4th Block, Jayanagar, Bangalore',
      phone: '+91 80 8765 4321',
      headerText: 'Bilaal Express & Family Dining - Jayanagar',
      footerText: 'We appreciate your patronage! Rate us on Google & Zomato.'
    },
    beach: {
      name: 'Beach Road Branch',
      address: '88 Coastal Promenade, Beach View Boulevard, Pondicherry',
      phone: '+91 413 2233 445',
      headerText: 'Bilaal Coastal Grill & Rooftop - Seaside',
      footerText: 'Hope you enjoyed the ocean breeze! Have a safe journey.'
    }
  });

  // Printer Settings
  const [defaultPrinter, setDefaultPrinter] = useState<string>('80mm Thermal Printer');
  const [kotPrinter, setKotPrinter] = useState<string>('Kitchen Printer');
  const [autoPrintOnBill, setAutoPrintOnBill] = useState<boolean>(true);

  const currentBranchData = branchDetails[selectedBranchId as keyof typeof branchDetails] || branchDetails.main || {
    name: 'Main Branch',
    address: '102 MG Road, Central Business District, Bangalore',
    phone: '+91 80 2345 6789',
    headerText: 'Welcome to Bilaal Restaurant - Fine Dining & Bar',
    footerText: 'Thank you for dining with us! Please visit again.'
  };

  const handleBranchDetailChange = (field: string, val: string) => {
    setBranchDetails(prev => ({
      ...prev,
      [selectedBranchId]: {
        ...(prev[selectedBranchId as keyof typeof branchDetails] || prev.main),
        [field]: val
      }
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cgstVal = Number(cgstPercent) >= 0 ? Number(cgstPercent) : 5.0;
    const sgstVal = Number(sgstPercent) >= 0 ? Number(sgstPercent) : 5.0;
    const totalTax = Number((cgstVal + sgstVal).toFixed(2));

    updateRestaurantSettings({
      name: restaurantName.trim() || 'Bilaal Restaurant',
      brandName: brandName.trim() || 'Bilaal Restaurant & Bar',
      gstin: gstNumber.trim().toUpperCase() || '29AAAAA0000A1Z5',
      fssai: fssaiNumber.trim() || '11223344556677',
      cgstPercent: cgstVal,
      sgstPercent: sgstVal,
      defaultTaxPercent: totalTax,
      autoPrintOnBill
    });

    showToast(
      'Settings Saved', 
      `Restaurant configuration updated. Total GST Applied: ${totalTax}% (${cgstVal}% CGST + ${sgstVal}% SGST)`
    );
  };

  const handleConfirmReset = () => {
    if (window.confirm('Are you sure you want to reset all demo data back to default factory state?')) {
      resetDemoData();
    }
  };

  return (
    <div 
      className="relative min-h-full w-full p-4 sm:p-6 space-y-6 max-w-4xl mx-auto font-mono text-slate-100 bg-[#0a0f1d]"
      style={{ backgroundColor: '#0a0f1d' }}
    >
      {/* Bilaal Restaurant Crest Watermark */}
      <BrandWatermark opacity={0.10} />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div 
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border shadow-lg"
          style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Settings className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">System & Branch Settings</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Configure brand metadata, multi-branch information, tax rates, and thermal hardware
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirmReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-rose-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(159, 18, 57, 0.25)', borderColor: '#9f1239' }}
            title="Reset database to initial demo state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Section 1: Restaurant Info */}
          <div 
            className="p-4 sm:p-5 rounded-xl border shadow-lg space-y-4"
            style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
          >
            <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: '#1e293b' }}>
              <Store className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Restaurant Info</h3>
                <p className="text-[11px] text-slate-400 font-sans">Primary legal entity and default tax parameters</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={e => setRestaurantName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Brand Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={e => setGstNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg font-mono focus:outline-none uppercase"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">FSSAI License Number</label>
                <input
                  type="text"
                  value={fssaiNumber}
                  onChange={e => setFssaiNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg font-mono focus:outline-none"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">CGST Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={cgstPercent}
                  onChange={e => setCgstPercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg font-mono focus:outline-none"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">SGST Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={sgstPercent}
                  onChange={e => setSgstPercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg font-mono focus:outline-none"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                />
              </div>
            </div>

            <div 
              className="p-3 rounded-lg border flex items-center justify-between text-xs"
              style={{ backgroundColor: '#090e1a', borderColor: '#1e293b' }}
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Total Standard GST Applied on Invoices:</span>
              </div>
              <span className="font-bold font-mono text-sm" style={{ color: '#10b981' }}>
                {(Number(cgstPercent || 0) + Number(sgstPercent || 0)).toFixed(1)}% GST (Composite Slabs)
              </span>
            </div>
          </div>

          {/* Section 2: Branch Info */}
          <div 
            className="p-4 sm:p-5 rounded-xl border shadow-lg space-y-4"
            style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: '#1e293b' }}>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Branch Profile Configuration</h3>
                  <p className="text-[11px] text-slate-400 font-sans">Header and footer receipts tailored per branch</p>
                </div>
              </div>

              <div className="flex items-center gap-1 p-0.5 rounded-lg border text-xs" style={{ backgroundColor: '#090e1a', borderColor: '#1e293b' }}>
                {[
                  { id: 'main', label: 'Main' },
                  { id: 'city', label: 'City' },
                  { id: 'beach', label: 'Beach' }
                ].map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranchId(b.id)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      selectedBranchId === b.id
                        ? 'text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    style={selectedBranchId === b.id ? { backgroundColor: '#8b0000', border: '1px solid #b91c1c' } : undefined}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={currentBranchData.name}
                    onChange={e => handleBranchDetailChange('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={currentBranchData.phone}
                    onChange={e => handleBranchDetailChange('phone', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none font-mono"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Physical Address</label>
                <input
                  type="text"
                  value={currentBranchData.address}
                  onChange={e => handleBranchDetailChange('address', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Receipt Header Text</label>
                  <input
                    type="text"
                    value={currentBranchData.headerText}
                    onChange={e => handleBranchDetailChange('headerText', e.target.value)}
                    placeholder="Greeting printed under branch name"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Receipt Footer Text</label>
                  <input
                    type="text"
                    value={currentBranchData.footerText}
                    onChange={e => handleBranchDetailChange('footerText', e.target.value)}
                    placeholder="Thank you note at bottom of receipt"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Printer Settings */}
          <div 
            className="p-4 sm:p-5 rounded-xl border shadow-lg space-y-4"
            style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
          >
            <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: '#1e293b' }}>
              <Printer className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Printer Settings (Hardware Setup)</h3>
                <p className="text-[11px] text-slate-400 font-sans">Hardware targets for customer receipts and kitchen tickets</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Default POS Printer</label>
                <select
                  value={defaultPrinter}
                  onChange={e => setDefaultPrinter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                >
                  <option value="80mm Thermal Printer">80mm Thermal Printer (ESC/POS)</option>
                  <option value="58mm Compact Thermal Printer">58mm Compact Thermal Printer</option>
                  <option value="Standard A4 Invoice Printer">Standard A4 Invoice Printer</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Assigned for POS final bills</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">KOT Kitchen Printer</label>
                <select
                  value={kotPrinter}
                  onChange={e => setKotPrinter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                >
                  <option value="Kitchen Printer">Kitchen Printer (Main Cooking Station)</option>
                  <option value="Bar Printer">Bar Printer (Beverage Station)</option>
                  <option value="Grill Station Printer">Grill Station Printer (Tandoor)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Routing for kitchen dispatch</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Auto-print on Bill</label>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoPrintOnBill(!autoPrintOnBill)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-colors cursor-pointer"
                    style={autoPrintOnBill ? {
                      backgroundColor: 'rgba(6, 78, 59, 0.4)',
                      borderColor: '#059669',
                      color: '#34d399'
                    } : {
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      color: '#94a3b8'
                    }}
                  >
                    {autoPrintOnBill ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                        <span>ON (Automatic)</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                        <span>OFF (Manual)</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Triggers print dialog upon bill settlement</p>
              </div>
            </div>
          </div>

          {/* Save Settings Button */}
          <div className="flex justify-end gap-3 font-mono">
            <button
              type="submit"
              className="px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#8b0000', border: '1px solid #b91c1c' }}
            >
              <Check className="w-4 h-4 text-white" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
