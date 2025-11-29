import React, { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";

const defaultFields = [];

export default function UploadCard({
  title,
  description,
  extraFields = defaultFields,
  onSubmit,
  isSubmitting = false,
  result = null,
  ctaLabel = "Upload file",
  icon = "🗂️"
}) {
  const [fieldValues, setFieldValues] = useState(() =>
    extraFields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue ?? "";
      return acc;
    }, {})
  );

  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles?.length) {
      setSelectedFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
    },
    multiple: false
  });

  const isReady = useMemo(() => {
    if (!selectedFile) return false;
    return extraFields.every((field) => {
      if (!field.required) return true;
      const value = fieldValues[field.name];
      return value !== undefined && value !== "";
    });
  }, [selectedFile, extraFields, fieldValues]);

  const handleSubmit = () => {
    if (!isReady || !onSubmit) return;
    onSubmit({ file: selectedFile, fields: fieldValues });
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-2xl text-white">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <motion.div
        {...getRootProps()}
        className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          isDragActive ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-medium text-gray-900">
          {selectedFile ? selectedFile.name : "Drag & drop your .xlsx file"}
        </p>
        <p className="text-xs mt-2 text-gray-500">or click to browse</p>
      </motion.div>

      {extraFields.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {extraFields.map((field) => (
            <label key={field.name} className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
              {field.type === "select" ? (
                <select
                  value={fieldValues[field.name]}
                  onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-gray-900 focus:outline-none"
                >
                  <option value="">Select</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || "text"}
                  value={fieldValues[field.name]}
                  onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}
            </label>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          disabled={!isReady || isSubmitting}
          onClick={handleSubmit}
          className="inline-flex items-center rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isSubmitting ? "Uploading…" : ctaLabel}
        </button>
        {selectedFile && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setSelectedFile(null)}
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            Clear
          </button>
        )}
      </div>

      {result && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">{result.title}</p>
          <p className="mt-1">{result.message}</p>
          {result.details && (
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-white p-3 text-xs text-gray-500">
              {result.details}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

