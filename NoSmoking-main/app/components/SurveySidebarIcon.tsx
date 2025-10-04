"use client";
import React from 'react';

interface SurveySidebarIconProps {
  isVisible: boolean;
  onClick: () => void;
  surveyType: 'day14' | 'day30';
}

const SurveySidebarIcon: React.FC<SurveySidebarIconProps> = ({
  isVisible,
  onClick,
  surveyType
}) => {
  if (!isVisible) return null;

  const title = surveyType === 'day14' ? 'استبيان الأسبوعين' : 'استبيان الشهر';

  return (
    <div className="survey-sidebar-icon" onClick={onClick}>
      <div className="icon-content">
        <div className="icon-emoji">📝</div>
        <div className="icon-text">{title}</div>
        <div className="pulse-ring"></div>
      </div>

      <style jsx>{`
        .survey-sidebar-icon {
          position: fixed;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 999;
          cursor: pointer;
          animation: slideInRight 0.5s ease-out;
        }

        @keyframes slideInRight {
          from {
            right: -100px;
            opacity: 0;
          }
          to {
            right: 20px;
            opacity: 1;
          }
        }

        .icon-content {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
          color: white;
          padding: 15px;
          border-radius: 50px 15px 15px 50px;
          box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 200px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .icon-content:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 35px rgba(255, 107, 107, 0.5);
        }

        .icon-emoji {
          font-size: 1.8rem;
          animation: bounce 2s infinite;
        }

        .icon-text {
          font-weight: bold;
          font-size: 1rem;
          white-space: nowrap;
        }

        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 15px;
          transform: translateY(-50%);
          width: 30px;
          height: 30px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
          60% {
            transform: translateY(-4px);
          }
        }

        @keyframes pulse {
          0% {
            transform: translateY(-50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-50%) scale(2);
            opacity: 0;
          }
        }

        @media (max-width: 768px) {
          .survey-sidebar-icon {
            right: 10px;
            top: auto;
            bottom: 80px;
            transform: none;
          }

          .icon-content {
            min-width: 150px;
            padding: 12px;
            border-radius: 25px;
          }

          .icon-text {
            font-size: 0.9rem;
          }

          .icon-emoji {
            font-size: 1.5rem;
          }

          .pulse-ring {
            width: 25px;
            height: 25px;
            left: 12px;
          }
        }

        @media (max-width: 480px) {
          .icon-content {
            min-width: 120px;
            padding: 10px;
          }

          .icon-text {
            font-size: 0.8rem;
          }

          .icon-emoji {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SurveySidebarIcon;