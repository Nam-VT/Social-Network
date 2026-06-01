import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { postApi } from '../api/postApi';

interface MentionDropdownProps {
  query: string;
  onSelect: (user: any) => void;
}

export const MentionDropdown = ({ query, onSelect }: MentionDropdownProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['mention-search', query],
    queryFn: () => postApi.searchUsers(query, 6),
    enabled: query.length >= 1,
    staleTime: 10000,
  });

  const users = data?.data?.content || [];
  if (!query || (users.length === 0 && !isLoading)) return null;

  return (
    <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-[200px] overflow-y-auto">
      {isLoading ? (
        <div className="p-3 text-center text-slate-400 text-sm">
          <Loader2 className="animate-spin inline" size={16} /> Đang tìm...
        </div>
      ) : (
        users.map((u: any) => (
          <button
            key={u.id}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
            onClick={() => onSelect(u)}
          >
            <img src={u.avatarUrl || 'https://i.pravatar.cc/150'} className="w-7 h-7 rounded-full" alt="" />
            <div>
              <div className="text-sm font-medium text-slate-800">{u.fullName || u.username}</div>
              <div className="text-[11px] text-slate-400">@{u.username}</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
};
