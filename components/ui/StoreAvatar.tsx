import React from 'react';

interface StoreAvatarProps {
  storeName: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StoreAvatar: React.FC<StoreAvatarProps> = ({
  storeName,
  avatarUrl,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-2xl'
  };

  // Pega a primeira letra do nome da loja
  const firstLetter = storeName?.charAt(0).toUpperCase() || 'L';

  // Se tiver avatar URL, exibe a imagem
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`Avatar ${storeName}`}
        className={`${sizeClasses[size]} rounded-full border-2 border-zinc-800 object-cover ${className}`}
      />
    );
  }

  // Senão, exibe a primeira letra com fundo preto e texto branco
  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-2 border-zinc-800 bg-black flex items-center justify-center font-bold text-white ${className}`}
    >
      {firstLetter}
    </div>
  );
};
