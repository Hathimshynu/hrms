"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { useRef, useState } from "react";
import type { DocumentEntry, DocumentsValues, StepProps } from "../onboarding-form.types";

// Exact enum accepted by SaveEmployeeDraftRequest::stepEightRules (hrms-backend).
const documentTypes = [
  { label: "Aadhaar Card", value: "Aadhaar Card" },
  { label: "PAN Card", value: "PAN Card" },
  { label: "Driving Licence", value: "Driving Licence" },
  { label: "Passport", value: "Passport" },
  { label: "Voter ID", value: "Voter ID" },
];

// Exact enum on the employee_documents table (verified via a live test
// insert that failed against the mock list's values - "Active"/"Expired"
// etc were never valid on this column).
const documentStatuses = [
  { label: "Pending", value: "pending" },
  { label: "Verified", value: "verified" },
  { label: "Rejected", value: "rejected" },
];

function createDocument(): DocumentEntry {
  return { document_type: "", status: "pending", document_number: "", file: null };
}

export function DocumentsStep({ values, onChange, errors }: StepProps<DocumentsValues>) {
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const documents = values.documents;

  const updateDocuments = (next: DocumentEntry[]) => onChange({ documents: next });

  const addDocument = () => updateDocuments([...documents, createDocument()]);

  const updateDocument = (index: number, patch: Partial<DocumentEntry>) => {
    updateDocuments(documents.map((doc, i) => (i === index ? { ...doc, ...patch } : doc)));
  };

  const removeDocument = (index: number) => {
    const doc = documents[index];
    if (doc.previewUrl) URL.revokeObjectURL(doc.previewUrl);
    updateDocuments(documents.filter((_, i) => i !== index));
  };

  const handleFileUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only PDF, JPG, JPEG and PNG files are allowed.");
      return;
    }
    // Matches the backend's 4096KB (4MB) limit for document uploads.
    if (file.size > 4 * 1024 * 1024) {
      alert("File size should not exceed 4MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const doc = documents[index];
    if (doc.previewUrl) URL.revokeObjectURL(doc.previewUrl);

    updateDocument(index, { file, previewUrl });
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    const doc = documents[index];
    if (doc.previewUrl) URL.revokeObjectURL(doc.previewUrl);
    updateDocument(index, { file: null, previewUrl: undefined });
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const preview = previewIndex !== null ? documents[previewIndex] : null;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Employee Documents</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage employee identification documents.
          </p>
          {errors.documents && <p className="mt-1 text-xs text-red-600">{errors.documents}</p>}
        </div>

        {documents.length > 0 && (
          <div className="space-y-6">
            {documents.map((document, index) => (
              <div key={index} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Document {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove Document
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 grid gap-1">
                    <label className="text-sm font-medium text-gray-700">Document Type</label>
                    <Select
                      placeholder="Select document type"
                      options={documentTypes}
                      value={document.document_type}
                      clearable
                      onChange={(v) => updateDocument(index, { document_type: v as string })}
                      error={errors[`documents.${index}.document_type`]}
                    />
                  </div>

                  <div className="space-y-2 grid gap-1">
                    <label className="text-sm font-medium text-gray-700">Document Number</label>
                    <Input
                      placeholder="Enter document number"
                      value={document.document_number}
                      onChange={(e) => updateDocument(index, { document_number: e.target.value })}
                      error={errors[`documents.${index}.document_number`]}
                    />
                  </div>

                  <div className="space-y-2 grid gap-1">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Select
                      placeholder="Select status"
                      options={documentStatuses}
                      value={document.status}
                      clearable
                      onChange={(v) => updateDocument(index, { status: v as string })}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-2 grid gap-2">
                  <label className="text-sm font-medium text-gray-700">Upload Document</label>

                  {!document.file ? (
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[index]?.click()}
                      className="w-full rounded-lg border-2 border-dashed border-gray-300 px-6 py-7 text-center transition hover:border-gray-400 hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-700">Click to upload document</p>
                      <p className="text-xs text-gray-500">PDF, JPG, JPEG or PNG · Max 4MB</p>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white">
                          {document.file.type === "application/pdf" ? (
                            <span className="text-xs font-semibold text-red-600">PDF</span>
                          ) : (
                            <span className="text-xs font-semibold text-gray-500">IMG</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {document.file.name}
                          </p>
                          <p className="text-xs text-gray-500">{formatFileSize(document.file.size)}</p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewIndex(index)}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    ref={(el) => {
                      fileInputRefs.current[index] = el;
                    }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileUpload(index, e)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {documents.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">
            <p className="mt-3 text-sm font-medium text-gray-900">No documents added</p>
            <p className="mt-1 text-xs text-gray-500">
              Add at least one identification document to continue.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={addDocument}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Add Document
        </button>
      </div>

      {preview?.file && preview.previewUrl && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setPreviewIndex(null)}
        >
          <div
            className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
              <h3 className="truncate text-base font-semibold text-gray-900">
                {preview.file.name}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewIndex(null)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-6">
              {preview.file.type === "application/pdf" ? (
                <iframe
                  src={preview.previewUrl}
                  title={preview.file.name}
                  className="h-full min-h-150 w-full rounded-lg border bg-white"
                />
              ) : (
                <div className="flex min-h-full items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.previewUrl}
                    alt={preview.file.name}
                    className="max-h-full max-w-full rounded-lg object-contain shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
