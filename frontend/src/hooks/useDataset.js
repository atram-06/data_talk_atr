import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export function useDataset() {
  const [schema, setSchema] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [datasetName, setDatasetName] = useState('superstore_sales');
  const [error, setError] = useState(null);

  const fetchSchema = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/schema`);
      if (!res.ok) throw new Error('Failed to fetch schema');
      const data = await res.json();
      setSchema(data);
      setDatasetName(data.table_name);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  const uploadCSV = useCallback(async (file) => {
    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/upload-csv`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }

      const data = await res.json();
      setUploadResult(data);
      setDatasetName(data.table_name);

      // Refresh schema
      await fetchSchema();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [fetchSchema]);

  return {
    schema,
    isUploading,
    uploadResult,
    datasetName,
    error,
    uploadCSV,
    fetchSchema
  };
}
