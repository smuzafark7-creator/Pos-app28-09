import React, { useState } from 'react';
import { KOT, ServeType } from '../types';
import { X, Edit3, Trash2 } from 'lucide-react';

interface KOTModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  kot: KOT | null;
  itemIndex: number;
  onConfirmModify: (updates: { notes?: string; serveType?: ServeType }) => void;
  onRequestCancel?: () => void;
}

export const KOTModifyModal: React.FC<KOTModifyModalProps> = ({
  isOpen,
  onClose,
  kot,
  itemIndex,
  onConfirmModify,
  onRequestCancel,
}) => {
  const targetItem = kot && itemIndex >= 0 ? kot.items[itemIndex] : null;
  const [notes, setNotes] = useState(targetItem?.notes || '');
  const [serveType, setServeType] = useState<ServeType>(targetItem?.serveType || 'DINE_IN');

  if (!isOpen || !kot || !targetItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmModify({ notes, serveType });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Edit3 className="w-5 h-5" />
            <span>Modify Item Note / Serve Type</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
            <div className="text-slate-400">Item:</div>
            <div className="font-bold text-white text-sm">{targetItem.name} ({targetItem.quantity}x)</div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-bold">Special Note</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Less spicy, pack gravy separately"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-bold">Serve Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setServeType('DINE_IN')}
                className={`flex-1 py-2 rounded-xl font-bold ${
                  serveType === 'DINE_IN' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Dine-In
              </button>
              <button
                type="button"
                onClick={() => setServeType('PARCEL')}
                className={`flex-1 py-2 rounded-xl font-bold ${
                  serveType === 'PARCEL' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Parcel
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {onRequestCancel ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestCancel();
                }}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Void Item</span>
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
