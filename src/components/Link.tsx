import React from 'react';
import NextLink from 'next/link';
import LoadingIndicator from './common/LoadingIndicator';

interface LinkProps {
  href: string;
  children: React.ReactNode;
  prefetch?: boolean;
  target?: '_blank' | '_self' | '_parent' | '_top';
  className?: string;
  onClick?: () => void;
}

const Link: React.FC<LinkProps> = ({
  href,
  children,
  prefetch = false,
  target = '_self',
  className = '',
  onClick,
}) => {
  return (
    <NextLink
      href={href}
      prefetch={prefetch}
      target={target}
      className={className}
      onClick={onClick}
    >
      {children}
      <LoadingIndicator />
    </NextLink>
  );
};

export default Link;
