"use client";

import { Select } from "@/src/components/ui/Select";
import { useRef, useState } from "react";

const documentTypes = [
  { label: "Government ID", value: "government_id" },
  { label: "PAN Card", value: "pan_card" },
  { label: "Aadhaar", value: "aadhaar" },
  { label: "Passport", value: "passport" },
  { label: "Driving License", value: "driving_license" },
  { label: "Offer Letter", value: "offer_letter" },
  { label: "Employment Contract", value: "employment_contract" },
  { label: "Educational Certificate", value: "educational_certificate" },
  { label: "Experience Certificate", value: "experience_certificate" },
  { label: "Other", value: "other" },
];

const documentStatuses = [
  { label: "Active", value: "active" },
  { label: "Expired", value: "expired" },
  { label: "Pending Verification", value: "pending_verification" },
  { label: "Rejected", value: "rejected" },
];

interface DocumentItem {
  id: string;
  documentName: string;
  documentType: string;
  documentNumber: string;
  file: File | null;
  issueDate: string;
  expiryDate: string;
  status: string;
  previewUrl?: string;
}

export function DocumentsStep() {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const [previewDocument, setPreviewDocument] = useState<DocumentItem | null>(
    null,
  );

  const createDocument = (): DocumentItem => ({
    id: `${Date.now()}-${Math.random()}`,
    documentName: "",
    documentType: "",
    documentNumber: "",
    file: null,
    issueDate: "",
    expiryDate: "",
    status: "active",
  });

  const addDocument = () => {
    setDocuments((prev) => [...prev, createDocument()]);
  };

  const updateDocument = (
    id: string,
    field: keyof DocumentItem,
    value: any,
  ) => {
    setDocuments((prev) =>
      prev.map((document) =>
        document.id === id
          ? {
              ...document,
              [field]: value,
            }
          : document,
      ),
    );
  };

  const handleFileUpload = (
    id: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Only PDF, JPG, JPEG and PNG files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should not exceed 5MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setDocuments((prev) =>
      prev.map((document) => {
        if (document.id !== id) return document;

        if (document.previewUrl) {
          URL.revokeObjectURL(document.previewUrl);
        }

        return {
          ...document,
          file,
          previewUrl,
        };
      }),
    );

    event.target.value = "";
  };

  const removeFile = (id: string) => {
    setDocuments((prev) =>
      prev.map((document) => {
        if (document.id !== id) return document;

        if (document.previewUrl) {
          URL.revokeObjectURL(document.previewUrl);
        }

        return {
          ...document,
          file: null,
          previewUrl: undefined,
        };
      }),
    );
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => {
      const document = prev.find((item) => item.id === id);

      if (document?.previewUrl) {
        URL.revokeObjectURL(document.previewUrl);
      }

      return prev.filter((item) => item.id !== id);
    });
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentTypeName = (value: string) => {
    return (
      documentTypes.find((item) => item.value === value)?.label || "Document"
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Employee Documents
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Upload and manage employee identification, employment and
            educational documents.
          </p>
        </div>

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-6">
            {documents.map((document, index) => (
              <div
                key={document.id}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                {/* Card Header */}
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      Document {index + 1}
                    </h4>

                    {document.documentType && (
                      <p className="mt-1 text-xs text-gray-500">
                        {getDocumentTypeName(document.documentType)}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeDocument(document.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove Document
                  </button>
                </div>

                {/* Basic Details */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Document Type */}
                  <div className="space-y-2 grid gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Document Type
                    </label>

                    <Select
                      id={`documentType-${document.id}`}
                      name={`documentType-${document.id}`}
                      placeholder="Select document type"
                      options={documentTypes}
                      value={document.documentType}
                      onChange={(value) =>
                        updateDocument(document.id, "documentType", value)
                      }
                    />
                  </div>

                  <div className="space-y-2 grid gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Status
                    </label>

                    <Select
                      id={`status-${document.id}`}
                      name={`status-${document.id}`}
                      placeholder="Select status"
                      options={documentStatuses}
                      value={document.status}
                      onChange={(value) =>
                        updateDocument(document.id, "status", value)
                      }
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div className="mt-5 space-y-2 grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Upload Document
                  </label>

                  {!document.file ? (
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRefs.current[document.id]?.click()
                      }
                      className="w-full rounded-lg border-2 border-dashed border-gray-300 px-6 py-7 text-center transition hover:border-gray-400 hover:bg-gray-50"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                          <svg
                            className="h-5 w-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v9"
                            />
                          </svg>
                        </div>

                        <p className="text-sm font-medium text-gray-700">
                          Click to upload document
                        </p>

                        <p className="text-xs text-gray-500">
                          PDF, JPG, JPEG or PNG · Max 5MB
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white">
                          {document.file.type === "application/pdf" ? (
                            <span className="text-xs font-semibold text-red-600">
                              PDF
                            </span>
                          ) : (
                            <svg
                              className="h-5 w-5 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4-4 4 4 4-5 4 5M5 20h14a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v14a1 1 0 001 1z"
                              />
                            </svg>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {document.file.name}
                          </p>

                          <p className="text-xs text-gray-500">
                            {formatFileSize(document.file.size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDocument(document)}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Preview
                        </button>

                        <button
                          type="button"
                          onClick={() => removeFile(document.id)}
                          className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    ref={(element) => {
                      fileInputRefs.current[document.id] = element;
                    }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(event) => handleFileUpload(document.id, event)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <svg
                className="h-6 w-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <p className="mt-3 text-sm font-medium text-gray-900">
              No documents added
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Add the employee's identification and employment documents.
            </p>
          </div>
        )}

        {/* Add Document */}
        <button
          type="button"
          onClick={addDocument}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Document
        </button>
      </div>

      {/* Preview Modal */}
      {previewDocument?.file && previewDocument.previewUrl && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setPreviewDocument(null)}
        >
          <div
            className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Preview Header */}
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-gray-900">
                  {previewDocument.documentName || previewDocument.file.name}
                </h3>

                <p className="text-xs text-gray-500">
                  {previewDocument.file.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewDocument(null)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-auto bg-gray-100 p-6">
              {previewDocument.file.type === "application/pdf" ? (
                <iframe
                  src={previewDocument.previewUrl}
                  title={previewDocument.file.name}
                  className="h-full min-h-150 w-full rounded-lg border bg-white"
                />
              ) : (
                <div className="flex min-h-full items-center justify-center">
                  <img
                    src={previewDocument.previewUrl}
                    alt={previewDocument.documentName}
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
