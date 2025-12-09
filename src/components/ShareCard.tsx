import { X, Download, Share2 } from 'lucide-react';
import { PNLEntry } from '../lib/supabase';
import { useRef } from 'react';

interface ShareCardProps {
  month: string;
  year: number;
  entries: PNLEntry[];
  monthlyTotal: number;
  onClose: () => void;
}

export function ShareCard({ month, year, entries, monthlyTotal, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateStats = () => {
    if (entries.length === 0) {
      return {
        tradingDays: 0,
        winRate: 0,
        bestDay: 0,
        worstDay: 0,
        totalTrades: 0,
      };
    }

    const winningDays = entries.filter(e => Number(e.pnl_amount) > 0).length;
    const winRate = (winningDays / entries.length) * 100;
    const bestDay = Math.max(...entries.map(e => Number(e.pnl_amount)));
    const worstDay = Math.min(...entries.map(e => Number(e.pnl_amount)));
    const totalTrades = entries.reduce((sum, e) => sum + Number(e.num_trades), 0);

    return {
      tradingDays: entries.length,
      winRate,
      bestDay,
      worstDay,
      totalTrades,
    };
  };

  const stats = calculateStats();
  const isPositive = monthlyTotal >= 0;

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `pnl-${month}-${year}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error downloading card:', error);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `pnl-${month}-${year}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${month} ${year} Trading Results`,
          });
        } else {
          handleDownload();
        }
      });
    } catch (error) {
      console.error('Error sharing card:', error);
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative max-w-2xl w-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Share Card */}
        <div
          ref={cardRef}
          className="bg-black border border-zinc-800 rounded-3xl p-8 shadow-2xl"
        >
          {/* Logo and Title */}
          <div className="flex items-center gap-4 mb-8">
            <img
              src="/nfa_logo_transparent_medium.png"
              alt="NFA Logo"
              className="h-16"
            />
            <div>
              <h2 className="text-2xl font-bold text-white">NFA Trading</h2>
              <p className="text-zinc-400 text-sm">Monthly Report</p>
            </div>
          </div>

          {/* Month and Year */}
          <div className="mb-4">
            <p className="text-zinc-400 text-sm uppercase tracking-wide">{month} {year}</p>
          </div>

          {/* Main P/L */}
          <div className="mb-8">
            <div className={`text-5xl font-bold mb-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{formatCurrency(monthlyTotal)}
            </div>
            <p className="text-zinc-400 text-sm">Total P/L</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-zinc-500 text-sm mb-1">TRADING DAYS</p>
              <p className="text-white text-2xl font-semibold">{stats.tradingDays}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-sm mb-1">TOTAL TRADES</p>
              <p className="text-white text-2xl font-semibold">{stats.totalTrades}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-sm mb-1">WIN RATE</p>
              <p className="text-white text-2xl font-semibold">{stats.winRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-zinc-500 text-sm mb-1">BEST DAY</p>
              <p className="text-green-400 text-2xl font-semibold">{formatCurrency(stats.bestDay)}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-800 my-6"></div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-zinc-500 text-sm">Track your trading performance</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 justify-center">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
          >
            <Download className="w-5 h-5" />
            Download
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
