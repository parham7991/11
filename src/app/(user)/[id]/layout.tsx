import { pages } from '@/lib/data';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
const STATIC_FILE_REGEX = /\.(xml|json|txt|jpg|jpeg|png|svg|ico|webp)$/i;
type Props = {
  params: Promise<{ [key: string]: string }>;
  children: ReactNode;
};

const Layout = async ({ children, params }: Props) => {
  const { id } = await params;
  if (!id.startsWith('sitemap') && (pages.includes(id) || STATIC_FILE_REGEX.test(id))) {
    notFound();
  }

  return children;
};

export default Layout;
