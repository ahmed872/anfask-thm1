"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';

interface MoodEntry {
  date: string;
  mood: number;
  notes?: string;
  timestamp: Date;
}

interface DailyMoodTrackerProps {
  className?: string;
}

const MOOD_LEVELS = [
  { value: 1, emoji: '😢', label: 'سيء جداً', color: '#ff4444' },
  { value: 2, emoji: '😟', label: 'سيء', color: '#ff7744' },
  { value: 3, emoji: '😐', label: 'عادي', color: '#ffaa44' },
  { value: 4, emoji: '🙂', label: 'جيد', color: '#77dd77' },
  { value: 5, emoji: '😊', label: 'ممتاز', color: '#44dd44' }
];

const DailyMoodTracker: React.FC<DailyMoodTrackerProps> = ({ className = '' }) => {
  const [currentMood, setCurrentMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(null);
  const [recentEntries, setRecentEntries] = useState<MoodEntry[]>([]);
  const [showNotes, setShowNotes] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!auth.currentUser) return;

    // Load today's entry
    const loadTodayEntry = async () => {
      try {
        const docRef = doc(db, 'moodEntries', `${auth.currentUser?.uid}_${today}`);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as MoodEntry;
          setTodayEntry(data);
          setCurrentMood(data.mood);
          setNotes(data.notes || '');
        }
      } catch (error) {
        console.error('Error loading today mood entry:', error);
      }
    };

    // Load recent entries for history
    const loadRecentEntries = () => {
      const q = query(
        collection(db, 'moodEntries'),
        where('userId', '==', auth.currentUser?.uid),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const entries: MoodEntry[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          entries.push({
            date: data.date,
            mood: data.mood,
            notes: data.notes,
            timestamp: data.timestamp.toDate()
          });
        });
        setRecentEntries(entries.slice(0, 7)); // Last 7 entries
      });

      return unsubscribe;
    };

    loadTodayEntry();
    const unsubscribe = loadRecentEntries();

    return () => unsubscribe();
  }, [today]);

  const saveMoodEntry = async () => {
    if (!auth.currentUser || currentMood === null) return;

    setIsLoading(true);
    try {
      const docRef = doc(db, 'moodEntries', `${auth.currentUser.uid}_${today}`);
      const moodEntry: MoodEntry = {
        date: today,
        mood: currentMood,
        notes: notes.trim() || undefined,
        timestamp: new Date()
      };

      await setDoc(docRef, {
        ...moodEntry,
        userId: auth.currentUser.uid
      });

      setTodayEntry(moodEntry);
      
      // Show success feedback
      const successMsg = document.createElement('div');
      successMsg.textContent = '✅ تم حفظ حالتك المزاجية';
      successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(successMsg);
      setTimeout(() => document.body.removeChild(successMsg), 3000);

    } catch (error) {
      console.error('Error saving mood entry:', error);
      alert('حدث خطأ في حفظ البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodById = (id: number) => MOOD_LEVELS.find(m => m.value === id);

  const getAverageMood = () => {
    if (recentEntries.length === 0) return null;
    const sum = recentEntries.reduce((acc, entry) => acc + entry.mood, 0);
    return Math.round(sum / recentEntries.length);
  };

  const averageMood = getAverageMood();
  const averageMoodData = averageMood ? getMoodById(averageMood) : null;

  return (
    <div className={`mood-tracker ${className}`}>
      <div className="mood-header">
        <h3>🎭 كيف حالتك المزاجية اليوم؟</h3>
        {todayEntry && (
          <div className="entry-status">
            <span className="status-badge">تم التسجيل</span>
          </div>
        )}
      </div>

      <div className="mood-selector">
        {MOOD_LEVELS.map((mood) => (
          <button
            key={mood.value}
            onClick={() => setCurrentMood(mood.value)}
            className={`mood-btn ${currentMood === mood.value ? 'selected' : ''}`}
            style={{
              borderColor: currentMood === mood.value ? mood.color : '#ddd',
              backgroundColor: currentMood === mood.value ? mood.color + '20' : 'white'
            }}
          >
            <span className="mood-emoji">{mood.emoji}</span>
            <span className="mood-label">{mood.label}</span>
          </button>
        ))}
      </div>

      {currentMood && (
        <div className="mood-actions">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="notes-toggle"
          >
            📝 {showNotes ? 'إخفاء' : 'إضافة'} ملاحظة
          </button>

          {showNotes && (
            <div className="notes-section">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="شاركنا أكثر عن شعورك اليوم... (اختياري)"
                className="notes-input"
                rows={3}
              />
            </div>
          )}

          <button
            onClick={saveMoodEntry}
            disabled={isLoading}
            className="save-btn"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                💾 حفظ الحالة المزاجية
              </>
            )}
          </button>
        </div>
      )}

      {recentEntries.length > 0 && (
        <div className="mood-summary">
          <div className="summary-header">
            <h4>📊 ملخص المزاج الأخير</h4>
            {averageMoodData && (
              <div className="average-mood">
                <span>المتوسط: </span>
                <span className="avg-emoji">{averageMoodData.emoji}</span>
                <span className="avg-label">{averageMoodData.label}</span>
              </div>
            )}
          </div>

          <div className="mood-history">
            {recentEntries.slice(0, 5).map((entry) => {
              const moodData = getMoodById(entry.mood);
              const date = new Date(entry.date);
              const isToday = entry.date === today;
              
              return (
                <div key={entry.date} className={`history-item ${isToday ? 'today' : ''}`}>
                  <div className="history-date">
                    {isToday ? 'اليوم' : date.toLocaleDateString('ar-EG', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="history-mood">
                    <span className="history-emoji">{moodData?.emoji}</span>
                    <span className="history-label">{moodData?.label}</span>
                  </div>
                  {entry.notes && (
                    <div className="history-notes" title={entry.notes}>
                      📝
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .mood-tracker {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .mood-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .mood-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .entry-status {
          display: flex;
          align-items: center;
        }

        .status-badge {
          background: #10b981;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .mood-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .mood-btn {
          border: 2px solid #ddd;
          border-radius: 12px;
          padding: 16px 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-height: 80px;
        }

        .mood-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .mood-btn.selected {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .mood-emoji {
          font-size: 1.5rem;
        }

        .mood-label {
          font-size: 0.85rem;
          font-weight: 500;
          text-align: center;
          color: #374151;
        }

        .mood-actions {
          margin-top: 20px;
        }

        .notes-toggle {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 16px;
          color: #374151;
          cursor: pointer;
          font-size: 0.9rem;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }

        .notes-toggle:hover {
          background: #e5e7eb;
        }

        .notes-section {
          margin-bottom: 16px;
        }

        .notes-input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 12px;
          font-family: inherit;
          font-size: 0.9rem;
          resize: vertical;
          min-height: 80px;
        }

        .notes-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .save-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 12px 24px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .mood-summary {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .summary-header h4 {
          margin: 0;
          color: #374151;
          font-size: 1rem;
          font-weight: 600;
        }

        .average-mood {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .avg-emoji {
          font-size: 1.1rem;
        }

        .avg-label {
          font-weight: 500;
          color: #374151;
        }

        .mood-history {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: #f9fafb;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .history-item.today {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }

        .history-item:hover {
          background: #f3f4f6;
        }

        .history-item.today:hover {
          background: #dbeafe;
        }

        .history-date {
          font-size: 0.85rem;
          color: #6b7280;
          font-weight: 500;
          min-width: 80px;
        }

        .history-mood {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .history-emoji {
          font-size: 1.1rem;
        }

        .history-label {
          font-size: 0.85rem;
          color: #374151;
          font-weight: 500;
        }

        .history-notes {
          font-size: 0.9rem;
          color: #6b7280;
          cursor: help;
        }

        @media (max-width: 640px) {
          .mood-tracker {
            padding: 16px;
          }

          .mood-selector {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .mood-btn {
            padding: 12px 4px;
            min-height: 70px;
          }

          .mood-emoji {
            font-size: 1.3rem;
          }

          .mood-label {
            font-size: 0.75rem;
          }

          .summary-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .history-item {
            padding: 8px 10px;
          }

          .history-date {
            min-width: 70px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyMoodTracker;