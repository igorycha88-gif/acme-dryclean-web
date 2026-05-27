"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { contentApi } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";

export default function EditFAQPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [form, setForm] = useState({ question: "", answer: "", is_active: true, sort_order: 0 });

  useEffect(() => {
    async function loadFAQ() {
      const result = await contentApi.faq.get(params.id);
      if (result) {
        setForm({ question: result.question, answer: result.answer, is_active: result.is_active, sort_order: result.sort_order });
      }
      setLoadingData(false);
    }
    loadFAQ();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await contentApi.faq.update(params.id, form);
    setLoading(false);
    if (result) router.push("/admin/faq");
  }

  if (loadingData) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Загрузка...</div></div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div><h1 className="text-2xl font-bold">Редактирование FAQ</h1></div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-2">Вопрос *</label>
          <input type="text" required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Ответ *</label>
          <textarea required rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-2">Порядок сортировки</label><input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-green-500 rounded" />
          <label htmlFor="is_active" className="text-sm">Активно</label>
        </div>
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Отмена</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50"><Save size={20} />{loading ? "Сохранение..." : "Сохранить"}</button>
        </div>
      </form>
    </div>
  );
}