import { useState } from 'react';
import { X, Search, Bell, Image, FileText, UserPlus, LogOut, ChevronDown, ChevronUp, Palette } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { chatApi, type ChatRoom } from '../api/chatApi';
import { useAuthStore } from '@/store/useAuthStore';
import { usePresenceStore } from '@/store/usePresenceStore';
import { useTimeTick } from '@/hooks/useTimeTick';
import { formatLastSeen } from '@/utils/formatLastSeen';
import { Link } from 'react-router-dom';

interface ChatInfoSidebarProps {
  room: ChatRoom;
  onClose: () => void;
  onMediaClick: (url: string) => void;
}

export const ChatInfoSidebar = ({ room, onClose, onMediaClick }: ChatInfoSidebarProps) => {
  const currentUser = useAuthStore((state) => state.user);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    members: true,
    media: true,
    settings: false,
  });
  const isOnline = usePresenceStore((state) => state.isOnline);
  const getLastSeen = usePresenceStore((state) => state.getLastSeen);

  // Auto-refresh mỗi 30s
  useTimeTick(30_000);

  const { data: members } = useQuery({
    queryKey: ['chat-members', room.id],
    queryFn: () => chatApi.getGroupMembers(room.id),
    enabled: room.roomType === 'GROUP',
  });

  const { data: mediaGallery } = useQuery({
    queryKey: ['chat-media', room.id],
    queryFn: () => chatApi.getMediaGallery(room.id),
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const displayName = room.roomName || 'Cuộc trò chuyện';
  const avatar = room.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;

  return (
    <div className="w-full h-full bg-white border-l border-[var(--color-border-light)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--color-border-light)] shrink-0">
        <h3 className="font-bold text-[15px] text-slate-800">Thông tin</h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Profile Summary */}
        <div className="flex flex-col items-center py-6 px-4 text-center border-b border-[var(--color-border-light)]">
          <img src={avatar} alt="" className="w-20 h-20 rounded-full object-cover shadow-sm border border-slate-200 mb-3" />
          <h2 className="font-bold text-lg text-slate-800">{displayName}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {(() => {
              if (room.roomType === 'GROUP') return `${members?.length || 0} thành viên`;
              const online = room.otherUsername ? isOnline(room.otherUsername) : false;
              if (online) return 'Đang hoạt động';
              const lastSeen = room.otherUsername ? getLastSeen(room.otherUsername) : undefined;
              if (lastSeen) return formatLastSeen(lastSeen);
              return 'Ngoại tuyến';
            })()}
          </p>

          <div className="flex gap-6 mt-6">
            <button className="flex flex-col items-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition">
                <Search size={18} className="text-slate-700" />
              </div>
              <span className="text-xs text-slate-600">Tìm kiếm</span>
            </button>
            <button className="flex flex-col items-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition">
                <Bell size={18} className="text-slate-700" />
              </div>
              <span className="text-xs text-slate-600">Thông báo</span>
            </button>
          </div>
        </div>

        {/* Cài đặt đoạn chat */}
        <div className="border-b border-[var(--color-border-light)]">
          <button onClick={() => toggleSection('settings')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition">
            <span className="font-semibold text-sm text-slate-800">Tùy chỉnh đoạn chat</span>
            {openSections.settings ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>
          {openSections.settings && (
            <div className="px-4 pb-3 space-y-1">
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 text-sm text-slate-700 transition">
                <Palette size={18} className="text-blue-500" /> Đổi chủ đề
              </button>
              {room.roomType === 'GROUP' && (
                <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 text-sm text-slate-700 transition">
                  <UserPlus size={18} className="text-green-500" /> Đổi tên nhóm
                </button>
              )}
            </div>
          )}
        </div>

        {/* Thành viên trong nhóm */}
        {room.roomType === 'GROUP' && members && (
          <div className="border-b border-[var(--color-border-light)]">
            <button onClick={() => toggleSection('members')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition">
              <span className="font-semibold text-sm text-slate-800">Thành viên trong đoạn chat</span>
              {openSections.members ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>
            {openSections.members && (
              <div className="px-4 pb-3 space-y-2">
                {members.map(member => (
                  <Link to={`/profile/${member.username}`} key={member.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition">
                    <img src={member.avatarUrl || `https://i.pravatar.cc/150?u=${member.userId}`} alt="" className="w-10 h-10 rounded-full object-cover hover:opacity-80" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate hover:underline">{member.fullName}</p>
                      {member.role === 'ADMIN' && <p className="text-[10px] text-blue-500 font-bold">Quản trị viên</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Media & Files */}
        <div className="border-b border-[var(--color-border-light)]">
          <button onClick={() => toggleSection('media')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition">
            <span className="font-semibold text-sm text-slate-800">File phương tiện và liên kết</span>
            {openSections.media ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>
          {openSections.media && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <button className="flex-1 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg">File phương tiện</button>
                <button className="flex-1 py-1.5 text-xs font-semibold hover:bg-slate-100 text-slate-500 rounded-lg">File</button>
              </div>
              {mediaGallery && mediaGallery.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {mediaGallery.map(media => (
                    <div key={media.id} className="aspect-square cursor-pointer" onClick={() => media.mediaUrl && onMediaClick(media.mediaUrl)}>
                      {media.mediaType === 'VIDEO' ? (
                        <video src={media.mediaUrl} className="w-full h-full object-cover rounded-md" />
                      ) : (
                        <img src={media.mediaUrl} alt="" className="w-full h-full object-cover rounded-md hover:brightness-90 transition" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-slate-500">
                  Không có file phương tiện nào
                </div>
              )}
            </div>
          )}
        </div>

        {/* Leave Group */}
        {room.roomType === 'GROUP' && (
          <div className="p-4">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition">
              <LogOut size={18} /> <span className="font-semibold text-sm">Rời khỏi nhóm</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
