import { pdf } from '@react-pdf/renderer';
import InvoicePDF from '@/components/InvoicePDF';
import { InvoiceFormData } from './validations';

interface CreatePdfBlobProps {
  invoiceData: InvoiceFormData;
}

export const createPdfBlob = async ({ invoiceData }: CreatePdfBlobProps) => {
  const pdfDocument = <InvoicePDF data={invoiceData} />;
  const blob = await pdf(pdfDocument).toBlob();
  return blob;
};

export const createBlobUrl = ({ blob }: { blob: Blob }) => {
  return URL.createObjectURL(blob);
};

export const revokeBlobUrl = ({ url }: { url: string }) => {
  URL.revokeObjectURL(url);
};
