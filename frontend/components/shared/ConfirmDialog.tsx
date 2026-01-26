import React from 'react';
import { AlertTriangle, LogOut, Trash2, X, AlertCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'logout';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'logout':
        return <LogOut className="w-6 h-6" />;
      case 'danger':
        return <Trash2 className="w-6 h-6" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />;
      case 'info':
        return <Info className="w-6 h-6" />;
      default:
        return <AlertCircle className="w-6 h-6" />;
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case 'logout':
        return 'bg-blue-100';
      case 'danger':
        return 'bg-red-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'info':
        return 'bg-blue-100';
      default:
        return 'bg-red-100';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'logout':
        return 'text-blue-600';
      case 'danger':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-red-600';
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'logout':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'info':
        return 'bg-botai-dark hover:bg-opacity-90 text-white';
      default:
        return 'bg-red-600 hover:bg-red-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="flex justify-center pt-8 pb-4">
          <div className={`w-20 h-20 rounded-full ${getIconBgColor()} flex items-center justify-center ${getIconColor()}`}>
            {getIcon()}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-6 text-center">
          <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark mb-3">
            {title}
          </h2>
          <p className="font-noto-sans text-botai-text leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-8 pb-8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3.5 rounded-xl font-noto-sans font-semibold text-botai-dark bg-white border-2 border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-6 py-3.5 rounded-xl font-noto-sans font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide ${getConfirmButtonClass()}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
