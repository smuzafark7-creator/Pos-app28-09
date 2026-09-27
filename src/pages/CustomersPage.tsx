import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  DollarSign, 
  X, 
  History, 
  Edit2, 
  Printer, 
  Receipt 
} from 'lucide-react';
import { BrandWatermark } from '../components/BrandWatermark';

export const CustomersPage: React.FC = () => {
  const { customers, addCustomer, updateCustomer, bills, openReceiptModal } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New customer form state
  const [name, setName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [favoriteBranch, setFavoriteBranch] = useState<string>('Main Branch');

  // Edit form state
  const [editName, setEditName] = useState<string>('');
  const [editMobile, setEditMobile] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editFavoriteBranch, setEditFavoriteBranch] = useState<string>('Main Branch');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;

    addCustomer({
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim() || undefined,
      favoriteBranch,
      totalOrders: 0,
      totalSpent: 0,
      lastVisit: 'New'
    });

    setName('');
    setMobile('');
    setEmail('');
    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditMobile(customer.mobile);
    setEditEmail(customer.email || '');
    setEditFavoriteBranch(customer.favoriteBranch || 'Main Branch');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editName.trim() || !editMobile.trim()) return;

    updateCustomer({
      ...editingCustomer,
      name: editName.trim(),
      mobile: editMobile.trim(),
      email: editEmail.trim() || undefined,
      favoriteBranch: editFavoriteBranch
    });

    setEditingCustomer(null);
  };

  // Associated bills for selected customer
  const customerBills = useMemo(() => {
    if (!selectedCustomer) return [];
    return bills.filter(
      b => b.customerMobile === selectedCustomer.mobile || (b.customerName && selectedCustomer.name && b.customerName.toLowerCase() === selectedCustomer.name.toLowerCase())
    );
  }, [selectedCustomer, bills]);

  return (
    <div 
      className="relative min-h-full w-full p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-mono text-slate-100 bg-[#0a0f1d]"
      style={{ backgroundColor: '#0a0f1d' }}
    >
      {/* Bilaal Restaurant Crest Watermark */}
      <BrandWatermark opacity={0.10} />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div 
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl shadow-lg border"
          style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Customer Directory & Loyalty</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Registered diner profiles, visit logs, total spend, and contact management
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-bold shadow-sm transition-all cursor-pointer hover:opacity-90"
            style={{ backgroundColor: '#8b0000', border: '1px solid #b91c1c' }}
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Search Input */}
        <div 
          className="p-3.5 rounded-xl border shadow-sm flex items-center gap-3"
          style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by customer name or 10-digit mobile number..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none"
              style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
            />
          </div>
        </div>

        {/* Customer List Table */}
        <div 
          className="rounded-xl border shadow-lg overflow-hidden"
          style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead 
                className="border-b uppercase tracking-wider text-[10px]"
                style={{ backgroundColor: '#0b1120', borderColor: '#1e293b', color: '#cbd5e1' }}
              >
                <tr>
                  <th className="py-3 px-4 font-bold">Customer Name</th>
                  <th className="py-3 px-4 font-bold">Mobile</th>
                  <th className="py-3 px-4 font-bold">Frequent Branch</th>
                  <th className="py-3 px-4 text-center font-bold">Total Orders</th>
                  <th className="py-3 px-4 text-right font-bold">Total Spent</th>
                  <th className="py-3 px-4 font-bold">Last Visit</th>
                  <th className="py-3 px-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredCustomers.map((cust, index) => {
                  const isEven = index % 2 === 0;
                  const rowBg = isEven ? '#0d1527' : '#090e1a';
                  return (
                    <tr 
                      key={cust.id} 
                      className="hover:bg-[#172554] transition-colors cursor-pointer group"
                      style={{ backgroundColor: rowBg }}
                      onClick={() => setSelectedCustomer(cust)}
                    >
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                        <div 
                          className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center border"
                          style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                        >
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{cust.name}</div>
                          {cust.email && <div className="text-[10px] text-slate-400 font-normal">{cust.email}</div>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        {cust.mobile}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span 
                          className="px-2 py-0.5 rounded text-[11px]"
                          style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' }}
                        >
                          {cust.favoriteBranch}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold font-mono text-white">
                        {cust.totalOrders}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono" style={{ color: '#10b981' }}>
                        ₹{cust.totalSpent.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {cust.lastVisit}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenEdit(cust, e)}
                            className="p-1.5 rounded transition-colors cursor-pointer hover:bg-slate-700 text-slate-300"
                            style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                            title="Edit Customer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="px-2.5 py-1 rounded text-white text-[11px] font-bold transition-colors cursor-pointer hover:bg-blue-800"
                            style={{ backgroundColor: '#1e3a8a', border: '1px solid rgba(59, 130, 246, 0.4)' }}
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-xs" style={{ backgroundColor: '#0d1527' }}>
              No customers found matching "{searchQuery}".
            </div>
          )}
        </div>

        {/* Add Customer Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div 
              className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border text-slate-200"
              style={{ backgroundColor: '#0b1120', borderColor: '#1e293b' }}
            >
              <div 
                className="px-5 py-4 text-white flex items-center justify-between border-b"
                style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
              >
                <h3 className="text-sm font-bold">Add New Customer</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile Number (10 Digits) *</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preferred Branch</label>
                  <select
                    value={favoriteBranch}
                    onChange={e => setFavoriteBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                  >
                    <option value="Main Branch">Main Branch (MG Road)</option>
                    <option value="City Branch">City Branch (Jayanagar)</option>
                    <option value="Beach Road Branch">Beach Road Branch (Promenade)</option>
                  </select>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: '#1e293b' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer font-medium"
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-white font-bold rounded-lg cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: '#8b0000', border: '1px solid #b91c1c' }}
                  >
                    Save Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {editingCustomer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div 
              className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border text-slate-200"
              style={{ backgroundColor: '#0b1120', borderColor: '#1e293b' }}
            >
              <div 
                className="px-5 py-4 text-white flex items-center justify-between border-b"
                style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
              >
                <h3 className="text-sm font-bold">Edit Customer: {editingCustomer.name}</h3>
                <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={editMobile}
                    onChange={e => setEditMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preferred Branch</label>
                  <select
                    value={editFavoriteBranch}
                    onChange={e => setEditFavoriteBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                  >
                    <option value="Main Branch">Main Branch (MG Road)</option>
                    <option value="City Branch">City Branch (Jayanagar)</option>
                    <option value="Beach Road Branch">Beach Road Branch (Promenade)</option>
                  </select>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: '#1e293b' }}>
                  <button
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                    className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer font-medium"
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-white font-bold rounded-lg cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: '#8b0000', border: '1px solid #b91c1c' }}
                  >
                    Update Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customer Detail & Orders History Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div 
              className="rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border text-slate-200"
              style={{ backgroundColor: '#0b1120', borderColor: '#1e293b' }}
            >
              <div 
                className="px-5 py-4 text-white flex items-center justify-between border-b"
                style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold">Customer Profile & Visit History</h3>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs font-sans">
                <div 
                  className="p-3.5 rounded-xl border flex justify-between items-center"
                  style={{ backgroundColor: '#0d1527', borderColor: '#1e293b' }}
                >
                  <div>
                    <h4 className="text-base font-bold text-white">{selectedCustomer.name}</h4>
                    <div className="text-slate-300 font-mono mt-0.5">{selectedCustomer.mobile} {selectedCustomer.email ? `• ${selectedCustomer.email}` : ''}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Frequent Branch: {selectedCustomer.favoriteBranch}</div>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(selectedCustomer)}
                    className="px-3 py-1.5 rounded text-white text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-700"
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl border" style={{ backgroundColor: '#090e1a', borderColor: '#1e293b' }}>
                    <div className="text-slate-400 text-[10px]">Total Visits</div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">{selectedCustomer.totalOrders}</div>
                  </div>
                  <div className="p-2.5 rounded-xl border" style={{ backgroundColor: '#090e1a', borderColor: '#1e293b' }}>
                    <div className="text-slate-400 text-[10px]">Total Spent</div>
                    <div className="text-lg font-bold font-mono mt-0.5" style={{ color: '#10b981' }}>₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="p-2.5 rounded-xl border" style={{ backgroundColor: '#090e1a', borderColor: '#1e293b' }}>
                    <div className="text-slate-400 text-[10px]">Avg Ticket</div>
                    <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
                      ₹{selectedCustomer.totalOrders > 0 ? Math.round(selectedCustomer.totalSpent / selectedCustomer.totalOrders) : 0}
                    </div>
                  </div>
                </div>

                {/* Associated Bills */}
                <div className="space-y-2 pt-2">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                    <span>Transaction History ({customerBills.length} Invoices)</span>
                  </h5>

                  <div className="space-y-2">
                    {customerBills.map(b => (
                      <div 
                        key={b.id} 
                        className="p-3 rounded-xl border flex items-center justify-between text-xs"
                        style={{ backgroundColor: '#090e1a', borderColor: '#1e293b' }}
                      >
                        <div>
                          <div className="font-bold font-mono text-white">{b.billNumber}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{b.date} • {b.branchName} • {b.paymentMethod.toUpperCase()}</div>
                          <div className="text-[10px] text-slate-300 mt-0.5">
                            {b.items.map(it => `${it.quantity}x ${it.name}`).slice(0, 3).join(', ')}
                            {b.items.length > 3 && ` +${b.items.length - 3} more`}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold font-mono" style={{ color: '#10b981' }}>
                            ₹{b.grandTotal.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => openReceiptModal(b)}
                            className="p-1.5 rounded text-slate-300 hover:text-white cursor-pointer hover:bg-slate-700"
                            style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                            title="Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {customerBills.length === 0 && (
                      <div className="p-4 text-center text-slate-500 text-xs rounded-xl border" style={{ backgroundColor: '#090e1a', borderColor: '#1e293b' }}>
                        No settled invoices logged under this customer profile yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
