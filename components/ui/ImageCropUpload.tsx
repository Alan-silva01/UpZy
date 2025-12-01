import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Check, Loader2 } from 'lucide-react';

interface ImageCropUploadProps {
  currentImage?: string;
  onUpload: (file: File, croppedDataUrl: string) => Promise<void>;
  label?: string;
}

export const ImageCropUpload: React.FC<ImageCropUploadProps> = ({
  currentImage,
  onUpload,
  label = 'Upload de Imagem'
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const originalFileRef = useRef<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      originalFileRef.current = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setCropPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropPosition.x, y: e.clientY - cropPosition.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    const containerWidth = imageRef.current.parentElement?.clientWidth || 0;
    const containerHeight = imageRef.current.parentElement?.clientHeight || 0;
    const imgWidth = imageRef.current.naturalWidth;
    const imgHeight = imageRef.current.naturalHeight;

    // Calculate scale
    const scale = Math.max(containerWidth / imgWidth, containerHeight / imgHeight);
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;

    // Constrain position
    const maxX = 0;
    const minX = containerWidth - scaledWidth;
    const maxY = 0;
    const minY = containerHeight - scaledHeight;

    setCropPosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleCrop = () => {
    if (!selectedImage || !imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropSize = 400; // Tamanho final da imagem (400x400)
    canvas.width = cropSize;
    canvas.height = cropSize;

    const containerWidth = imageRef.current.parentElement?.clientWidth || 0;
    const containerHeight = imageRef.current.parentElement?.clientHeight || 0;
    const imgWidth = imageRef.current.naturalWidth;
    const imgHeight = imageRef.current.naturalHeight;

    const scale = Math.max(containerWidth / imgWidth, containerHeight / imgHeight);

    // Calculate source crop area
    const sourceX = -cropPosition.x / scale;
    const sourceY = -cropPosition.y / scale;
    const sourceSize = containerWidth / scale;

    ctx.drawImage(
      imageRef.current,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      cropSize,
      cropSize
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCroppedImage(croppedDataUrl);
  };

  const handleUpload = async () => {
    if (!croppedImage || !originalFileRef.current) return;

    setUploading(true);
    try {
      // Convert data URL to File
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], originalFileRef.current.name, { type: 'image/jpeg' });

      await onUpload(file, croppedImage);
      setSelectedImage(null);
      setCroppedImage(null);
      originalFileRef.current = null;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedImage(null);
    setCroppedImage(null);
    setCropPosition({ x: 0, y: 0 });
    originalFileRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
        {label}
      </label>

      {!selectedImage && !croppedImage && (
        <div className="space-y-3">
          {/* Current Image Preview */}
          {currentImage && (
            <div className="flex items-center gap-4">
              <img
                src={currentImage}
                alt="Avatar atual"
                className="w-16 h-16 rounded-xl object-cover border border-zinc-700"
              />
              <span className="text-xs text-zinc-500">Avatar atual</span>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-indigo-500/50 bg-zinc-900/50 hover:bg-indigo-500/5 text-zinc-500 hover:text-indigo-400 text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            Escolher Nova Imagem
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-xs text-zinc-600 text-center">
            A imagem será recortada em formato quadrado
          </p>
        </div>
      )}

      {/* Crop Interface */}
      {selectedImage && !croppedImage && (
        <div className="space-y-4">
          <div
            className="relative w-full aspect-square rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <img
              ref={imageRef}
              src={selectedImage}
              alt="Crop preview"
              className="absolute select-none"
              style={{
                left: `${cropPosition.x}px`,
                top: `${cropPosition.y}px`,
                minWidth: '100%',
                minHeight: '100%',
                objectFit: 'cover'
              }}
              onMouseDown={handleMouseDown}
              draggable={false}
            />
            {/* Overlay grid */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/10" />
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-500 text-center">
            Arraste a imagem para ajustar o enquadramento
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCrop}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-bold hover:from-indigo-600 hover:to-indigo-700 transition-all"
            >
              Recortar
            </button>
          </div>
        </div>
      )}

      {/* Preview and Upload */}
      {croppedImage && (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <img
              src={croppedImage}
              alt="Preview"
              className="w-40 h-40 rounded-2xl object-cover border border-zinc-700"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="flex-1 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Confirmar
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
