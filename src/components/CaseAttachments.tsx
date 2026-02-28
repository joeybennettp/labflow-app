'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Trash2, FileText, Image, File, Download, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CaseAttachment } from '@/lib/types';

type Props = {
  caseId: string;
  role?: 'lab' | 'doctor'; // defaults to 'lab'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(fileType: string): boolean {
  return fileType.startsWith('image/');
}

function getFileIcon(fileType: string) {
  if (isImage(fileType)) return <Image size={16} className="text-blue-500" />;
  if (fileType === 'application/pdf') return <FileText size={16} className="text-red-500" />;
  return <File size={16} className="text-slate-400" />;
}

export default function CaseAttachments({ caseId, role = 'lab' }: Props) {
  const [attachments, setAttachments] = useState<CaseAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    fileType: string;
    fileName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = useCallback(async () => {
    const { data, error } = await supabase
      .from('case_attachments')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch attachments:', error.message);
    } else {
      setAttachments((data as CaseAttachment[]) || []);
    }
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  async function uploadFile(file: globalThis.File) {
    setError(null);

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, WebP, and PDF files are allowed.');
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be under 10 MB.');
      return;
    }

    setUploading(true);

    try {
      // Generate unique path: caseId/timestamp-filename
      const ext = file.name.split('.').pop() || 'bin';
      const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 100);
      const filePath = `${caseId}/${Date.now()}-${safeName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('case-attachments')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
        });

      if (uploadError) throw new Error(uploadError.message);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert metadata row
      const { error: insertError } = await supabase
        .from('case_attachments')
        .insert({
          case_id: caseId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
          uploaded_by_role: role,
        });

      if (insertError) throw new Error(insertError.message);

      await fetchAttachments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(attachment: CaseAttachment) {
    const confirmed = window.confirm(
      `Delete "${attachment.file_name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('case-attachments')
      .remove([attachment.file_path]);

    if (storageError) {
      setError('Failed to delete file: ' + storageError.message);
      return;
    }

    // Delete metadata row
    const { error: dbError } = await supabase
      .from('case_attachments')
      .delete()
      .eq('id', attachment.id);

    if (dbError) {
      setError('Failed to delete record: ' + dbError.message);
      return;
    }

    await fetchAttachments();
  }

  async function handleDownload(attachment: CaseAttachment) {
    const { data, error } = await supabase.storage
      .from('case-attachments')
      .createSignedUrl(attachment.file_path, 60); // 60 second URL

    if (error || !data?.signedUrl) {
      setError('Failed to generate download link');
      return;
    }

    window.open(data.signedUrl, '_blank');
  }

  async function handlePreview(attachment: CaseAttachment) {
    const { data, error } = await supabase.storage
      .from('case-attachments')
      .createSignedUrl(attachment.file_path, 300); // 5 minute URL

    if (error || !data?.signedUrl) {
      setError('Failed to load preview');
      return;
    }

    setPreview({
      url: data.signedUrl,
      fileType: attachment.file_type,
      fileName: attachment.file_name,
    });
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(uploadFile);
    }
    // Reset so the same file can be uploaded again
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach(uploadFile);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  return (
    <div className="mt-5">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        Attachments
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors mb-3 ${
          dragOver
            ? 'border-brand-400 bg-brand-50'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={handleFileInput}
          className="hidden"
        />
        {uploading ? (
          <div className="text-sm text-slate-500">
            <div className="animate-pulse">Uploading...</div>
          </div>
        ) : (
          <>
            <Upload size={20} className="mx-auto text-slate-400 mb-1" />
            <p className="text-sm text-slate-500">
              Drop files here or <span className="text-brand-600 font-semibold">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              JPG, PNG, WebP, PDF up to 10 MB
            </p>
          </>
        )}
      </div>

      {/* Attachments list */}
      {loading ? (
        <p className="text-sm text-slate-400">Loading attachments...</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-slate-400">No files attached yet.</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              onClick={() => handlePreview(att)}
              className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100 group cursor-pointer hover:bg-slate-100 transition-colors"
            >
              {/* Thumbnail or icon */}
              <div className="w-10 h-10 bg-white border border-slate-200 rounded-md flex items-center justify-center overflow-hidden shrink-0 group-hover:border-brand-300 transition-colors">
                {getFileIcon(att.file_type)}
              </div>

              {/* File info */}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-800 truncate">
                  {att.file_name}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  {formatFileSize(att.file_size)} · {new Date(att.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  <span className={`px-1.5 py-0.5 rounded text-[0.6rem] font-bold ${
                    att.uploaded_by_role === 'doctor'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {att.uploaded_by_role === 'doctor' ? 'Doctor' : 'Lab'}
                  </span>
                </div>
              </div>

              {/* Actions — stopPropagation so they don't trigger preview */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleDownload(att)}
                  title="Download"
                  className="w-8 h-8 rounded-md text-slate-400 hover:bg-white hover:text-slate-600 flex items-center justify-center transition-colors"
                >
                  <Download size={14} />
                </button>
                {/* Lab staff can delete any file; doctors can only delete their own */}
                {(role === 'lab' || att.uploaded_by_role === 'doctor') && (
                  <button
                    onClick={() => handleDelete(att)}
                    title="Delete"
                    className="w-8 h-8 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File preview overlay */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className={`relative ${
              preview.fileType === 'application/pdf'
                ? 'w-full max-w-4xl h-[85vh]'
                : 'max-w-3xl max-h-[80vh]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium truncate mr-4">
                {preview.fileName}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={preview.url}
                  download={preview.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                  title="Download"
                >
                  <Download size={14} />
                </a>
                <button
                  onClick={() => setPreview(null)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            {isImage(preview.fileType) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt="Preview"
                className="max-w-full max-h-[75vh] rounded-lg shadow-2xl object-contain mx-auto"
              />
            ) : preview.fileType === 'application/pdf' ? (
              <iframe
                src={preview.url}
                title="PDF Preview"
                className="w-full h-full rounded-lg shadow-2xl bg-white"
              />
            ) : (
              <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
                <File size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500 mb-3">Preview not available for this file type.</p>
                <a
                  href={preview.url}
                  download={preview.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 font-semibold hover:underline"
                >
                  Download to view
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
