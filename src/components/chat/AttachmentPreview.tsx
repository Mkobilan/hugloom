'use client'

import { X, FileText, Image as ImageIcon } from 'lucide-react'

interface AttachmentPreviewProps {
    file: File
    onRemove: () => void
}

export function AttachmentPreview({ file, onRemove }: AttachmentPreviewProps) {
    const isImage = file.type.startsWith('image/')
    const sizeInKB = (file.size / 1024).toFixed(1)

    return (
        <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-border w-fit animate-in fade-in slide-in-from-bottom-2">
            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-500 overflow-hidden relative">
                {isImage ? (
                    <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <FileText size={20} />
                )}
            </div>
            <div className="flex flex-col max-w-[200px]">
                <span className="text-sm font-medium truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">{sizeInKB} KB</span>
            </div>
            <button
                onClick={onRemove}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    )
}
