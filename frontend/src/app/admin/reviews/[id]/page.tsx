"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { contentApi, Review } from "@/lib/api";
import { ArrowLeft, Save, Star } from "lucide-react";

export default function EditReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [form, setForm] = useState({ author: "", service: "", rating: 5, text: "", is_active: false });

  useEffect(() => {
    async function loadReview() {
      const result = await contentApi.reviews.get(params.id);
      if (result) setForm({ author: result.author, service: result.service, rating: result.rating, text: result.text, is_active: result.is_active });
      setLoadingData(false);
    }
    loadReview();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await contentApi.reviews.update(params.id, form);
    setLoading(false);
    if (result) router.push("/admin/reviews");
  }

  if (loadingData) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Загрузка...</div></div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div><h1 className="text-2xl font-bold">Редактирование отзыва</h1></div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-6 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-2">Автор *</label><input type="text" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>
          <div><label className="block text-sm font-medium mb-2">Услуга *</label><input type="text" required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        </div>
        <div><label className="block text-sm font-medium mb-2">Рейтинг *</label>
          <div className="flex gap-2">{[1, 2, 3, 4, 5].map((r) => (<button key={r} type="button" onClick={() => setForm({ ...form, rating: r })} className={`p-2 rounded-lg border ${form.rating >= r ? "border-yellow-400 bg-yellow-50" : "border-gray-200"}`}><Star size={20} className={form.rating >= r ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} /></button>))}</div>
        </div>
        <div><label className="block text-sm font-medium mb-2">Текст отзыва *</label><textarea required rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" /></div>
        <div className="flex items-center gap-3"><input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-yellow-500 rounded" /><label htmlFor="is_active" className="text-sm">Опубликовать</label></div>
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Отмена</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50"><Save size={20} />{loading ? "Сохранение..." : "Сохранить"}</button>
        </div>
      </form>
    </div>
  );
}