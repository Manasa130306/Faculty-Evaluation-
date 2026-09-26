'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  ExternalLink,
  X,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCheck,
} from 'lucide-react';

export interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  title?: string | null;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  fileType,
  fileSize,
  title,
}: DocumentViewerProps) {
  if (!isOpen) return null;

  const safeName = fileName || 'Evidence Document';

  const isImage =
    (fileType && fileType.startsWith('image/')) ||
    (fileUrl && fileUrl.startsWith('data:image/')) ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(safeName);

  const isPdf =
    fileType === 'application/pdf' ||
    (fileUrl && fileUrl.startsWith('data:application/pdf')) ||
    /\.pdf$/i.test(safeName);

  const isExcel =
    (fileType && (fileType.includes('sheet') || fileType.includes('excel'))) ||
    /\.(xls|xlsx)$/i.test(safeName);

  const isWord =
    (fileType && (fileType.includes('word') || fileType.includes('document'))) ||
    /\.(doc|docx)$/i.test(safeName);

  const handleDownload = () => {
    if (!fileUrl) return;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Evidence / Reference Document Viewer'}
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Header Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              {isImage ? (
                <ImageIcon className="w-5 h-5" />
              ) : isExcel ? (
                <FileSpreadsheet className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="truncate">
              <span className="font-bold text-slate-900 block truncate text-sm">
                {fileName || 'Evidence Document'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : 'Reference Proof'} •{' '}
                {isImage ? 'Original Image' : isPdf ? 'PDF Document' : 'Document File'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {fileUrl && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="cursor-pointer text-xs font-semibold gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </Button>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Tab</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="min-h-[320px] max-h-[75vh] overflow-auto bg-slate-900/5 rounded-xl border border-slate-200 flex items-center justify-center p-4">
          {isImage && fileUrl ? (
            <div className="w-full flex flex-col items-center justify-center">
              <img
                src={fileUrl}
                alt={safeName}
                className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-sm border border-slate-200 bg-white"
                style={{ imageRendering: 'auto' }}
              />
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Original layout and aspect-ratio preserved.
              </p>
            </div>
          ) : isPdf && fileUrl ? (
            <div className="w-full h-[68vh] flex flex-col">
              <iframe
                src={fileUrl}
                title={safeName}
                className="w-full flex-1 rounded-lg border border-slate-300 bg-white shadow-xs"
              />
            </div>
          ) : (
            <div className="text-center py-12 px-6 max-w-md bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto mb-4">
                {isWord || isExcel ? (
                  <FileSpreadsheet className="w-8 h-8 text-blue-700" />
                ) : (
                  <FileText className="w-8 h-8 text-blue-700" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">{safeName}</h3>
              <p className="text-xs text-slate-500 mb-6">
                This document is ready to download and view in your local Office viewer.
              </p>
              {fileUrl ? (
                <Button
                  onClick={handleDownload}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold gap-2 cursor-pointer w-full"
                >
                  <Download className="w-4 h-4" />
                  <span>Download & View {safeName}</span>
                </Button>
              ) : (
                <p className="text-xs text-slate-400 italic">No file data URL available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
