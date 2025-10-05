"use client";
import React, { useState } from 'react';
import { formatLocalDate, isToday } from '../../lib/dateUtils';

interface MoodEntry {
  id: number;
  date: string; // YYYY-MM-DD
  mood: 'happy' | 'motivated' | 'tired' | 'stressed';
  moodLabel: string;
  cravingLevel: number;
  comment: string;
  timestamp: string; // ISO string
}

interface MoodCalendarProps {
  entries: MoodEntry[];
}

const MoodCalendar: React.FC<MoodCalendarProps> = ({ entries }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);

  // إنشاء خريطة للإدخالات حسب التاريخ
  const entriesByDate = entries.reduce((acc, entry) => {
    acc[entry.date] = entry;
    return acc;
  }, {} as Record<string, MoodEntry>);

  // الحصول على أيام الشهر
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // الحصول على يوم الأسبوع للأول من الشهر
    // في JS: أحد=0، اثنين=1، ثلاثاء=2، أربعاء=3، خميس=4، جمعة=5، سبت=6
    // نريد: سبت=0، أحد=1، اثنين=2، ثلاثاء=3، أربعاء=4، خميس=5، جمعة=6
    const firstDayOfWeek = firstDay.getDay();
    const startOffset = firstDayOfWeek === 6 ? 0 : firstDayOfWeek + 1; // السبت = 0
    
    const days = [];
    
    // إضافة الأيام من الشهر السابق (إذا لزم الأمر)
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDay = new Date(year, month, 1 - i - 1);
      days.push(prevDay);
    }
    
    // إضافة أيام الشهر الحالي
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    // إضافة الأيام من الشهر التالي لإكمال الشبكة
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push(new Date(year, month + 1, day));
    }
    
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'happy': return '😄';
      case 'motivated': return '💪';
      case 'tired': return '😴';
      case 'stressed': return '😫';
      default: return '';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy': return '#4CAF50';
      case 'motivated': return '#FF9800';
      case 'tired': return '#9E9E9E';
      case 'stressed': return '#F44336';
      default: return '#E0E0E0';
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const formatDate = (date: Date) => {
    return formatLocalDate(date);
  };

  return (
    <div className="mood-calendar">
      <div className="calendar-header">
        <button onClick={() => navigateMonth(-1)} className="nav-button">
          ‹
        </button>
        <h3 className="month-title">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button onClick={() => navigateMonth(1)} className="nav-button">
          ›
        </button>
      </div>

      <div className="weekdays">
        {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((day, index) => {
          const dateStr = formatDate(day);
          const entry = entriesByDate[dateStr];
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          
          return (
            <div
              key={index}
              className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday(day) ? 'today' : ''} ${entry ? 'has-entry' : ''}`}
              onClick={() => entry && setSelectedEntry(entry)}
              style={{
                backgroundColor: entry ? getMoodColor(entry.mood) + '20' : undefined,
                borderColor: entry ? getMoodColor(entry.mood) : undefined
              }}
            >
              <div className="day-number">{day.getDate()}</div>
              {entry && (
                <div className="day-mood">
                  {getMoodEmoji(entry.mood)}
                  <div className="craving-indicator">
                    <div className="craving-bar" style={{ 
                      width: `${(entry.cravingLevel / 10) * 100}%`,
                      backgroundColor: entry.cravingLevel > 7 ? '#f44336' : entry.cravingLevel > 4 ? '#ff9800' : '#4caf50'
                    }}></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* نافذة تفاصيل الإدخال */}
      {selectedEntry && (
        <div className="entry-modal" onClick={() => setSelectedEntry(null)}>
          <div className="entry-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="entry-header">
              <h4>تفاصيل يوم {selectedEntry.date}</h4>
              <button onClick={() => setSelectedEntry(null)} className="close-btn">×</button>
            </div>
            <div className="entry-details">
              <div className="mood-detail">
                <span className="mood-emoji">{getMoodEmoji(selectedEntry.mood)}</span>
                <span className="mood-label">{selectedEntry.moodLabel}</span>
              </div>
              <div className="craving-detail">
                <span>مستوى الرغبة في التدخين: {selectedEntry.cravingLevel}/10</span>
                <div className="craving-bar-full">
                  <div 
                    className="craving-fill" 
                    style={{ 
                      width: `${(selectedEntry.cravingLevel / 10) * 100}%`,
                      backgroundColor: selectedEntry.cravingLevel > 7 ? '#f44336' : selectedEntry.cravingLevel > 4 ? '#ff9800' : '#4caf50'
                    }}
                  ></div>
                </div>
              </div>
              {selectedEntry.comment && (
                <div className="comment-detail">
                  <strong>التعليق:</strong>
                  <p>{selectedEntry.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .mood-calendar {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          margin-top: 20px;
          max-width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .nav-button {
          background: #667eea;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.3s ease;
        }

        .nav-button:hover {
          background: #5a67d8;
        }

        .month-title {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          margin-bottom: 10px;
        }

        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 10px;
        }

        .weekday {
          padding: 10px;
          text-align: center;
          font-weight: bold;
          color: #666;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .calendar-day {
          aspect-ratio: 1;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          min-height: 45px;
          font-size: 0.85rem;
        }

        .calendar-day:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .calendar-day.other-month {
          opacity: 0.3;
          cursor: default;
          color: #ccc;
        }

        .calendar-day.other-month .day-number {
          color: #ccc;
        }

        .calendar-day.today {
          border-color: #667eea;
          font-weight: bold;
        }

        .calendar-day.has-entry {
          cursor: pointer;
          border-width: 3px;
        }

        .day-number {
          font-weight: bold;
          color: #333;
        }

        .day-mood {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .craving-indicator {
          width: 20px;
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          overflow: hidden;
        }

        .craving-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .entry-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .entry-modal-content {
          background: white;
          border-radius: 12px;
          padding: 25px;
          max-width: 400px;
          width: 90%;
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .entry-header h4 {
          margin: 0;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }

        .entry-details {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .mood-detail {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
        }

        .mood-emoji {
          font-size: 2rem;
        }

        .craving-detail {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .craving-bar-full {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .craving-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .comment-detail p {
          margin: 5px 0 0 0;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
          color: #666;
        }

        @media (max-width: 768px) {
          .mood-calendar {
            padding: 10px;
            margin: 5px 2px;
            border-radius: 8px;
          }

          .calendar-header {
            margin-bottom: 12px;
          }

          .calendar-header h3 {
            font-size: 1rem;
          }

          .nav-button {
            width: 32px;
            height: 32px;
            font-size: 1.1rem;
          }

          .weekdays {
            gap: 2px;
            margin-bottom: 6px;
          }

          .weekday {
            font-size: 0.7rem;
            padding: 4px 1px;
            background: transparent;
            border-radius: 4px;
          }

          .calendar-grid {
            gap: 2px;
            max-width: 100%;
          }

          .calendar-day {
            padding: 3px 1px;
            border-radius: 4px;
            min-height: 38px;
            font-size: 0.75rem;
            aspect-ratio: 1;
          }

          .day-number {
            font-size: 0.7rem;
            margin-bottom: 1px;
          }

          .day-mood {
            font-size: 0.65rem;
            margin: 1px 0;
          }

          .craving-indicator {
            width: 12px;
            height: 2px;
            margin-top: 1px;
          }
        }

        @media (max-width: 480px) {
          .mood-calendar {
            padding: 6px;
            margin: 3px 1px;
          }

          .calendar-header h3 {
            font-size: 0.9rem;
          }

          .nav-button {
            width: 28px;
            height: 28px;
            font-size: 0.9rem;
          }

          .weekday {
            font-size: 0.6rem;
            padding: 3px 0.5px;
          }

          .calendar-grid {
            gap: 1px;
          }

          .calendar-day {
            padding: 2px 0.5px;
            border-radius: 3px;
            min-height: 32px;
            font-size: 0.7rem;
            border-width: 1px;
          }

          .calendar-day.has-entry {
            border-width: 2px;
          }

          .day-number {
            font-size: 0.6rem;
            margin-bottom: 1px;
          }

          .day-mood {
            font-size: 0.5rem;
            margin: 0;
          }

          .craving-indicator {
            width: 8px;
            height: 1.5px;
            margin-top: 0;
          }
        }

        @media (max-width: 320px) {
          .mood-calendar {
            padding: 4px;
            margin: 2px 0;
          }

          .calendar-header h3 {
            font-size: 0.85rem;
          }

          .nav-button {
            width: 25px;
            height: 25px;
            font-size: 0.8rem;
          }

          .weekday {
            font-size: 0.55rem;
            padding: 2px 0;
          }

          .calendar-grid {
            gap: 0.5px;
          }

          .calendar-day {
            padding: 1px;
            min-height: 28px;
            font-size: 0.65rem;
          }

          .day-number {
            font-size: 0.55rem;
          }

          .day-mood {
            font-size: 0.45rem;
          }

          .craving-indicator {
            width: 6px;
            height: 1px;
          }
        }
      `}</style>
    </div>
  );
};

export default MoodCalendar;