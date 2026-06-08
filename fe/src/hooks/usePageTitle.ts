import { useEffect } from 'react';

const BASE_TITLE = 'Antigravity Social';

/**
 * Sets the document title for the current page.
 * @param title - Page-specific title. Pass empty string to show just the base title.
 */
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
