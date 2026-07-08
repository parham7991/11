'use client';
import React, { ReactNode } from 'react';
import { InView as InViewReact } from 'react-intersection-observer';
type Props = {
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  children: ReactNode;
  threshold?: number;
  setInview?: React.Dispatch<React.SetStateAction<boolean>>;
};
const InView = ({ children, setIsLoading, threshold, setInview }: Props) => {
  const onChange = (inView: boolean) => {
    if (setInview) {
      setInview(inView);
    }
    if (inView && setIsLoading) {
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    }
  };
  return (
    <>
      <InViewReact key={120} threshold={threshold} triggerOnce onChange={onChange}>
        {({ ref, inView }) => (
          <div className="h-full overflow-hidden" ref={ref}>
            {inView ? children : null}
          </div>
        )}
      </InViewReact>
    </>
  );
};

export default InView;
