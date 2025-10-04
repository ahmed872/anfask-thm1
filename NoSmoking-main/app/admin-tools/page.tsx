"use client";
import React from 'react';
import DataMigrationTool from '../components/DataMigrationTool';

const AdminToolsPage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '10px' }}>
          🛠️ أدوات الصيانة
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem' }}>
          أدوات لتحديث وصيانة بيانات النظام
        </p>
      </div>

      <DataMigrationTool />

      <div style={{ 
        maxWidth: '600px', 
        margin: '20px auto', 
        textAlign: 'center' 
      }}>
        <a 
          href="/dashboard" 
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            fontSize: '1.1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ← العودة للوحة التحكم
        </a>
      </div>
    </div>
  );
};

export default AdminToolsPage;