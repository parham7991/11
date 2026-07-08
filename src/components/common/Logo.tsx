import Link from 'next/link';
import React from 'react';
import LogoImage from '@/../public/images/logo-off-3.png';
import Image from 'next/image';

const Logo = ({ className }: { className?: string }) => {
  return (
    <>
      <Link prefetch={false} href="/">
        <Image className={className} src={LogoImage} alt="آفلند" />
      </Link>
    </>
  );
};

export default Logo;
