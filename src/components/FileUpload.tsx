import React, { useState, useRef } from 'react';
import { Upload, File, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploadProps {
  path: string;
  onUploadComplete: (url: string, name: string) => void;
  allowedTypes?: string[];
  maxSize?: number; // In MB
}

export const FileUpload = ({ 
  path, 
  onUploadComplete, 
  allowedTypes = ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxSize = 10 
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', ''));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      setError('Invalid file type. Please upload a PDF, Image, or Word document.');
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File too large. Max size is ${maxSize}MB.`);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      }, 
      (err) => {
        setError(err.message);
        setUploading(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onUploadComplete(downloadURL, file.name);
        setUploading(false);
        setProgress(0);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 overflow-hidden ${
          uploading 
            ? 'border-brand-purple bg-brand-purple/5' 
            : 'border-white/10 hover:border-brand-purple/50 bg-white/[0.02] hover:bg-white/[0.04]'
        }`}
      >
        {uploading && (
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${progress}%` }}
             className="absolute bottom-0 left-0 h-1 bg-brand-purple"
           />
        )}

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${uploading ? 'bg-brand-purple/20 animate-pulse' : 'bg-white/5'}`}>
          {uploading ? (
            <Loader2 className="w-6 h-6 text-brand-purple animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-white/40 group-hover:text-brand-purple transition-colors" />
          )}
        </div>

        <div className="text-center">
          <p className="text-sm font-bold text-white tracking-tight">
            {uploading ? `Uploading Assets... ${Math.round(progress)}%` : 'Drop Security Dossiers'}
          </p>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">
            PDF, DOCX, OR IMAGES UP TO {maxSize}MB
          </p>
        </div>

        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20 text-red-400 text-[10px] font-bold uppercase tracking-widest"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
