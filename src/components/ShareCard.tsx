import { X, Download, Share2, TrendingUp, Check } from 'lucide-react';
import { PNLEntry } from '../lib/supabase';
import { useRef, useState } from 'react';

// Component to handle logo with fallback
function TickerLogo({ ticker, logoUrl, size = 'w-8 h-8' }: { ticker: string; logoUrl: string | null; size?: string }) {
  const [imageError, setImageError] = useState(false);

  if (!logoUrl || imageError) {
    return (
      <div className={`${size} bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0`}>
        <span className="text-white font-bold text-sm">{ticker[0]}</span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={ticker}
      className={`${size} rounded-lg flex-shrink-0`}
      onError={() => setImageError(true)}
    />
  );
}

interface ShareCardProps {
  month: string;
  year: number;
  entries: PNLEntry[];
  monthlyTotal: number;
  onClose: () => void;
}

// Stock ticker to company domain mapping
const TICKER_TO_DOMAIN: Record<string, string> = {
  'AAPL': 'apple.com',
  'TSLA': 'tesla.com',
  'MSFT': 'microsoft.com',
  'GOOGL': 'google.com',
  'AMZN': 'amazon.com',
  'META': 'meta.com',
  'NVDA': 'nvidia.com',
  'AMD': 'amd.com',
  'NFLX': 'netflix.com',
  'DIS': 'disney.com',
  'BA': 'boeing.com',
  'GE': 'ge.com',
  'JPM': 'jpmorganchase.com',
  'V': 'visa.com',
  'MA': 'mastercard.com',
  'PYPL': 'paypal.com',
  'SQ': 'squareup.com',
  'COIN': 'coinbase.com',
  'GLD': 'gold.org',
  'SPY': 'spdr.com',
  'QQQ': 'invesco.com',
  'PLTR': 'palantir.com',
  'SOFI': 'sofi.com',
  'ROKU': 'roku.com',
  'SNAP': 'snap.com',
  'UBER': 'uber.com',
  'LYFT': 'lyft.com',
  'BABA': 'alibaba.com',
};

export function ShareCard({ month, year, entries, monthlyTotal, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSelectingWinners, setIsSelectingWinners] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [customTicker, setCustomTicker] = useState('');

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

  const toggleWinner = (ticker: string) => {
    if (selectedWinners.includes(ticker)) {
      setSelectedWinners(selectedWinners.filter(t => t !== ticker));
    } else if (selectedWinners.length < 3) {
      setSelectedWinners([...selectedWinners, ticker]);
    }
  };

  const addCustomTicker = () => {
    const ticker = customTicker.trim().toUpperCase();
    if (ticker && !selectedWinners.includes(ticker) && selectedWinners.length < 3) {
      setSelectedWinners([...selectedWinners, ticker]);
      setCustomTicker('');
    }
  };

  const getLogoUrl = (ticker: string) => {
    const domain = TICKER_TO_DOMAIN[ticker];
    if (domain) {
      return `https://logo.clearbit.com/${domain}`;
    }
    return null;
  };

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

  // Popular tickers for quick selection
  const popularTickers = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'SPY', 'GLD'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="relative max-w-2xl w-full my-8">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Winner Selector Modal */}
        {isSelectingWinners && (
          <div className="mb-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-white text-lg font-semibold mb-4">
              Select Top Winners (Max 3)
            </h3>
            
            {/* Popular Tickers */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {popularTickers.map(ticker => {
                const logoUrl = getLogoUrl(ticker);
                return (
                  <button
                    key={ticker}
                    onClick={() => toggleWinner(ticker)}
                    disabled={selectedWinners.length >= 3 && !selectedWinners.includes(ticker)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                      selectedWinners.includes(ticker)
                        ? 'bg-green-600 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {selectedWinners.includes(ticker) && <Check className="w-4 h-4" />}
                    <TickerLogo ticker={ticker} logoUrl={logoUrl} size="w-5 h-5" />
                    {ticker}
                  </button>
                );
              })}
            </div>

            {/* Custom Ticker Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={customTicker}
                onChange={(e) => setCustomTicker(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomTicker()}
                placeholder="Add custom ticker"
                className="flex-1 px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addCustomTicker}
                disabled={selectedWinners.length >= 3}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {/* Selected Winners */}
            {selectedWinners.length > 0 && (
              <div className="mb-4">
                <p className="text-zinc-400 text-sm mb-2">Selected:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedWinners.map(ticker => (
                    <div key={ticker} className="flex items-center gap-2 px-3 py-1 bg-green-600 rounded-lg">
                      <span className="text-white font-semibold">{ticker}</span>
                      <button
                        onClick={() => toggleWinner(ticker)}
                        className="text-white hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setIsSelectingWinners(false)}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        )}

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

          {/* Top Winners Section */}
          {selectedWinners.length > 0 && (
            <>
              <div className="border-t border-zinc-800 my-6"></div>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wide">Top Winners</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {selectedWinners.map((ticker) => {
                    const logoUrl = getLogoUrl(ticker);
                    return (
                      <div
                        key={ticker}
                        className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl"
                      >
                        <TickerLogo ticker={ticker} logoUrl={logoUrl} />
                        <span className="text-green-400 font-bold text-lg">{ticker}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

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
            onClick={() => setIsSelectingWinners(true)}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-semibold transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            {selectedWinners.length > 0 ? 'Edit Winners' : 'Add Winners'}
          </button>
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
