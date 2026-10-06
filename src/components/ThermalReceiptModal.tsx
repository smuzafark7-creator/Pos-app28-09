import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Printer, Download, X, CheckCircle2, ChefHat, Utensils } from 'lucide-react';
import { BRANCHES } from '../data/mockData';
import { Bill, KOT, BillItem } from '../types';

interface ConsolidatedItem {
  id: string;
  name: string;
  cleanName: string;
  quantity: number;
  rate: number;
  amount: number;
  serveType?: string;
}

export const ThermalReceiptModal: React.FC = () => {
  const { 
    activeReceiptBill, 
    isReceiptModalOpen, 
    closeReceiptModal, 
    activeReceiptKOT,
    isKOTModalOpen,
    closeKOTModal,
    restaurantSettings,
    showToast 
  } = useApp();

  const printableRef = useRef<HTMLDivElement>(null);

  // 1. BILL CONSOLIDATION & SANITIZATION (Customer Receipt)
  // Compute consolidated items via useMemo BEFORE any conditional returns to respect Rules of Hooks
  const consolidatedBillItems: ConsolidatedItem[] = React.useMemo(() => {
    if (!activeReceiptBill || !activeReceiptBill.items) return [];

    const map = new Map<string, ConsolidatedItem>();

    activeReceiptBill.items.forEach(item => {
      // Strip redundant tags like "(Dine-In)", "(Dine in)", "(Parcel)" from name
      const cleanName = item.name
        .replace(/\s*\((?:Dine-In|Dine\s*In|DineIn)\)/gi, '')
        .replace(/\s*\[(?:Dine-In|Dine\s*In|DineIn)\]/gi, '')
        .trim();

      // Key by clean item name and rate so identical items consolidate cleanly
      const key = `${cleanName.toLowerCase()}_${item.rate}`;

      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.quantity += item.quantity;
        existing.amount += item.amount || (item.rate * item.quantity);
      } else {
        map.set(key, {
          id: item.id || key,
          name: item.name,
          cleanName: cleanName || item.name,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount || (item.rate * item.quantity),
          serveType: item.serveType
        });
      }
    });

    return Array.from(map.values());
  }, [activeReceiptBill]);

  // Is this modal currently active?
  const isOpen = isKOTModalOpen || isReceiptModalOpen;
  const isKOTMode = Boolean(isKOTModalOpen && activeReceiptKOT);
  
  if (!isOpen) return null;
  if (isKOTMode && !activeReceiptKOT) return null;
  if (!isKOTMode && !activeReceiptBill) return null;

  const currentBill = activeReceiptBill as Bill;
  const currentKOT = activeReceiptKOT as KOT;

  const branchObj = BRANCHES.find(
    b => b.id === (isKOTMode ? currentKOT.branchId : currentBill.branchId)
  ) || BRANCHES[0];

  // Calculated values for Indian standard receipt
  const configuredCgstPercent = currentBill?.cgstPercent ?? (restaurantSettings?.cgstPercent ?? 5.0);
  const configuredSgstPercent = currentBill?.sgstPercent ?? (restaurantSettings?.sgstPercent ?? 5.0);
  const calcSubtotal = currentBill ? (currentBill.subtotal || consolidatedBillItems.reduce((acc, item) => acc + item.amount, 0)) : 0;
  const calcCgst = currentBill?.cgstAmount !== undefined 
    ? currentBill.cgstAmount 
    : Number(((calcSubtotal * (configuredCgstPercent / 100))).toFixed(2));
  const calcSgst = currentBill?.sgstAmount !== undefined 
    ? currentBill.sgstAmount 
    : Number(((calcSubtotal * (configuredSgstPercent / 100))).toFixed(2));
  const calcDiscount = currentBill?.discountAmount || 0;
  // Grand total directly calculated: Sub Total + CGST amount + SGST amount - Discount
  const calcGrandTotal = Number((calcSubtotal + calcCgst + calcSgst - calcDiscount).toFixed(2));

  // Helper date formatting: DD/MM/YYYY
  const formattedDate = currentBill?.date 
    ? (currentBill.date.includes('-') 
        ? currentBill.date.split('-').reverse().join('/') 
        : currentBill.date)
    : '15/09/2026';

  const tableDisplay = currentBill?.tableNumber 
    ? currentBill.tableNumber.replace(/^(TABLE\s*)+/i, 'Table ') 
    : (currentBill?.takeawayId || 'Counter');

  const userDisplay = currentBill?.cashierName 
    ? currentBill.cashierName.replace(/\s*\(.*?\)/g, '').trim()
    : 'Anita';

  const stewardDisplay = currentBill?.stewardName || 'Ramesh Patel';

  const handleClose = () => {
    if (isKOTMode) {
      closeKOTModal();
    } else {
      closeReceiptModal();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // -------------------------------------------------------------
  // 2. TEXT DOWNLOAD HANDLERS
  // -------------------------------------------------------------
  const handleDownload = () => {
    if (isKOTMode) {
      // Kitchen KOT slip text export
      const kotNumberClean = currentKOT.kotNumber.startsWith('KOT-') 
        ? currentKOT.kotNumber 
        : `KOT-${currentKOT.kotNumber}`;
      
      const destination = currentKOT.orderType === 'takeaway' || currentKOT.orderType === 'parcel'
        ? (currentKOT.takeawayId || 'TAKEAWAY')
        : (currentKOT.tableNumber?.replace(/^(TABLE\s*)+/i, 'TABLE ') || 'DINE-IN');

      const lines = [
        '========================================',
        '        KITCHEN ORDER TICKET (KOT)      ',
        `               ${branchObj.name.toUpperCase()} `,
        '========================================',
        `TICKET: ${kotNumberClean}`,
        `ORDER TYPE: ${currentKOT.orderType.toUpperCase()}`,
        `DESTINATION: ${destination}`,
        `SERVER: ${currentKOT.serverName || currentKOT.waiterName || 'Staff'}`,
        `TIME: ${currentKOT.timeFormatted || (currentKOT.createdAt ? new Date(currentKOT.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString())}`,
        '----------------------------------------',
        'QTY   ITEM DESCRIPTION',
        '----------------------------------------',
        ...currentKOT.items.filter(i => i.status !== 'voided').flatMap(i => {
          const qtyStr = `[${i.quantity}x]`.padEnd(6);
          const out = [`${qtyStr} ${i.name.toUpperCase()}`];
          if (i.notes) out.push(`       >> NOTE: ${i.notes}`);
          if (i.serveType === 'PARCEL') out.push('       >> ** PACK AS PARCEL **');
          return out;
        }),
        '----------------------------------------',
        currentKOT.specialInstructions ? `SPECIAL CHEF NOTE:\n${currentKOT.specialInstructions}` : '',
        '========================================',
        '           *** CHEF COPY ***            ',
        '========================================'
      ].filter(Boolean).join('\n');

      const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${kotNumberClean}_Kitchen_Slip.txt`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('KOT Slip Downloaded', `Saved kitchen slip as ${kotNumberClean}_Kitchen_Slip.txt`, 'success');
    } else {
      // Customer Receipt text export - Standard Indian Format
      const invoiceNumberClean = currentBill.billNumber.startsWith('INV-') 
        ? currentBill.billNumber 
        : `INV-${currentBill.billNumber}`;

      const resName = (restaurantSettings?.name || 'BILAAL RESTAURANT').toUpperCase();
      const resAddress = restaurantSettings?.address || branchObj.address;
      const resPhone = restaurantSettings?.phone || branchObj.phone;
      const resGstin = restaurantSettings?.gstin || branchObj.gstin;
      const fssaiVal = restaurantSettings?.fssai || currentBill.fssaiLicNo || branchObj.fssai || '11223334000128';
      const footerMsg = restaurantSettings?.footerMessage || 'Thank you for dining with us! Please visit again.';

      const lines = [
        '---------------------------------',
        `        ${resName.slice(0, 25).padEnd(25)}`,
        `         ${branchObj.name.toUpperCase()}  `,
        `  ${resAddress} `,
        `Contact No: ${resPhone}`,
        `GSTIN: ${resGstin}`,
        `FSSAI Lic No: ${fssaiVal}`,
        '        ** TAX INVOICE **        ',
        '---------------------------------',
        `Bill No: ${invoiceNumberClean.padEnd(12)} Date: ${formattedDate}`,
        `Tbl No: ${tableDisplay.padEnd(13)} User: ${userDisplay}`,
        `Stw: ${stewardDisplay}`,
        '---------------------------------',
        'Items             Qty  Rate   Amount',
        '---------------------------------',
        ...consolidatedBillItems.map(i => {
          const nameCol = i.cleanName.slice(0, 16).padEnd(17);
          const qtyCol = String(i.quantity).padStart(3);
          const rateCol = i.rate.toFixed(2).padStart(6);
          const amtCol = i.amount.toFixed(2).padStart(8);
          return `${nameCol} ${qtyCol} ${rateCol} ${amtCol}`;
        }),
        '---------------------------------',
        `Sub Total:              ₹${calcSubtotal.toFixed(2).padStart(8)}`,
        `${`CGST ${configuredCgstPercent}%:`.padEnd(24)}₹${calcCgst.toFixed(2).padStart(8)}`,
        `${`SGST ${configuredSgstPercent}%:`.padEnd(24)}₹${calcSgst.toFixed(2).padStart(8)}`,
        currentBill.discountAmount ? `Discount:              -₹${currentBill.discountAmount.toFixed(2).padStart(8)}` : '',
        '=================================',
        `GRAND TOTAL:            ₹${calcGrandTotal.toFixed(2).padStart(8)}`,
        '---------------------------------',
        (currentBill.status !== 'paid' || currentBill.isEstimate || (currentBill as any).paymentStatus === 'UNPAID')
          ? '*** UNPAID / ESTIMATE - NOT SETTLED ***'
          : `PAID VIA ${currentBill.paymentMethod.toUpperCase()}`,
        (currentBill.status === 'paid' && currentBill.paymentMethod === 'split' && currentBill.splitDetails) ? 
          `[Cash: ₹${currentBill.splitDetails.cash} | UPI: ₹${currentBill.splitDetails.upi} | Card: ₹${currentBill.splitDetails.card}]` : '',
        '---------------------------------',
        `  ${footerMsg}  `,
        '---------------------------------'
      ].filter(Boolean).join('\n');

      const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumberClean}_Receipt.txt`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Receipt Downloaded', `Saved receipt as ${invoiceNumberClean}_Receipt.txt`, 'success');
    }
  };

  return (
    <div 
      className="thermal-receipt-backdrop-wrapper fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '24px 16px'
      }}
    >
      <div 
        className="thermal-modal-box rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border my-auto"
        style={{ 
          backgroundColor: '#0b1120', 
          borderColor: '#1e293b',
          borderRadius: '16px',
          margin: 'auto'
        }}
      >
        
        {/* Top Header Bar */}
        <div 
          className="thermal-modal-header px-5 py-3.5 flex items-center justify-between border-b"
          style={{ backgroundColor: '#0b1120', borderColor: '#1e293b' }}
        >
          <div className="flex items-center gap-2">
            {isKOTMode ? (
              <>
                <ChefHat className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm text-white" style={{ color: '#ffffff' }}>Kitchen Order Ticket (KOT Slip)</span>
              </>
            ) : (
              <>
                <Utensils className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-white" style={{ color: '#ffffff' }}>Customer Receipt (Tax Invoice)</span>
              </>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Preview Area (Compact, No Scroll) */}
        <div 
          className="thermal-modal-scroll p-3 sm:p-4 w-full block overflow-visible"
          style={{ 
            backgroundColor: '#0b1120',
            overflow: 'visible'
          }}
        >
          
          {/* Printable Thermal Paper Container */}
          <div
            ref={printableRef}
            id="printable-thermal-slip"
            className="thermal-receipt-sheet font-mono relative"
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              width: '100%',
              maxWidth: '360px',
              margin: '0 auto',
              padding: '10px 14px',
              borderRadius: '6px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
              borderTop: isKOTMode ? '3px solid #d97706' : '3px solid #000000',
              height: 'auto',
              minHeight: 'fit-content',
              lineHeight: '1.2',
              fontSize: '11px',
              fontFamily: 'monospace'
            }}
          >
            {isKOTMode ? (
              /* ============================================================== */
              /* TEMPLATE A: KITCHEN ORDER TICKET (KOT SLIP - CHEF ONLY)       */
              /* Zero financial details, bold high-contrast items and notes     */
              /* ============================================================== */
              <div className="space-y-1.5 text-black">
                {/* Header */}
                <div className="text-center pb-1.5 border-b-2 border-dashed border-neutral-800">
                  <span className="inline-block px-2 py-0.5 bg-neutral-900 text-white font-extrabold text-[10px] tracking-wider rounded mb-0.5">
                    KITCHEN ORDER TICKET
                  </span>
                  <h2 className="text-xs font-bold tracking-wide uppercase text-neutral-900">
                    BILAAL RESTAURANT
                  </h2>
                  <div className="text-[9px] font-semibold text-neutral-700">
                    {branchObj.name}
                  </div>
                </div>

                {/* Ticket Meta */}
                <div className="py-1 border-b-2 border-dashed border-neutral-800 space-y-0.5 text-[10px]">
                  <div className="flex justify-between items-baseline">
                    <span className="text-neutral-600 font-semibold">TICKET #:</span>
                    <span className="font-black text-xs text-neutral-950 tracking-wider">
                      {currentKOT.kotNumber.startsWith('KOT-') ? currentKOT.kotNumber : `KOT-${currentKOT.kotNumber}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-neutral-600 font-semibold">DESTINATION:</span>
                    <span className="font-black text-xs text-neutral-950 uppercase tracking-wide">
                      {currentKOT.orderType === 'takeaway' || currentKOT.orderType === 'parcel'
                        ? (currentKOT.takeawayId || 'TAKEAWAY / COUNTER')
                        : (currentKOT.tableNumber?.replace(/^(TABLE\s*)+/i, 'TABLE ') || 'DINE-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-600 font-semibold">ORDER TYPE:</span>
                    <span className="font-extrabold uppercase text-neutral-900">
                      {currentKOT.orderType.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-600 font-semibold">SERVER:</span>
                    <span className="font-bold text-neutral-900">
                      {currentKOT.serverName || currentKOT.waiterName || 'Staff'}
                    </span>
                  </div>

                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-600 font-semibold">TIME:</span>
                    <span className="font-bold text-neutral-900">
                      {currentKOT.timeFormatted || (currentKOT.createdAt ? new Date(currentKOT.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString())}
                    </span>
                  </div>
                </div>

                {/* Kitchen Items Body: High-Contrast Bold with QTY and Instructions */}
                <div className="py-1 border-b-2 border-dashed border-neutral-800">
                  <div className="flex justify-between font-black text-[10px] text-neutral-950 pb-1 border-b border-neutral-400 mb-1 uppercase tracking-wider">
                    <span>QTY</span>
                    <span>ITEM & INSTRUCTIONS</span>
                  </div>

                  <div className="space-y-1.5">
                    {currentKOT.items.map((item, idx) => {
                      const isVoided = item.status === 'voided';
                      const cleanItemName = item.name
                        .replace(/\s*\((?:Dine-In|Dine\s*In|DineIn)\)/gi, '')
                        .replace(/\s*\[(?:Dine-In|Dine\s*In|DineIn)\]/gi, '')
                        .trim();

                      return (
                        <div 
                          key={idx} 
                          className={`flex items-start gap-2 ${isVoided ? 'opacity-40 line-through' : ''}`}
                        >
                          {/* Quantity Badge */}
                          <div className="w-6 shrink-0 text-center font-black text-xs leading-none py-0.5 bg-neutral-900 text-white rounded">
                            {item.quantity}
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-[11px] leading-tight text-neutral-950 uppercase tracking-tight whitespace-normal break-words">
                              {cleanItemName}
                            </div>

                            {/* Cooking instructions / notes */}
                            {item.notes && (
                              <div className="mt-0.5 pl-1.5 border-l-2 border-amber-600 text-[9px] font-bold text-amber-900 italic">
                                Note: {item.notes}
                              </div>
                            )}

                            {/* Parcel Indicator */}
                            {item.serveType === 'PARCEL' && (
                              <div className="mt-0.5 inline-block px-1 py-0.2 bg-neutral-800 text-white text-[8px] font-extrabold uppercase rounded">
                                [PACK AS PARCEL]
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chef / Special Note Banner */}
                {(currentKOT.specialInstructions) && (
                  <div className="p-1.5 bg-amber-50 border border-amber-300 rounded text-[10px] text-amber-950 font-bold space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-amber-800 font-extrabold block">
                      CHEF NOTE / TABLE REQUEST:
                    </span>
                    <p className="italic">{currentKOT.specialInstructions}</p>
                  </div>
                )}

                {/* Footer Stamp */}
                <div className="text-center pt-1 text-[9px] font-bold text-neutral-600">
                  <div>*** KITCHEN EXPEDITE COPY ***</div>
                </div>
              </div>
            ) : (
              /* ============================================================== */
              /* TEMPLATE B: CUSTOMER TAX INVOICE (RECEIPT)                    */
              /* Standard Indian Restaurant Receipt: Pure B&W, 80mm mono       */
              /* ============================================================== */
              <div 
                className="space-y-1 text-black font-mono leading-tight"
                style={{ backgroundColor: '#ffffff', color: '#000000', fontSize: '11px', lineHeight: '1.2' }}
              >
                {/* 1. Centered Business Branding */}
                <div className="text-center">
                  <h1 className="text-sm font-black tracking-wider text-black uppercase">
                    {restaurantSettings?.name || 'BILAAL RESTAURANT'}
                  </h1>
                  <div className="text-[10px] font-bold text-black uppercase">
                    {branchObj.name}
                  </div>
                  <p className="text-[9px] text-black leading-tight whitespace-normal">
                    {restaurantSettings?.address || branchObj.address}
                  </p>
                  <p className="text-[9px] text-black font-bold">
                    Contact: {restaurantSettings?.phone || branchObj.phone}
                  </p>
                  <div className="text-[9px] text-black font-bold">
                    GSTIN: {restaurantSettings?.gstin || branchObj.gstin} • FSSAI: {restaurantSettings?.fssai || currentBill.fssaiLicNo || branchObj.fssai || '11223334000128'}
                  </div>
                  <div className="text-[10px] font-black tracking-widest text-black mt-0.5 uppercase">
                    {currentBill.status === 'provisional' || currentBill.isEstimate ? '** ESTIMATE / PREVIEW **' : '** TAX INVOICE **'}
                  </div>
                </div>

                {/* Dashed horizontal divider line */}
                <div className="text-[10px] tracking-tight overflow-hidden text-center select-none font-bold text-black my-0.5 leading-none">
                  ---------------------------------
                </div>

                {/* 1. Invoice Info Grid (clean 2-column key-value alignment) */}
                <div className="text-[10px] font-bold space-y-0.5 text-black">
                  <div className="flex justify-between items-center">
                    <span>
                      Bill No: <span className="font-extrabold">{currentBill.billNumber.startsWith('INV-') ? currentBill.billNumber : `#${currentBill.billNumber}`}</span>
                    </span>
                    <span>
                      Date: <span className="font-normal">{formattedDate}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>
                      Tbl No: <span className="font-normal">{tableDisplay}</span>
                    </span>
                    <span>
                      User: <span className="font-normal">{userDisplay}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>
                      Stw: <span className="font-normal">{stewardDisplay}</span>
                    </span>
                    {currentBill.time && (
                      <span className="text-[9px] font-normal">
                        Time: {currentBill.time}
                      </span>
                    )}
                  </div>
                </div>

                {/* Dashed horizontal divider line */}
                <div className="text-[10px] tracking-tight overflow-hidden text-center select-none font-bold text-black my-0.5 leading-none">
                  ---------------------------------
                </div>

                {/* 2. LINE ITEMS TABLE (NO KOT DETAILS) */}
                <div>
                  {/* Table Header: Items | Qty | Rate | Amount */}
                  <div className="grid grid-cols-12 text-[10px] font-black pb-0.5 border-b border-black border-dashed">
                    <span className="col-span-6 text-left">Items</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-2 text-right">Rate</span>
                    <span className="col-span-2 text-right">Amount</span>
                  </div>

                  {/* Line Items: clean 2nd line wrapping, no KOT references */}
                  <div className="space-y-0.5 pt-0.5">
                    {consolidatedBillItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 text-[10px] items-start leading-tight">
                        <div className="col-span-6 pr-1 font-bold text-black whitespace-normal break-words leading-tight uppercase">
                          {item.cleanName}
                        </div>
                        <span className="col-span-2 text-center font-bold text-black">
                          {item.quantity}
                        </span>
                        <span className="col-span-2 text-right text-black font-normal">
                          {item.rate.toFixed(2)}
                        </span>
                        <span className="col-span-2 text-right font-bold text-black">
                          {item.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dashed horizontal divider line */}
                <div className="text-[10px] tracking-tight overflow-hidden text-center select-none font-bold text-black my-0.5 leading-none">
                  ---------------------------------
                </div>

                {/* 3. TAXATION & FINANCIAL TOTALS SECTION (RIGHT-ALIGNED) */}
                <div className="space-y-0.5 text-[10px] font-bold text-black">
                  <div className="flex justify-between">
                    <span>Sub Total:</span>
                    <span>₹{calcSubtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>CGST {configuredCgstPercent}%:</span>
                    <span>₹{calcCgst.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>SGST {configuredSgstPercent}%:</span>
                    <span>₹{calcSgst.toFixed(2)}</span>
                  </div>

                  {currentBill.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-₹{currentBill.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Heavy dashed divider line */}
                  <div className="text-[10px] tracking-tight overflow-hidden text-center select-none font-black text-black pt-0.5 my-0.5 leading-none">
                    =================================
                  </div>

                  {/* GRAND TOTAL (Large bold font) */}
                  <div className="flex justify-between items-baseline font-black text-xs pt-0.5 pb-0.5 text-black">
                    <span className="text-[10px] uppercase tracking-wide">GRAND TOTAL:</span>
                    <span className="text-sm font-black">
                      ₹{calcGrandTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Bottom divider line */}
                  <div className="text-[10px] tracking-tight overflow-hidden text-center select-none font-bold text-black my-0.5 leading-none">
                    ---------------------------------
                  </div>
                </div>

                {/* Payment & Footer */}
                <div className="text-center pt-0.5 space-y-0.5 text-black">
                  {currentBill.status !== 'paid' || currentBill.isEstimate || (currentBill as any).paymentStatus === 'UNPAID' ? (
                    <div className="text-[9px] font-extrabold uppercase border border-black py-0.5 px-2 inline-block">
                      *** UNPAID / ESTIMATE - NOT SETTLED ***
                    </div>
                  ) : (
                    <div className="text-[10px] font-extrabold uppercase">
                      PAID VIA {currentBill.paymentMethod.toUpperCase()}
                    </div>
                  )}

                  {currentBill.status === 'paid' && currentBill.paymentMethod === 'split' && currentBill.splitDetails && (
                    <div className="text-[9px] flex justify-center gap-2 font-bold">
                      {currentBill.splitDetails.cash > 0 && <span>Cash: ₹{currentBill.splitDetails.cash}</span>}
                      {currentBill.splitDetails.upi > 0 && <span>UPI: ₹{currentBill.splitDetails.upi}</span>}
                      {currentBill.splitDetails.card > 0 && <span>Card: ₹{currentBill.splitDetails.card}</span>}
                    </div>
                  )}

                  <div className="pt-0.5 text-[9px] font-bold">
                    <p>{restaurantSettings?.footerMessage || 'Thank you for dining with us!'}</p>
                    <p className="mt-0.5">Please visit again.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Action Controls */}
        <div 
          className="thermal-modal-footer p-4 border-t flex items-center justify-between gap-3 font-sans"
          style={{ backgroundColor: '#0b1120', borderColor: '#1e293b' }}
        >
          <button
            type="button"
            onClick={handleDownload}
            className="thermal-modal-btn-download flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            style={{ 
              backgroundColor: '#1e293b', 
              color: '#f1f5f9', 
              border: '1px solid #334155',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span>Download</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="thermal-modal-btn-close px-4 py-2 rounded-lg transition-colors cursor-pointer"
              style={{ 
                backgroundColor: '#1e293b', 
                color: '#f1f5f9', 
                border: '1px solid #334155',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="thermal-modal-btn-print flex items-center gap-2 px-5 py-2 rounded-lg text-white shadow-sm transition-all cursor-pointer hover:bg-[#8f1020] active:bg-[#4a030c]"
              style={{ 
                backgroundColor: '#7a0c1a', 
                border: '1px solid #8f1020',
                color: '#ffffff',
                fontWeight: 850,
                fontSize: '13px'
              }}
            >
              <Printer className="w-4 h-4 text-white" />
              <span style={{ color: '#ffffff', fontWeight: 850, fontSize: '13px' }}>
                {isKOTMode ? 'Print KOT Slip' : 'Print Receipt'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default ThermalReceiptModal;
