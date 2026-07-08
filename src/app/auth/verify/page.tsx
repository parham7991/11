'use client';
import React, { Suspense } from 'react';
import Verify from './Verify';

const Page = () => {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
};

export default Page;
