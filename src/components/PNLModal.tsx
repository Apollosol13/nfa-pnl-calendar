import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { supabase, PNLEntry } from '../lib/supabase';

interface PNLModalProps {
  date: string;
  entry?: PNLEntry;
  onClose: () => void;
}

export function PNLModal({ date, entry, onClose }: PNLModalProps) {
  const [pnlAmount, setPnlAmount] = useState(entry?.pnl_amount.toString() || '');
  const [numTrades, setNumTrades] = useState(entry?.num_trades.toString() || '0');
  const [notes, setNotes] = useState(entry?.notes || '');
  const [loading, setLoading] = useState(false);

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSave = async () => {
    if (!pnlAmount) return;

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be logged in to save entries');
      setLoading(false);
      return;
    }

    const entryData = {
      user_id: user.id,
      date,
      pnl_amount: parseFloat(pnlAmount),
      num_trades: parseInt(numTrades) || 0,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    if (entry) {
      // Update existing entry
      const { error } = await supabase
        .from('pnl_entries')
        .update(entryData)
        .eq('id', entry.id);

      if (error) {
        alert('Error updating entry: ' + error.message);
      }
    } else {
      // Insert new entry
      const { error } = await supabase
        .from('pnl_entries')
        .insert([entryData]);

      if (error) {
        alert('Error creating entry: ' + error.message);
      }
    }

    setLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!entry) return;
    if (!confirm('Are you sure you want to delete this entry?')) return;

    setLoading(true);
    const { error } = await supabase
      .from('pnl_entries')
      .delete()
      .eq('id', entry.id);

    if (error) {
      alert('Error deleting entry: ' + error.message);
    }

    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-md w-full p-6 border border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {entry ? 'Edit' : 'Add'} PNL Entry
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Date display */}
        <div className="mb-6 text-sm text-zinc-400">
          {formatDateDisplay(date)}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              P/L Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={pnlAmount}
              onChange={(e) => setPnlAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Number of Trades
            </label>
            <input
              type="number"
              value={numTrades}
              onChange={(e) => setNumTrades(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about today's trading..."
              rows={3}
              className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {entry && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading || !pnlAmount}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
