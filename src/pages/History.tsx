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
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        Transaction History
      </h1>

      <div className="bg-white rounded-2xl shadow p-6">

        {history.length === 0 ? (
          <p className="text-gray-500 text-center">
            No Transactions Found
          </p>
        ) : (
          history.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b py-4"
            >
              <div>
                <h2 className="font-semibold text-lg">
                  {item.type}
                </h2>

                <p className="text-sm text-gray-500">
                  {new Date(
                    item.created_at
                  ).toLocaleDateString()}
                </p>
              </div>

              <div
                className={`font-bold text-lg ${
                  item.amount > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {item.amount > 0 ? '+' : ''}
                ${item.amount}
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
}