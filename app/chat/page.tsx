
// app/chat/page.tsx
// تأكد من إضافة 'use client'; في أول سطر
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { addChatMessage, getTodayMessages, deleteOldMessages, addActiveUser, removeActiveUser, getActiveUsersCount } from '../../lib/chatService';
import { getDoc, doc, collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
// Emoji Picker (dynamic import to avoid SSR issues)
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
import { db } from '../../lib/firebase';
// (تم حذف استيراد firebase غير المستخدم)
// المسار الصحيح لملف الـ CSS الرئيسي (globals.css) من داخل app/chat/
import '../globals.css';
import './chat.css'

interface ChatRoomState {
    status: 'open' | 'closed' | 'soon';
    participants: number;
    nextSessionTime: string; // Formatted string like "02:45:30"
}

// نقل الثوابت خارج المكون لضمان استقرارها
const CHAT_TIMES = [12, 16, 20]; // 12 PM, 4 PM, 8 PM (ساعات)
const SESSION_DURATION = 60; // 60 minutes


const ChatPage: React.FC = () => {
    // اسم المستخدم (الاسم المفضل) يجب أن يكون أول شيء
    const [username, setUsername] = useState('');

    const [maleRoomState, setMaleRoomState] = useState<ChatRoomState>(() => ({
        status: 'closed',
        participants: 0,
        nextSessionTime: '00:00:00',
    }));

    const [femaleRoomState, setFemaleRoomState] = useState<ChatRoomState>(() => ({
        status: 'closed',
        participants: 0,
        nextSessionTime: '00:00:00',
    }));

    // دوال المساعدة أصبحت الآن مستقرة تمامًا لأنها لا تعتمد على أي شيء داخل المكون
    const getCurrentTime = useCallback(() => {
        return new Date();
    }, []);

    const getNextChatTime = useCallback((now: Date) => {
        const currentHour = now.getHours();
        for (const time of CHAT_TIMES) {
            if (currentHour < time) {
                const nextTime = new Date(now);
                nextTime.setHours(time, 0, 0, 0);
                return nextTime;
            }
        }
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(CHAT_TIMES[0], 0, 0, 0);
        return tomorrow;
    }, []); 

    const isCurrentlyOpen = useCallback((now: Date) => {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        return CHAT_TIMES.some(time => {
            return currentHour === time && currentMinute < SESSION_DURATION;
        });
    }, []); 

    // هذه الدالة أيضًا أصبحت مستقرة تمامًا
    // تحديث الوقت والمؤقت كل ثانية، وعدد المشاركين كل 10 ثواني أو عند الدخول/الخروج
    const [participants, setParticipants] = useState({ male: 0, female: 0 });
    const updateRoomStatesLogic = useCallback((opts?: { updateParticipants?: boolean }) => {
        const now = getCurrentTime();
        const nextTime = getNextChatTime(now);
        const timeDiff = nextTime.getTime() - now.getTime();

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const openStatus = isCurrentlyOpen(now) ? 'open' : 'closed';
        const soonStatus = timeDiff > 0 && timeDiff <= (15 * 60 * 1000) ? 'soon' : openStatus;

        setMaleRoomState(prevState => ({
            ...prevState,
            status: soonStatus,
            nextSessionTime: timeString,
            participants: participants.male,
        }));

        setFemaleRoomState(prevState => ({
            ...prevState,
            status: soonStatus,
            nextSessionTime: timeString,
            participants: participants.female,
        }));

        // تحديث عدد المشاركين إذا طلب أو كل 10 ثواني
        if (opts?.updateParticipants) {
            getActiveUsersCount('male').then(maleCount => {
                setParticipants(p => ({ ...p, male: maleCount }));
            });
            getActiveUsersCount('female').then(femaleCount => {
                setParticipants(p => ({ ...p, female: femaleCount }));
            });
        }
    }, [getCurrentTime, getNextChatTime, isCurrentlyOpen, participants.male, participants.female]);

    useEffect(() => {
        // تحديث أولي عند تحميل المكون
        updateRoomStatesLogic({ updateParticipants: true });

        // تحديث المؤقت كل ثانية
        const timerInterval = setInterval(() => {
            updateRoomStatesLogic();
        }, 1000);

        // تحديث عدد المشاركين كل 10 ثواني
        const participantsInterval = setInterval(() => {
            updateRoomStatesLogic({ updateParticipants: true });
        }, 10000);

        return () => {
            clearInterval(timerInterval);
            clearInterval(participantsInterval);
        };
    }, [updateRoomStatesLogic]);

    const getStatusText = (status: 'open' | 'closed' | 'soon') => {
        switch (status) {
            case 'open': return 'مفتوحة حالياً';
            case 'closed': return 'مغلقة حالياً';
            case 'soon': return 'قريباً';
            default: return '';
        }
    };

    const getButtonClass = (status: 'open' | 'closed' | 'soon') => {
        switch (status) {
            case 'open': return 'available';
            case 'closed': return 'unavailable';
            case 'soon': return 'soon';
            default: return '';
        }
    };

    const getButtonText = (status: 'open' | 'closed' | 'soon') => {
        switch (status) {
            case 'open': return 'انضم إلى الجلسة';
            case 'closed': return 'مغلقة حالياً';
            case 'soon': return 'انتظار الجلسة القادمة';
            default: return '';
        }
    };

    // نوع المستخدم (ذكر/أنثى)
    const [gender, setGender] = useState<'male' | 'female' | null>(null);
    // هل المستخدم داخل غرفة الشات
    const [inRoom, setInRoom] = useState<null | 'male' | 'female'>(null);
    // رسائل الشات
    const [messages, setMessages] = useState<any[]>([]);
    // نص الرسالة الجديدة
    const [newMessage, setNewMessage] = useState('');
    // إظهار/إخفاء الإيموجي بيكر
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // عند اختيار إيموجي
    const handleEmojiClick = (emojiData: any) => {
        setNewMessage((prev) => prev + (emojiData.emoji || ''));
        setShowEmojiPicker(false);
    };
    // تحميل
    const [loading, setLoading] = useState(false);
    // خطأ
    const [error, setError] = useState('');

    // جلب نوع المستخدم من قاعدة البيانات
    useEffect(() => {
        async function fetchGender() {
            if (!username) return;
            setLoading(true);
            setError('');
            try {
                const userRef = doc(db, 'users', username);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setGender(userSnap.data().gender);
                } else {
                    setError('لم يتم العثور على بيانات المستخدم.');
                }
            } catch (e) {
                setError('حدث خطأ أثناء جلب بيانات المستخدم.');
            }
            setLoading(false);
        }
        fetchGender();
    }, [username]);

    // جلب رسائل اليوم عند الدخول للغرفة مع مستمع real-time
    const enterRoom = async (roomType: 'male' | 'female') => {
        setError('');
        if (!gender) {
            setError('لم يتم تحديد نوع المستخدم.');
            return;
        }
        if (gender !== roomType) {
            setError('غير مسموح لك بدخول غرفة الجنس الآخر.');
            return;
        }
        setInRoom(roomType);
        setLoading(true);
        try {
            // أضف المستخدم لقائمة النشطين
            if (username) await addActiveUser(roomType, username);
            // حذف رسائل الأيام السابقة (مرة واحدة فقط عند أول دخول في اليوم)
            await deleteOldMessages(roomType);
            // لا داعي لجلب الرسائل يدويًا هنا، onSnapshot سيقوم بذلك
            // تحديث عدد المشاركين فورًا
            updateRoomStatesLogic({ updateParticipants: true });
        } catch {
            setError('تعذر تحميل الرسائل.');
        }
        setLoading(false);
    };

    // مستمع real-time للرسائل
    useEffect(() => {
        if (!inRoom) return;
        // تحديد تاريخ اليوم
        const today = new Date();
        today.setHours(0,0,0,0);
        const startOfDay = today.getTime();
        const endOfDay = startOfDay + 24*60*60*1000;
        // إعداد الاستعلام
       const q = query(
    collection(db, 'chatMessages'),
    where('room', '==', inRoom),
    where('timestamp', '>=', new Timestamp(startOfDay / 1000, 0)),
    where('timestamp', '<', new Timestamp(endOfDay / 1000, 0)),
    orderBy('timestamp', 'asc')
);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => doc.data());
            setMessages(msgs);
        });
        return () => unsubscribe();
    }, [inRoom]);

    // إرسال رسالة
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        if (!inRoom || !username) return;
        setLoading(true);
        setError('');
        try {
            await addChatMessage(inRoom, username, newMessage);
            setNewMessage('');
            // لا داعي لجلب الرسائل يدويًا هنا، onSnapshot سيقوم بذلك
            // تحديث آخر نشاط للمستخدم
            await addActiveUser(inRoom, username);
            // تحديث عدد المشاركين
            updateRoomStatesLogic({ updateParticipants: true });
        } catch {
            setError('تعذر إرسال الرسالة.');
        }
        setLoading(false);
    };
    // تحديث نشاط المستخدم كل 15 ثانية أثناء وجوده في الغرفة، وحذفه عند الخروج
    useEffect(() => {
        if (!inRoom || !username) return;
        let active = true;
        const updateActive = async () => {
            if (active) await addActiveUser(inRoom, username);
        };
        // حدث النشاط فور الدخول
        updateActive();
        // حدث النشاط كل 15 ثانية
        const interval = setInterval(updateActive, 15000);
        // عند إغلاق الصفحة أو الخروج من الغرفة
        const handle = async () => {
            active = false;
            await removeActiveUser(inRoom, username);
            updateRoomStatesLogic({ updateParticipants: true });
        };
        const onUnload = () => { handle(); };
        window.addEventListener('beforeunload', onUnload);
        return () => {
            handle();
            window.removeEventListener('beforeunload', onUnload);
            clearInterval(interval);
        };
    }, [inRoom, username, updateRoomStatesLogic]);


    // تم حذف userError لأنه غير مستخدم
    useEffect(() => {
        let storedUsername = '';
        if (typeof window !== 'undefined') {
            storedUsername = localStorage.getItem('anfask-username') || '';
        }
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

    // يمكن لاحقًا استخدام بيانات المستخدم في الدردشة

    return (
        <>
            <div className="chat-container">
                <div className="chat-header">
                    <h1 className="chat-title">غرف الدردشة الجماعية</h1>
                    <p className="chat-subtitle">تواصل مع أشخاص يشاركونك نفس الرحلة</p>
                </div>
                {error && <div style={{color:'red',textAlign:'center',marginBottom:'1rem'}}>{error}</div>}
                {!inRoom ? (
                    <div className="chat-rooms-grid">
                        <div className="chat-room-card male-room">
                            <div className="chat-room-header">
                                <div className="chat-room-icon">👨‍💼</div>
                                <h2 className="chat-room-title">غرفة الرجال</h2>
                            </div>
                            <div className="chat-room-status">
                                <div className={`status-indicator status-${maleRoomState.status}`}></div>
                                <span>{getStatusText(maleRoomState.status)}</span>
                            </div>
                            <div className="participants-count">
                                <span>المشاركون النشطون: {maleRoomState.participants}</span>
                            </div>
                            <div className="countdown-timer">
                                <div>الجلسة القادمة خلال:</div>
                                <div className="timer-display">{maleRoomState.nextSessionTime}</div>
                            </div>
                            <div className="chat-schedule">
                                <div className="schedule-title">مواعيد الجلسات:</div>
                                <div className="schedule-times">
                                    <span className="schedule-time">12:00 ظهراً</span>
                                    <span className="schedule-time">4:00 مساءً</span>
                                    <span className="schedule-time">8:00 مساءً</span>
                                </div>
                            </div>
                            <button 
                                className={`join-button ${getButtonClass(maleRoomState.status)}`}
                                onClick={() => enterRoom('male')}
                                disabled={maleRoomState.status === 'closed' || gender === 'female'}
                            >
                                {getButtonText(maleRoomState.status)}
                            </button>
                        </div>
                        <div className="chat-room-card female-room">
                            <div className="chat-room-header">
                                <div className="chat-room-icon">👩‍💼</div>
                                <h2 className="chat-room-title">غرفة السيدات</h2>
                            </div>
                            <div className="chat-room-status">
                                <div className={`status-indicator status-${femaleRoomState.status}`}></div>
                                <span>{getStatusText(femaleRoomState.status)}</span>
                            </div>
                            <div className="participants-count">
                                <span>المشاركات النشطات: {femaleRoomState.participants}</span>
                            </div>
                            <div className="countdown-timer">
                                <div>الجلسة القادمة خلال:</div>
                                <div className="timer-display">{femaleRoomState.nextSessionTime}</div>
                            </div>
                            <div className="chat-schedule">
                                <div className="schedule-title">مواعيد الجلسات:</div>
                                <div className="schedule-times">
                                    <span className="schedule-time">12:00 ظهراً</span>
                                    <span className="schedule-time">4:00 مساءً</span>
                                    <span className="schedule-time">8:00 مساءً</span>
                                </div>
                            </div>
                            <button 
                                className={`join-button ${getButtonClass(femaleRoomState.status)}`}
                                onClick={() => enterRoom('female')}
                                disabled={femaleRoomState.status === 'closed' || gender === 'male'}
                            >
                                {getButtonText(femaleRoomState.status)}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{maxWidth:600,margin:'2rem auto',background:'#232a3b',borderRadius:12,padding:'2rem',boxShadow:'0 4px 24px #0004'}}>
                        <h2 style={{textAlign:'center',marginBottom:'1rem',color:'#fff'}}>الدردشة الجماعية ({inRoom==='male'?'الرجال':'السيدات'})</h2>
                        <button style={{float:'left',marginBottom:'1rem',background:'#667eea',color:'#fff',border:'none',borderRadius:8,padding:'0.5rem 1.2rem',fontWeight:600}} onClick={()=>setInRoom(null)}>خروج</button>
                        <div className="chat-messages" style={{clear:'both',height:300,overflowY:'auto',border:'1px solid #444',borderRadius:8,padding:'1rem',marginBottom:'1rem',backgroundColor:'#fdfeffff'}}>
                            {messages.length === 0 ? (
                                <p style={{color:'#aaa',textAlign:'center'}}>لا توجد رسائل بعد.</p>
                            ) : (
                                messages.map((msg, index) => (
                                    <div key={index} className="chat-message" style={{marginBottom:'0.5rem',padding:'0.5rem',borderRadius:'4px',backgroundColor:'#fdfeffff',color:'#2a3142'}}>
                                        <strong style={{color:'#88b04b'}}>{msg.username}:</strong> {msg.text}
                                        <span style={{fontSize:'0.75em',color:'#888',float:'right'}}>{msg.timestamp?.toDate().toLocaleTimeString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <form onSubmit={handleSend} style={{display:'flex',gap:'0.5rem',alignItems:'center',position:'relative'}}>
                            <button type="button" onClick={() => setShowEmojiPicker((v) => !v)} style={{background:'none',border:'none',fontSize:'1.7rem',cursor:'pointer',marginRight:4}} title="إضافة إيموجي">😊</button>
                            {showEmojiPicker && (
                                <div style={{position:'absolute',bottom:'3.5rem',right:0,zIndex:10}}>
                                    <EmojiPicker onEmojiClick={handleEmojiClick} autoFocusSearch={false} />
                                </div>
                            )}
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="اكتب رسالتك.."
                                style={{flexGrow:1,padding:'0.75rem',borderRadius:'8px',border:'1px solid #444',backgroundColor:'#1a1f2c',color:'#fff'}}
                            />
                            <button type="submit" disabled={loading} style={{background:'#667eea',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 1.5rem',fontWeight:600,cursor:'pointer'}}>
                                {loading ? 'إرسال...' : 'إرسال'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </>
    );
};

export default ChatPage;


