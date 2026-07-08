export type HomePageItem =
  | (BaseHomePage & {
      type: 'banner';
      images: BannerItem[];
    })
  | (BaseHomePage & {
      type: 'slider' | 'sliderproduct';
      images: Image[];
    })
  | (BaseHomePage & {
      type: 'static_html' | 'vitrin' | 'div' | 'megashop' | 'block' | 'story';
      images?: Image[] | BannerItem[];
    });

export type HomePage = HomePageItem[];

type BaseHomePage = {
  grid: '3-rtl' | '3-ltr' | '3' | '2';
  descrption?: string;
  content: {
    static_html: string;
  };
  children: HomePageItem[];
  items: {
    product: Product;
    image: Image;
  }[];
  pager_control: null | number;
  pager_speed: null | number;
  category_id: number;
  color: string;
  has_banner: boolean;
  title: string;
  auto_slide: number;
  vitrin_type: number;
  banner: {
    link: string;
  };
  products: Product[];
  id: string;
  seo: {
    json: string;
  };
  page: { type: string; id: number }[];
};

export interface Image {
  content: {
    sort_order: number;
    path: string;
    link: string;
  };
  link: string;
  redirect: string;
  title: string;
}

export interface BannerItem {
  id: number;
  content: {
    link: string;
    alt: string | null;
    path: string;
    row: number;
  };
  full_path: string;
  name: string;
  directory: string;
  item_id: number;
  type: string;
  row: number;
  created_at: string;
  updated_at: string;
}

export type Comment = {
  vote: number;
  like_users: number[];
  dislike_users: number[];
  strengths: { value: string }[];
  weakness: { value: string }[];
  content: string;
  created_at: string;
  dislikes: number;
  id: string;
  likes: number;
  product_id: number;
  status: number;
  title: string;
  updated_at: string;
  user_id: number;
  user_name: string;
  label: string;
  user_value: string;
  value: string;
};

export type Question = {
  answers: Question[];
  like_users: number[];
  dislike_users: number[];
  created_at: string;
  id: number;
  product_id: number;
  answer: string;
  question: string;
  status: number;
  updated_at: string;
  user_id: number;
  user_name: string;
  dislikes: number;
  likes: number;
};

export type Product = {
  base_grand_total: number;
  brand: {
    title: string;
    logo: string;
  };
  updated_at?: string;
  warranty: string;
  available_order_qty: number;
  row_total: string;
  qty: number;
  discount_amount: number;
  seo: {
    breadcrumbs: {
      name: string;
      url: string | null;
    }[];
  };
  comment: Comment[];
  attribute_name?: string;
  thumbnail?: string;
  product_name?: string;
  created_at: string;
  product_price?: string;
  base_sub_total?: number;
  increment_id?: number;
  shipping_method_title?: string;
  attributes: {
    title: string;
    value: string;
  }[];
  description: string;
  questions?: [];
  comments?: [];
  votes?: { label: string; value: number }[];
  id?: number;
  image: {
    link: string;
  };
  title?: string;
  name: string;
  price:
    | {
        old_price: number;
        price: number;
      }
    | number;
  special_from_date?: string | null;
  special_price: number;
  special_to_date?: string | null;
  images?: { content: { path: string; ttile: string } }[];
  short_description: string;
  is_in_stock?: 0 | 1;
  en_name: string;
  short_attributes: {
    title: string;
    value: string;
  }[];
  related: Product[];
  tags?: {
    id: number;
    name: string;
    slug?: string;
    content?: string;
    seo_title?: string | null;
    seo_description?: string | null;
    seo_keywords?: string | null;
    has_index?: boolean;
  }[];
};

export type Category = {
  link: string;
  status?: boolean;
  children: Category[];
  sub_category: Category[];
  position: null;
  title: string;
  name: string;
  is_parent: boolean;
  url: string;
  id: number;
};

export type FilterCategory = {
  banner: {
    images: {
      content: {
        link: string;
        path: string;
      };
    }[];
  };
  slider: {
    images: {
      content: {
        link: string;
        path: string;
      };
    }[];
  };
  total: number;
  brands: { id: string; title: string }[];
  maxProductPrice: number;
  minProductPrice: number;
  description: string;
  products: Product[];
  seo: {
    breadcrumbs: {
      '@type'?: 'ListItem';
      name: string;
      link?: string;
      url?: string;
      position?: number;
    }[];
  };
  sortable: {
    id: string;
    title: string;
  }[];
  attributes: {
    title: string;
    options: {
      attribute_id: number;
      image: string;
      color: string;
      _id: string;
      value: string;
      url: string;
    }[];
  }[];
  name: string;
  breadcrumb: {
    url: string;
    title: string;
    id: string;
    order: number;
  }[];
  children: {
    _id: string;
    title: string;
    url: string;
    thumbnailimage: {
      url: string;
    };
    properties: [];
    keyWords: [];
    createdAt: string;
    updatedAt: string;
    depth: 1;
  }[];
  tags?: {
    id: number;
    name: string;
    slug?: string;
    content?: string;
    seo_title?: string | null;
    seo_description?: string | null;
    seo_keywords?: string | null;
    has_index?: boolean;
    created_at?: string;
    updated_at?: string;
    pivot?: {
      taggable_type: string;
      taggable_id: number;
      tag_id: number;
      created_at: string;
      updated_at: string;
    };
  }[];
} | null;

export type Address = {
  slug: string;
  city: string;
  city_id: number;
  id: number;
  is_default: number;
  mobile: string;
  name: string;
  post_code: string;
  region: string;
  region_id: number;
  street: string;
  telephone: string;
  user_id: number;
};

export type TypeOrderDetail = {
  address: Address & {
    address: string;
  };
  items: Product[];
  states: States;
  order: Order;
  orders: Order[];
  customer?: Array<{
    id: number;
    first_name: string;
    last_name: string;
    mobile: string;
    telephone?: string | null;
    gender?: string | null;
    national_code?: string | null;
    email?: string | null;
    created_at: string;
    updated_at: string;
    pivot?: {
      order_id: number;
      customer_id: number;
    };
  }>;
};

export interface ProductDetail {
  discount_amount: string;
  id: number;
  image: string;
  name: string;
  price: string;
  product_id: number;
  qty: number;
  row_total: string;
  supply_status: number;
  tax_amount: string;
}

export type StateItem = {
  id: number;
  code: string;
  title: string;
  status_id: number;
  created_at: string;
  updated_at: string;
};

export type States = StateItem[];

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
  state_title?: string;
  transaction_id: string;
  name: string;
  qty: number;
  price: string;
  row_total: string;
}
