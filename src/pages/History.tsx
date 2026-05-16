import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Transaction = {
  id: string;
  title: string;
  type: string;
  amount: number;
  created_at: string;
};

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const PAGE_SIZE = 10;

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const visibleTransactions = useMemo(() => transactions, [transactions]);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);

      const from = 0;
      const to = page * PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("transactions")
        .select("id, title, type, amount, created_at")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (!error && data) {
        setTransactions(data as Transaction[]);
        setHasMore(data.length === page * PAGE_SIZE);
      }

      setLoading(false);
    };

    fetchTransactions();
  }, [page]);

  useEffect(() => {
    const channel = supabase
      .channel("public:transactions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        (payload) => {
          const newRow = payload.new as Transaction;
          setTransactions((prev) => [newRow, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Transaction History</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Review earnings, withdrawals, bonuses, and referrals.
                </p>
              </div>
            </div>

            <div className="inline-flex rounded-full bg-slate-100 p-1">
              <button className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm">
                History
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading && transactions.length === 0 ? (
              <div className="grid gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-4">
                {visibleTransactions.map((tx) => {
                  const isPositive = tx.amount >= 0;

                  return (
                    <div
                      key={tx.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:p-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-slate-900">
                            {tx.title}
                          </h3>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {tx.type}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {new Date(tx.created_at).toLocaleDateString("en-SG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div className={`text-lg font-semibold ${isPositive ? "text-emerald-600" : "text-rose-500"}`}>
                        {isPositive ? "+" : ""}
                        {tx.amount.toFixed(2)}
                      </div>
                    </div>
                  );
                })}

                {!loading && !hasMore && (
                  <div className="py-4 text-center text-sm font-medium text-slate-400">
                    No More Entries
                  </div>
                )}

                {hasMore && (
                  <div className="pt-2">
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}