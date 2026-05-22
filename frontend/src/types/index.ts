export interface Service {
  id: number;
  title: string;
  slug: string;
  description: string;
  image: string;
}

export interface Review {
  id: number;
  author: string;
  service: string;
  rating: number;
  text: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface OrderFormData {
  name: string;
  phone: string;
  serviceType: string;
}

export interface B2BCategory {
  title: string;
  slug: string;
}
