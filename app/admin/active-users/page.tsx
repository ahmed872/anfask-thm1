// صفحة فحص النشطين في Firestore
'use client';
import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const ActiveUsersDebug = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchActive() {
      setLoading(true);
      setError('');
      try {
        const col = collection(db, 'activeUsers');
        const snap = await getDocs(col);
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        setError('تعذر جلب البيانات من Firestore.');
      }
      setLoading(false);
    }
    fetchActive();
  }, []);

  return (
    <div style={{maxWidth:600,margin:'2rem auto',background:'#fff',borderRadius:12,padding:'2rem',boxShadow:'0 4px 24px #0001'}}>
      <h2 style={{textAlign:'center'}}>Active Users (Firestore)</h2>
      {loading && <div>...جاري التحميل</div>}
      {error && <div style={{color:'red'}}>{error}</div>}
      <pre style={{textAlign:'left',direction:'ltr',background:'#f9f9f9',padding:'1rem',borderRadius:8}}>{JSON.stringify(users, null, 2)}</pre>
      <div style={{color:'#888',fontSize:13}}>إذا ظهرت بيانات هنا، فالنشطين يعملون والكود سليم. إذا لم تظهر بيانات أو ظهر خطأ، هناك مشكلة في الصلاحيات أو الكود.</div>
    </div>
  );
};

export default ActiveUsersDebug;
