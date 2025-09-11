'use client';

import NProgress from 'nprogress';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const ProgressBar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.start();
    // This effect runs when pathname or searchParams change (i.e., route change starts)
  }, [pathname, searchParams]);

  useEffect(() => {
    // This effect runs after the component has rendered (i.e., new page content is likely loaded)
    NProgress.done();
  }); // No dependencies, so it runs on every render

  return null; // This component doesn't render anything visible itself
};

export default ProgressBar;