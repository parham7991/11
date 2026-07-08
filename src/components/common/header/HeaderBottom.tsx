import { Category } from '@/types/Home';
import CategoryMenu from './CategoryMenu';
import { transformData } from '@/lib/fun';
import Link from '@/components/Link';

type Props = {
  categories: Category[];
  menus: {
    title: string;
    link?: string;
  }[];
  onCategoryMenuOpen?: () => void;
  isLoading?: boolean;
};
const HeaderBottom = ({ categories, menus, onCategoryMenuOpen, isLoading }: Props) => {
  // @ts-expect-error error
  const transformedData: Category[] = transformData(categories);
  return (
      <div className="bg-main">
      <div className="container_page relative hidden h-16 w-full items-center gap-4 lg:flex lg:px-6">
        <CategoryMenu
          categories={transformedData}
          onCategoryMenuOpen={onCategoryMenuOpen}
          isLoading={isLoading}
        />

        {menus.map((item, idx) => (
          <Link
            key={idx}
            className="group flex h-full items-center justify-center px-3 transition-all duration-500 hover:bg-blue-600"
            href={item?.link as string}
          >
            <span className="text-right font-medium text-[14px] text-white">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HeaderBottom;
