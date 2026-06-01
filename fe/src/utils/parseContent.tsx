import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Parses text and wraps #hashtags in Link components.
 */
export const parseContent = (content: string) => {
  if (!content) return null;

  // Split content by hashtag pattern (keeping the hashtags in the array)
  // This regex matches # followed by word characters or Vietnamese characters
  const parts = content.split(/(#[a-zA-Z0-9_A-ZÀ-ỹ]+)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          const tag = part.substring(1).toLowerCase();
          return (
            <Link
              key={i}
              to={`/hashtag/${tag}`}
              className="text-[var(--color-accent)] font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()} // Ngăn chặn nổi bọt nếu đặt trong PostItem có onClick
            >
              {part}
            </Link>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};
