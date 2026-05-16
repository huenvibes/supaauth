import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function History() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setHistory(data);
    }

    if (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Earning History
      </h1>

      <div className="bg-white p-6 rounded-xl shadow">
        {history.map((item, index) => (
          <div
            key={index}
            className="flex justify-between mb-4 border-b pb-2"
          >
            <span>{item.type}</span>

            <span
              className={
                item.amount > 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }
            >
              {item.amount > 0 ? '+' : ''}
              ${item.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}