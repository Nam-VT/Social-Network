import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/api/searchApi';
import { useDebounce } from '@/hooks/useDebounce'; // Assuming this exists, if not we'll create it
import '@/styles/layout/navbar.css';

export const NavbarSearch = () => {
  const [keyword, setKeyword] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedKeyword = useDebounce(keyword, 400);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: suggestions, isFetching } = useQuery({
    queryKey: ['search-suggest', debouncedKeyword],
    queryFn: () => searchApi.suggest(debouncedKeyword),
    enabled: debouncedKeyword.trim().length > 0,
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      setIsOpen(false);
      navigate(`/search?q=${encodeURIComponent(keyword.trim())}`);
    }
  };

  const handleItemClick = (type: string, id: number, text: string, subText: string) => {
    setIsOpen(false);
    if (type === 'USER') {
      navigate(`/profile/${subText.replace('@', '')}`);
    } else if (type === 'POST') {
      navigate(`/post/${id}`);
    } else if (type === 'GROUP') {
      navigate(`/groups/${id}`);
    }
  };

  return (
    <div className="navbar-search-wrapper relative" ref={dropdownRef}>
      <form onSubmit={handleSearch} className="flex items-center w-full">
        <div className="navbar-search-icon">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Tìm kiếm trên mạng xã hội..."
          className="navbar-search-input w-full"
        />
      </form>

      {isOpen && keyword.trim().length > 0 && (
        <div className="absolute top-full left-0 w-full max-w-[360px] mt-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
          {isFetching ? (
            <div className="flex items-center justify-center py-4 text-[var(--color-text-secondary)]">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : suggestions?.length ? (
            <>
              <div className="py-2 px-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Kết quả tìm kiếm cho "{keyword}"
              </div>
              <ul className="max-h-[300px] overflow-y-auto">
                {suggestions.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      onClick={() => handleItemClick(item.type, item.id, item.text, item.subText)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-bg-hover)] transition-colors text-left"
                    >
                      {item.type === 'USER' && (
                        <img
                          src={item.avatarUrl || 'https://i.pravatar.cc/150'}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-[var(--color-border-light)]"
                        />
                      )}
                      {item.type === 'GROUP' && (
                        <img
                          src={item.avatarUrl || 'https://placehold.co/150x150?text=Group'}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[var(--color-border-light)]"
                        />
                      )}
                      {item.type === 'POST' && (
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 shrink-0 flex items-center justify-center">
                          <Search size={18} />
                        </div>
                      )}
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                          {item.text}
                        </span>
                        <span className="text-xs text-[var(--color-text-secondary)] truncate">
                          {item.subText}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-[var(--color-border-light)] p-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate(`/search?q=${encodeURIComponent(keyword.trim())}`);
                  }}
                  className="w-full text-center py-2 text-sm font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] rounded-lg transition-colors"
                >
                  Xem tất cả kết quả
                </button>
              </div>
            </>
          ) : (
            <div className="py-4 text-center text-sm text-[var(--color-text-secondary)]">
              Không tìm thấy kết quả nào.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
