import React from 'react';

interface StoryRingProps {
  avatarUrl?: string;
  name: string;
  hasUnviewed: boolean;
  isAddButton?: boolean;
  onClick?: () => void;
}

export const StoryRing: React.FC<StoryRingProps> = ({
  avatarUrl,
  name,
  hasUnviewed,
  isAddButton = false,
  onClick,
}) => {
  return (
    <div 
      className="flex flex-col items-center gap-1 cursor-pointer w-20 flex-shrink-0"
      onClick={onClick}
    >
      <div className={`relative p-[3px] rounded-full ${hasUnviewed ? 'bg-gradient-to-tr from-yellow-400 to-pink-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
        <div className="bg-white dark:bg-gray-900 rounded-full p-[2px]">
          <img
            src={avatarUrl || 'https://via.placeholder.com/150'}
            alt={name}
            className="w-14 h-14 rounded-full object-cover"
          />
        </div>
        {isAddButton && (
          <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-gray-900">
            <span className="text-sm font-bold leading-none">+</span>
          </div>
        )}
      </div>
      <span className="text-xs text-center font-medium truncate w-full text-gray-800 dark:text-gray-200">
        {name}
      </span>
    </div>
  );
};
