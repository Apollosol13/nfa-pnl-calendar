import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Share2 } from 'lucide-react';
import { supabase, PNLEntry } from '../lib/supabase';
import { PNLModal } from './PNLModal';
import { ShareCard } from './ShareCard';

export function PNLCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<Record<string, PNLEntry>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareCard, setShowShareCard] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [currentDate]);

  const loadEntries = async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Load entries for current month plus adjacent months to show in calendar
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;

    const startDate = new Date(prevMonthYear, prevMonth, 1);
    const endDate = new Date(nextMonthYear, nextMonth + 1, 0);

    const { data, error } = await supabase
      .from('pnl_entries')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (!error && data) {
      const entriesMap: Record<string, PNLEntry> = {};
      data.forEach((entry) => {
        entriesMap[entry.date] = entry;
      });
      setEntries(entriesMap);
    }
    setLoading(false);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
    }> = [];

    // Add trailing days from previous month
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false,
      });
    }

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        month,
        year,
        isCurrentMonth: true,
      });
    }

    // Add leading days from next month to complete the grid (42 cells = 6 weeks)
    const remainingCells = 42 - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;

    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        day,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const formatDate = (year: number, month: number, day: number) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };

  const getMonthlyTotal = () => {
    return Object.values(entries).reduce((sum, entry) => sum + Number(entry.pnl_amount), 0);
  };

  const getCurrentMonthEntries = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return Object.values(entries).filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === month && entryDate.getFullYear() === year;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (year: number, month: number, day: number, isCurrentMonth: boolean) => {
    const dateStr = formatDate(year, month, day);
    setSelectedDate(dateStr);
    setIsModalOpen(true);

    // Navigate to the clicked month if it's not the current month
    if (!isCurrentMonth) {
      setCurrentDate(new Date(year, month, 1));
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    loadEntries();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth();
  const monthlyTotal = getMonthlyTotal();

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-zinc-900 rounded-2xl p-6 mb-6 border border-zinc-800">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img
              src="/nfa_logo_transparent_medium.png"
              alt="NFA Logo"
              className="h-16 md:h-20"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-zinc-300" />
            </button>

            <div className="text-center flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h1>
              <div className="text-sm text-zinc-400">
                Monthly P/L:
                <span className={`ml-2 text-lg font-semibold ${
                  monthlyTotal >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatCurrency(monthlyTotal)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShareCard(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden md:inline">Share</span>
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-zinc-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-zinc-800">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`text-center py-3 text-sm font-semibold text-zinc-400 bg-zinc-950 ${
                  index !== 6 ? 'border-r border-zinc-800' : ''
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {days.map((dayInfo, index) => {
              const dateStr = formatDate(dayInfo.year, dayInfo.month, dayInfo.day);
              const entry = entries[dateStr];
              const pnl = entry ? Number(entry.pnl_amount) : 0;
              const isPositive = pnl > 0;
              const isNegative = pnl < 0;
              const hasEntry = !!entry;
              const isToday =
                dayInfo.isCurrentMonth &&
                dayInfo.day === new Date().getDate() &&
                dayInfo.month === new Date().getMonth() &&
                dayInfo.year === new Date().getFullYear();

              const isLastColumn = (index + 1) % 7 === 0;
              const isLastRow = index >= days.length - 7;

              return (
                <button
                  key={`${dayInfo.year}-${dayInfo.month}-${dayInfo.day}`}
                  onClick={() => handleDayClick(dayInfo.year, dayInfo.month, dayInfo.day, dayInfo.isCurrentMonth)}
                  className={`aspect-square p-2 md:p-3 transition-colors duration-150 relative group ${
                    !isLastColumn ? 'border-r border-zinc-800' : ''
                  } ${
                    !isLastRow ? 'border-b border-zinc-800' : ''
                  } ${
                    !dayInfo.isCurrentMonth
                      ? 'opacity-40'
                      : ''
                  } ${
                    hasEntry
                      ? isPositive
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-red-500 hover:bg-red-600'
                      : 'bg-black hover:bg-zinc-900'
                  } ${isToday ? 'ring-2 ring-inset ring-blue-400' : ''}`}
                >
                  <div className="flex flex-col h-full justify-between">
                    <div className="text-right">
                      <span className="text-xs md:text-sm font-semibold text-white">
                        {dayInfo.day}
                      </span>
                    </div>

                    {hasEntry && (
                      <div className="text-left">
                        <div className="text-xs md:text-sm font-bold text-white truncate">
                          {formatCurrency(pnl)}
                        </div>
                        <div className="text-xs text-white/80">
                          {entry.num_trades} trades
                        </div>
                      </div>
                    )}

                    {!hasEntry && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-6 h-6 text-zinc-400" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 rounded-lg p-6 text-white">
              Loading...
            </div>
          </div>
        )}
      </div>

      {/* Modal for adding/editing entries */}
      {isModalOpen && selectedDate && (
        <PNLModal
          date={selectedDate}
          entry={entries[selectedDate]}
          onClose={handleModalClose}
        />
      )}

      {/* Share Card */}
      {showShareCard && (
        <ShareCard
          month={monthNames[currentDate.getMonth()]}
          year={currentDate.getFullYear()}
          entries={getCurrentMonthEntries()}
          monthlyTotal={monthlyTotal}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  );
}
