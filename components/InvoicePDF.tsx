import { InvoiceFormData } from '@/lib/validations';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

interface InvoicePDFProps {
  data: InvoiceFormData;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ee575a',
    color: '#ffffff',
    padding: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  companyInfo: {
    fontSize: 11,
    opacity: 0.95,
    marginBottom: 3,
  },
  invoiceAmount: {
    textAlign: 'right',
  },
  amountLabel: {
    fontSize: 11,
    opacity: 0.9,
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
  },
  body: {
    padding: 40,
  },
  billingSection: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 32,
  },
  billingBlock: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  billingName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 6,
  },
  billingText: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.4,
    marginBottom: 3,
  },
  metaGrid: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 20,
    marginBottom: 28,
    gap: 15,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 11,
    color: '#1f2937',
    fontFamily: 'Helvetica-Bold',
  },
  notesSection: {
    padding: 16,
    marginBottom: 28,
    borderRadius: 8,
    borderLeft: '3px solid #ee575a',
    backgroundColor: 'rgba(238, 87, 90, 0.08)',
  },
  notesTitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13,
    color: '#1f2937',
  },
  table: {
    marginBottom: 28,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: '10 12',
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderTop: '1px solid #e5e7eb',
    padding: '16 12',
  },
  itemDetail: {
    flex: 3,
  },
  itemName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    color: '#111827',
  },
  itemDescription: {
    fontSize: 10,
    color: '#6b7280',
  },
  tableCell: {
    fontSize: 11,
    color: '#1f2937',
  },
  tableCellQty: {
    flex: 0.6,
    textAlign: 'center',
  },
  tableCellRate: {
    flex: 1,
    textAlign: 'right',
  },
  tableCellAmount: {
    flex: 1,
    textAlign: 'right',
  },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 32,
  },
  totalsContent: {
    width: 240,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    fontSize: 11,
  },
  totalRowSubtotal: {
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 10,
    marginBottom: 10,
  },
  totalRowGrand: {
    borderTop: '2px solid #ee575a',
    paddingTop: 10,
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#ee575a',
  },
  footer: {
    borderTop: '2px solid #f3f4f6',
    padding: '24 40',
    backgroundColor: '#fafafa',
  },
  footerCenter: {
    textAlign: 'center',
    marginBottom: 16,
  },
  footerTitle: {
    color: '#ee575a',
    marginBottom: 6,
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 11,
  },
  termsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid #e5e7eb',
  },
  termsTitle: {
    fontSize: 11,
    marginBottom: 6,
    color: '#374151',
    fontFamily: 'Helvetica-Bold',
  },
  termsText: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.4,
  },
});

export default function InvoicePDF({ data }: InvoicePDFProps) {
  return (
    <Document
      title={`Invoice-${data.invoiceNumber}`}
      author={data.businessName}
      creator={data.businessName}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.companyName}>
                {data.businessName || 'Your Business'}
              </Text>
              <Text style={styles.companyInfo}>
                {data.businessEmail || 'hello@email.com'}
              </Text>
              {data.businessPhone && (
                <Text style={styles.companyInfo}>{data.businessPhone}</Text>
              )}
            </View>
            <View style={styles.invoiceAmount}>
              <Text style={styles.amountLabel}>Invoice of (USD)</Text>
              <Text style={styles.amountValue}>${data.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Billing Information */}
          <View style={styles.billingSection}>
            <View style={styles.billingBlock}>
              <Text style={styles.sectionTitle}>From</Text>
              <Text style={styles.billingName}>
                {data.businessName || 'Your Business'}
              </Text>
              {data.businessAddress && (
                <Text style={styles.billingText}>{data.businessAddress}</Text>
              )}
            </View>
            <View style={styles.billingBlock}>
              <Text style={styles.sectionTitle}>Billed To</Text>
              <Text style={styles.billingName}>
                {data.clientName || 'Client Name'}
              </Text>
              {data.clientAddress && (
                <Text style={styles.billingText}>{data.clientAddress}</Text>
              )}
              {data.clientPhone && (
                <Text style={styles.billingText}>{data.clientPhone}</Text>
              )}
            </View>
          </View>

          {/* Meta Information */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Invoice Number</Text>
              <Text style={styles.metaValue}>{data.invoiceNumber}</Text>
            </View>
            {data.poNumber && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Reference</Text>
                <Text style={styles.metaValue}>{data.poNumber}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Invoice Date</Text>
              <Text style={styles.metaValue}>
                {new Date(data.invoiceDate).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>
                {new Date(data.dueDate).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Notes */}
          {data.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Notes</Text>
              <Text style={styles.notesText}>{data.notes}</Text>
            </View>
          )}

          {/* Items Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>
                Item Detail
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableCellQty]}>
                QTY
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableCellRate]}>
                Rate
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableCellAmount]}>
                Amount
              </Text>
            </View>
            {data.items.map((item, index) => (
              <View key={item.id} style={styles.tableRow}>
                <View style={styles.itemDetail}>
                  <Text style={styles.itemName}>Item {index + 1}</Text>
                  <Text style={styles.itemDescription}>
                    {item.description || 'Item description'}
                  </Text>
                </View>
                <Text style={[styles.tableCell, styles.tableCellQty]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellRate]}>
                  ${item.rate.toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellAmount]}>
                  ${item.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalsSection}>
            <View style={styles.totalsContent}>
              <View style={[styles.totalRow, styles.totalRowSubtotal]}>
                <Text>Subtotal</Text>
                <Text>${data.subtotal.toFixed(2)}</Text>
              </View>
              {data.taxRate > 0 && (
                <View style={styles.totalRow}>
                  <Text>Tax ({data.taxRate}%)</Text>
                  <Text>${data.taxAmount.toFixed(2)}</Text>
                </View>
              )}
              {data.discount > 0 && (
                <View style={styles.totalRow}>
                  <Text>Discount</Text>
                  <Text>-${data.discount.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.totalRowGrand]}>
                <Text>Total</Text>
                <Text>${data.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerCenter}>
            <Text style={styles.footerTitle}>Thanks for the business.</Text>
            <Text style={styles.footerText}>
              Date:{' '}
              {new Date(data.invoiceDate).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}{' '}
              | Due Date:{' '}
              {new Date(data.dueDate).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>
              {data.terms || 'Please pay within 15 days of receiving this invoice.'}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
