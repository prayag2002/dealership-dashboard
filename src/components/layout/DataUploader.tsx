'use client';

import { useRef, useState } from 'react';
import { Upload, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { parseUploadedData } from '../../lib/data-loader';
import { useFilterStore } from '../../store/filters';

export default function DataUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setData, isCustomDataset } = useFilterStore();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseUploadedData(file);
      useFilterStore.setState({ isCustomDataset: true });
      setData(data);
      setStatus('success');
      setMessage(`Loaded: ${data.branches.length} branches, ${data.leads.length} leads`);
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to load file');
      setTimeout(() => setStatus('idle'), 5000);
    }

    // Reset input so the same file can be re-uploaded
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleReset = async () => {
    try {
      const res = await fetch('/dealership_data.json');
      const data = await res.json();
      useFilterStore.setState({ isCustomDataset: false });
      setData(data);
      setStatus('success');
      setMessage('Reset to default dataset');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setMessage('Failed to load default dataset');
    }
  };

  return (
    <div style={{ padding: '0 12px 8px' }}>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        onChange={handleUpload}
        style={{ display: 'none' }}
        id="dataset-upload"
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="sidebar-link"
        style={{
          width: '100%',
          border: 'none',
          cursor: 'pointer',
          background: 'transparent',
          fontSize: 13,
        }}
      >
        <Upload size={18} />
        <span>Upload Dataset</span>
      </button>

      {isCustomDataset && (
        <button
          onClick={handleReset}
          className="sidebar-link"
          style={{
            width: '100%',
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          <RotateCcw size={16} />
          <span>Reset to Default</span>
        </button>
      )}

      {status !== 'idle' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            fontSize: 11,
            color: status === 'success' ? 'var(--color-emerald)' : 'var(--color-rose)',
            borderRadius: 'var(--radius-sm)',
            background: status === 'success' ? 'var(--color-emerald-light)' : 'var(--color-rose-light)',
            marginTop: 4,
          }}
        >
          {status === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
