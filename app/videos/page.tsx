// app/videos/page.tsx
// تأكد من إضافة 'use client'; في أول سطر
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { addVideoComment, getAllVideoComments, VideoComment } from '../../lib/videoComments';
// المسار الصحيح لملف الـ CSS الرئيسي (globals.css) من داخل app/videos/
import '../globals.css'; 
import './videos.css'

// --- تعريفات الأنواع (Interfaces) ---
interface Video {
    id: string;
    title: string;
    description: string;
    author: string;
    duration: string;
    thumbnail: string; // URL to thumbnail image
    youtubeId: string; // YouTube video ID
}

interface Story {
    id: number;
    text: string;
    author: string;
    date: string;
}

const VideosPage: React.FC = () => {
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
    const [feedbackName, setFeedbackName] = useState<string>('');
    const [feedbackEmail, setFeedbackEmail] = useState<string>('');
    const [feedbackMessage, setFeedbackMessage] = useState<string>('');

    const videos: Video[] = [
        { id: 'video1', title: 'قصة خطاف في ترك التدخين', description: 'قصة ملهمة عن الإقلاع عن التدخين.', author: 'عش بصحة', duration: '2:58', thumbnail: '/khotaf.jpg', youtubeId: '3nJYLExM3NQ' },
        { id: 'video2', title: 'علاء ابراهيم، بعد سنة من الإقلاع عن التدخين 🚭 كيف أثر هذا القرار على حياته؟', description: 'تجربة علاء إبراهيم بعد سنة من الإقلاع عن التدخين.', author: 'MakkahHC', duration: '2:17', thumbnail: '/alaa.jpg', youtubeId: 'uTzUxy_-yxs' },
        { id: 'video3', title: 'أزمة مخلف مع التدخين .. انتهت !', description: 'قصة انتهاء أزمة مخلف مع التدخين.', author: 'عش بصحة', duration: '3:06', thumbnail: '/mokhlef.jpg', youtubeId: '2ZTi6CQKJnw' },
        { id: 'video4', title: 'تجربتي مع الأقلاع عن التدخين بعد ٢٦ سنه تدخين ( نصيحتي حتي لاتعاني)', description: 'نصائح قيمة من تجربة شخصية للإقلاع عن التدخين بعد 26 عاماً.', author: 'قناة الحكيم', duration: '10:26', thumbnail: '/tadkheen.jpg', youtubeId: 'xq4_EbLO9rw' },
        { id: 'video5', title: 'الدحيح | التدخين', description: 'تحليل الدحيح لموضوع التدخين.', author: 'Museum of The Future متحف المستقبل', duration: '26:53', thumbnail: '/da7ee71.jpg', youtubeId: 'HAw90AwUL_4' },
        { id: 'video6', title: 'الدحيح - التدخين والسرطان', description: 'الدحيح يتناول العلاقة بين التدخين والسرطان.', author: 'AJ+ كبريت', duration: '18:00', thumbnail: '/da7ee72.jpg', youtubeId: '8ONyl5wXyVY' },
    ];

    // تعليقات المستخدمين (من فايربيز)
    const [comments, setComments] = useState<VideoComment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
  useEffect(() => {
    setLoadingComments(true);
    getAllVideoComments().then((data) => {
        setComments(data);
    }).finally(() => setLoadingComments(false));
}, []);

    const openVideo = useCallback((youtubeId: string) => {
        setCurrentVideoId(youtubeId);
        setModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setModalOpen(false);
        setCurrentVideoId(null);
    }, []);

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackName || !feedbackMessage) return;
        await addVideoComment({ name: feedbackName, email: feedbackEmail, message: feedbackMessage });
        setFeedbackName('');
        setFeedbackEmail('');
        setFeedbackMessage('');
        // جلب التعليقات من جديد بعد الإضافة
        getAllVideoComments().then((data) => {
            setComments(data);
        });
    };

    return (
        <div className="videos-container">
            {/* Videos Header */}
            <div className="videos-header">
                <h1 className="videos-title">قسم الفيديوهات الملهمة</h1>
                <p className="videos-subtitle">استمع لقصص نجاح حقيقية من أشخاص تغلبوا على التدخين</p>
            </div>

            {/* Inspirational Quote */}
            <div className="quote-section">
                <div className="quote-text">
                    ابدأ رحلتك اليوم، وقد تكون قصتك هي الإلهام لشخص آخر غداً
                </div>
                <div className="quote-author">- مجتمع أنفاسك تهم</div>
            </div>

            {/* Videos Grid */}
            <div className="videos-grid">
                {videos.map(video => (
                    <div key={video.id} className="video-card" onClick={() => openVideo(video.youtubeId)}>
                        <div className="video-thumbnail">
                            {/* يمكنك استخدام صورة مصغرة حقيقية هنا بدلاً من الخلفية اللونية */}
                            {video.thumbnail && <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />}
                            <div className="play-button">▶️</div>
                        </div>
                        <div className="video-content">
                            <h3 className="video-title">{video.title}</h3>
                            <p className="video-description">{video.description}</p>
                            <div className="video-meta">
                                <span>{video.author}</span>
                                <span className="video-duration">{video.duration}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* User Feedback Section */}
            <div className="feedback-section">
                <div className="feedback-header">
                    <h2 className="feedback-title">شاركنا رأيك أو قصتك</h2>
                    <p className="feedback-subtitle">ملاحظاتك تساعدنا على التحسن، وقصتك قد تلهم الآخرين</p>
                </div>
                <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
                    <div className="form-group">
                        <label htmlFor="feedbackName" className="form-label">الاسم:</label>
                        <input 
                            type="text" 
                            id="feedbackName" 
                            className="form-input" 
                            value={feedbackName}
                            onChange={(e) => setFeedbackName(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="feedbackEmail" className="form-label">البريد الإلكتروني (اختياري):</label>
                        <input 
                            type="email" 
                            id="feedbackEmail" 
                            className="form-input" 
                            value={feedbackEmail}
                            onChange={(e) => setFeedbackEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="feedbackMessage" className="form-label">رسالتك أو قصتك:</label>
                        <textarea 
                            id="feedbackMessage" 
                            className="form-input form-textarea" 
                            value={feedbackMessage}
                            onChange={(e) => setFeedbackMessage(e.target.value)}
                            required 
                        ></textarea>
                    </div>
                    <button type="submit" className="submit-btn">إرسال</button>
                </form>
            </div>

            {/* User Comments Section */}
            <div className="stories-section">
                <h2 className="stories-title">تعليقات الزوار</h2>
                {loadingComments ? <div style={{textAlign:'center'}}>جاري التحميل...</div> : null}
                <div className="stories-carousel-wrapper">
                  <div className="stories-carousel">
                    {comments.length === 0 && !loadingComments && (
                        <div style={{textAlign:'center',width:'100%'}}>لا توجد تعليقات بعد.</div>
                    )}
                    {comments.map(comment => (
                        <div key={comment.id} className="story-card">
                            <p className="story-text">{comment.message}</p>
                            <div className="story-author">- {comment.name}</div>
                            <div className="story-date">{comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleDateString() : ''}</div>
                        </div>
                    ))}
                  </div>
                </div>
            </div>

            {/* Video Modal */}
            {modalOpen && currentVideoId && (
                <div className={`video-modal ${modalOpen ? 'active' : ''}`} onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* منع إغلاق المودال عند النقر داخل الفيديو */}
                        <button className="close-modal" onClick={closeModal}>&times;</button>
                        <div className="modal-video">
                            {/* يمكنك تضمين مشغل YouTube هنا */}
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="YouTube video player"
                            ></iframe>
                        </div>
                    </div>
                </div>
              )}
        </div>
    );
};

export default VideosPage;
