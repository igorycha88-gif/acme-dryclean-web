"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { contentApi, ReviewListResponse } from "@/lib/api";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, ToggleLeft, Star } from "lucide-react";

export default function ReviewsPage() {
  const [data, setData] = useState<ReviewListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await contentApi.reviews.list(page, 20, search || undefined);
    setData(result);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Вы уверены, что хотите удалить отзыв?")) return;
    await contentApi.reviews.delete(id);
    loadData();
  }

  async function handleToggle(id: string) {
    await contentApi.reviews.toggle(id);
    loadData();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Отзывы</h1>
          <p className="text-gray-500">Управление отзывами клиентов</p>
        </div>
        <Link href="/admin/reviews/new" className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:opacity-90">
          <Plus size={20} />Добавить отзыв
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Поиск по автору..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <button type="submit" className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Поиск</button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : data?.items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Отзывы не найдены</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Автор</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Услуга</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Рейтинг</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Отзыв</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Статус</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.items.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{review.author}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{review.service}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{review.text}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${review.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {review.is_active ? "Опубликован" : "Скрыт"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleToggle(review.id)} className="p-2 text-gray-400 hover:text-yellow-500 rounded-lg hover:bg-gray-100" title="Переключить статус">
                        <ToggleLeft size={18} />
                      </button>
                      <Link href={`/admin/reviews/${review.id}`} className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"><Pencil size={18} /></Link>
                      <button onClick={() => handleDelete(review.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.total > 20 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"><ChevronLeft size={20} /></button>
          <span className="px-4 text-sm text-gray-500">Страница {page} из {Math.ceil(data.total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(data.total / 20)} className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"><ChevronRight size={20} /></button>
        </div>
      )}
    </div>
  );
}