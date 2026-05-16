import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from 'react-router-dom';

type Transaction = {
  id?: string | number | null;
  type?: string | null;
  amount?: number | string | null;
  created_at?: string | null;
};

export default function History() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const fetchTransactions = async () => {
      setLoading(true);
      setError("");

      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("id, type, amount, created_at")
          .order("created_at", { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        if (!isMounted) return;
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) return;
        setTransactions([]);
        setError(err instanceof Error ? err.message : "Failed to load transactions.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTransactions();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (dateValue?: string | null) => {
    if (!dateValue) return "Date unavailable";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount?: number | string | null) => {
    const num = typeof amount === "string" ? Number(amount) : amount;
    if (typeof num !== "number" || Number.isNaN(num)) return "0.00";
    return num.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
            <Link
  to="/"
  className="inline-flex items-center mb-4 text-sm font-medium text-blue-600 hover:underline"
>
  ← Back to Dashboard
</Link>
            <h1 className="text-2xl font-semibold tracking-tight">History</h1>
            <p className="mt-1 text-sm text-slate-500">
              Your latest rewards and withdrawal activity.
            </p>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : transactions?.length > 0 ? (
              <div className="space-y-3">
                {transactions?.map((tx, index) => {
                  const rawAmount = typeof tx?.amount === "string" ? Number(tx.amount) : tx?.amount;
                  const safeAmount = typeof rawAmount === "number" && !Number.isNaN(rawAmount) ? rawAmount : 0;
                  const isPositive = safeAmount >= 0;

                  return (
                    <div
                      key={tx?.id ?? `tx-${index}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-medium text-slate-900">
                          {tx?.type?.trim() || "Transaction"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(tx?.created_at)}
                        </p>
                      </div>

                      <div
                        className={`shrink-0 text-base font-semibold ${
                          isPositive ? "text-emerald-600" : "text-rose-500"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {formatAmount(safeAmount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No transactions found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}