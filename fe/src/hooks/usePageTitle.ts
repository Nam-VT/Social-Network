import { useEffect } from 'react';

const BASE_TITLE = 'Connectify';

export const usePageTitle = (title?: string) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} | ${BASE_TITLE}`;
    } else {
      document.title = BASE_TITLE;
    }
    // Reset to base title when component unmounts
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
};
