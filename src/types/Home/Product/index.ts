import { StaticImageData } from 'next/image';

export type Product = {
  en_name: string;
  id: number;
  image: { link: string; title: string };
  name: string;
  price: number;
  special_from_date: null | string;
  special_price: number | string;
  special_to_date: null;
  total: number;
  images: { full_path: string; title: string; content: { path: string } }[] | StaticImageData[];
  link: string;
  description?: string;
  is_in_stock?: number;
  average_rating?: number;
  review_count?: number;
  reviews?: {
    rating?: number;
    user_name?: string;
    content?: string;
    created_at?: string;
  }[];
};
export type Comment = {
  id: string;
  title: string;
  content: string;
  likes_qty: number | null;
  dislikes_qty: number | null;
  user_id: number;
  user_name: string;
  vote: number;
  anonymous: number;
  status: number;
  product_id: number;
  created_at: string;
  updated_at: string;
  likes_count: number;
  dislikes_count: number;
  likes: number[];
  dislikes: number[];
  strengths?: { value: string }[];
  weakness?: { value: string }[];
  label?: string;
  user_value?: string;
  value?: string;
};

export type Like = {
  id: string;
  user_id: number;
  likeable_id: string;
  likeable_type: string;
  created_at: string;
  updated_at: string;
};

export type Answer = {
  id: string;
  answer: string;
  likes: Like[];
  dislikes: Like[];
  user_id: number | null;
  user_name: string;
  status: number;
  question_id: string;
  created_at: string;
  updated_at: string;
};

export type Question = {
  id: string;
  question: string;
  status: number;
  user_name: string;
  user_id: number;
  product_id: number;
  created_at: string;
  updated_at: string;
  likes_count: number;
  dislikes_count: number;
  likes: string[];
  dislikes: string[];
  answers: Answer[];
};

export interface Order {
  base_discount_total: string;
  base_grand_total: string;
  base_sub_total: string;
  base_tax_total: string;
  created_at: string;
  discount_amount: string;
  id: number;
  image: string;
  increment_id: number;
  items_count: number;
  payment_method_title: string;
  shipment: number;
  shipping_method_amount: string;
  shipping_method_title: string;
  status: string;
  transaction_id: string;
  name: string;
  qty: number;
  price: string;
  row_total: string;
}
