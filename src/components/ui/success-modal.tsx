import * as React from 'react';
import { Button } from './button';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'Continue',
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-7 text-center overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Clean Animated Checkmark Circle */}
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner relative">
          <svg
            className="w-9 h-9 stroke-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              className="checkmark-path"
              d="M5 13l4 4L19 7"
              style={{
                strokeDasharray: 24,
                strokeDashoffset: 0,
                animation: 'strokeAnimation 0.4s cubic-bezier(0.65, 0, 0.45, 1) forwards',
              }}
            />
          </svg>
        </div>

        {/* Title & Message */}
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{message}</p>

        {/* Continue Button */}
        <div className="mt-6">
          <Button
            variant="primary"
            size="lg"
            onClick={onClose}
            className="w-full font-bold shadow-md cursor-pointer bg-blue-700 hover:bg-blue-800"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
