"use client";

import { useState, useEffect, useRef } from "react";
import { contentApi, Media, MediaListResponse } from "@/lib/api";
import { Upload, Trash2, Copy, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

export default function MediaPage() {
  const [data, setData] = useState<MediaListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [page]);

  async function loadData() {
    setLoading(true);
    const result = await contentApi.media.list(page, 20);
    setData(result);
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await contentApi.media.upload(file);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Вы уверены, что хотите удалить файл?")) return;
    await contentApi.media.delete(id);
    loadData();
  }

  function copyUrl(url: string) {
    const fullUrl = `${process.env.NEXT_PUBLIC_CONTENT_API_URL || "http://localhost:8011"}${url}`;
    navigator.clipboard.writeText(fullUrl);
    alert("URL скопирован в буфер обмена!");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Медиафайлы</h1>
          <p className="text-gray-500">Загрузка и управление изображениями</p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            <Upload size={20} />
            {uploading ? "Загрузка..." : "Загрузить файл"}
          </button>
        </div>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 mb-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
      >
        <Upload className="mx-auto text-gray-400 mb-2" size={40} />
        <p className="text-gray-500">Перетащите файл сюда или нажмите для выбора</p>
        <p className="text-sm text-gray-400 mt-1">JPG, PNG, GIF, WebP до 10 МБ</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : data?.items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Файлы не найдены</div>
        ) : (
          <div className="grid grid-cols-4 gap-4 p-6">
            {data?.items.map((media) => (
              <div key={media.id} className="group relative border border-gray-100 rounded-lg overflow-hidden">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {media.mime_type.startsWith("image/") ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_CONTENT_API_URL || "http://localhost:8011"}${media.url}`}
                      alt={media.alt_text || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="text-gray-400" size={40} />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-500 truncate">{media.original_name}</p>
                  <p className="text-xs text-gray-400">{(media.size / 1024).toFixed(1)} КБ</p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => copyUrl(media.url)}
                    className="p-1.5 bg-white rounded-lg shadow hover:bg-gray-50"
                    title="Копировать URL"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(media.id)}
                    className="p-1.5 bg-white rounded-lg shadow hover:bg-red-50 text-red-500"
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.total > 20 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-50">
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 text-sm text-gray-500">Страница {page} из {Math.ceil(data.total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(data.total / 20)} className="p-2 rounded-lg border border-gray-200 disabled:opacity-50">
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}