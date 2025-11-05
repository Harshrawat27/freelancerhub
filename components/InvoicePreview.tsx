'use client';

import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { createPdfBlob, createBlobUrl, revokeBlobUrl } from '@/lib/create-pdf-blob';
import { InvoiceFormData } from '@/lib/validations';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDF_VIEWER_PADDING = 18;

interface InvoicePreviewProps {
  invoiceData: InvoiceFormData;
}

const PDFViewer = ({ url, width }: { url: string | null; width: number }) => {
  const [error, setError] = useState<Error | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);

  if (width === 0) {
    width = 600;
  }

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary mx-auto"></div>
          <p className="text-sm text-gray-500">Loading invoice preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 text-red-500">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">
            Error loading PDF
          </p>
          <p className="mt-1 text-xs text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Document
        file={url}
        loading={
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary mx-auto"></div>
              <p className="text-sm text-gray-500">Loading PDF...</p>
            </div>
          </div>
        }
        onLoadError={(error) => {
          console.error('[ERROR]: Error loading PDF:', error);
          setError(error);
        }}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
        }}
        className="hide-scrollbar flex h-full max-h-full w-full items-center justify-center overflow-y-scroll py-4 sm:items-start"
      >
        <Page
          pageNumber={1}
          width={width > 600 ? 600 - PDF_VIEWER_PADDING : width - PDF_VIEWER_PADDING}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  );
};

export default function InvoicePreview({ invoiceData }: InvoicePreviewProps) {
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track container width
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);

    // Initial size
    setContainerWidth(containerRef.current.offsetWidth);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Generate PDF when data changes
  useEffect(() => {
    setPdfError(null);

    let isActive = true;

    (async () => {
      try {
        const blob = await createPdfBlob({ invoiceData });
        if (!isActive) return;

        const newUrl = createBlobUrl({ blob });

        // Revoke the old URL before setting the new one
        setGeneratedPdfUrl((prevUrl) => {
          if (prevUrl) {
            revokeBlobUrl({ url: prevUrl });
          }
          return newUrl;
        });
      } catch (err) {
        if (!isActive) return;

        const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
        setPdfError(errorMessage);
        console.error('[ERROR]: Failed to generate PDF:', err);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [invoiceData]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (generatedPdfUrl) {
        revokeBlobUrl({ url: generatedPdfUrl });
      }
    };
  }, [generatedPdfUrl]);

  if (pdfError) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 text-red-500">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">Error generating PDF</p>
          <p className="mt-1 text-xs text-gray-500">{pdfError}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="hide-scrollbar h-full w-full overflow-y-auto bg-gray-100">
      <PDFViewer url={generatedPdfUrl} width={containerWidth} />
    </div>
  );
}
