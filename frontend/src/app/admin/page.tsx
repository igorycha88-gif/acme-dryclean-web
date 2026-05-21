import Link from "next/link";
import AdminLayout from "@/lib/components/AdminLayout";
import { ShoppingBag, MessageSquare, Star, ImageIcon } from "lucide-react";

async function getStats() {
  const baseUrl = process.env.NEXT_PUBLIC_CONTENT_API_URL || "http://localhost:8011";
  
  try {
    const [servicesRes, faqRes, reviewsRes, mediaRes] = await Promise.all([
      fetch(`${baseUrl}/api/v1/content/services?per_page=1`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/v1/content/faq?per_page=1`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/v1/content/reviews?per_page=1`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/v1/content/media?per_page=1`, { cache: "no-store" }),
    ]);

    const servicesData = await servicesRes.json();
    const faqData = await faqRes.json();
    const reviewsData = await reviewsRes.json();
    const mediaData = await mediaRes.json();

    return {
      services: servicesData.total || 0,
      faq: faqData.total || 0,
      reviews: reviewsData.total || 0,
      media: mediaData.total || 0,
    };
  } catch {
    return { services: 0, faq: 0, reviews: 0, media: 0 };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { label: "Услуг", value: stats.services, icon: ShoppingBag, color: "bg-blue-500" },
    { label: "FAQ", value: stats.faq, icon: MessageSquare, color: "bg-green-500" },
    { label: "Отзывов", value: stats.reviews, icon: Star, color: "bg-yellow-500" },
    { label: "Медиафайлов", value: stats.media, icon: ImageIcon, color: "bg-purple-500" },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold mb-2">Дашборд</h1>
        <p className="text-gray-500 mb-8">Управление контентом сайта</p>

        <div className="grid grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-3xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="text-white" size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="font-semibold mb-4">Быстрые действия</h2>
          <div className="flex gap-4">
            <Link
              href="/admin/services/new"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Добавить услугу
            </Link>
            <Link
              href="/admin/faq/new"
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Добавить FAQ
            </Link>
            <Link
              href="/admin/reviews/new"
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Добавить отзыв
            </Link>
            <Link
              href="/admin/media"
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Загрузить файл
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}