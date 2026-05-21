"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { contentApi, FAQListResponse } from "@/lib/api";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function FAQPage() {
  const [data, setData] = useState<FAQListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await contentApi.faq.list(page, 20, search || undefined);
    setData(result);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Вы уверены, что хотите удалить?")) return;
    await contentApi.faq.delete(id);
    loadData();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">FAQ</h1>
          <p className="text-gray-500">Управление вопросами и ответами</p>
        </div>
        <Link
          href="/admin/faq/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:opacity-90"
        >
          <Plus size={20} />
          Добавить FAQ
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Поиск по вопросу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
          Поиск
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : data?.items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">FAQ не найдены</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data?.items.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{item.question}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          item.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.is_active ? "Активно" : "Неактивно"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{item.answer}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/admin/faq/${item.id}`}
                      className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"
                    >
                      <Pencil size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.total > 20 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 text-sm text-gray-500">
            Страница {page} из {Math.ceil(data.total / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(data.total / 20)}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}