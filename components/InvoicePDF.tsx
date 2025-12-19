import { InvoiceFormData } from '@/lib/validations';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { getCurrencySymbol } from '@/lib/currencies';

interface InvoicePDFProps {
  data: InvoiceFormData;
}

// "Pro Compact" Design System
// - Base font size: 9pt
// - Headers: 8pt uppercase, tracking 1px
// - Primary Color: User defined or Black
// - Layout: Horizontal emphasis to reduce vertical scroll/pages

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.4,
    backgroundColor: '#ffffff',
    padding: '30 35', // Compact margins
    color: '#1a1a1a',
  },
  
  // Header: Logo + Business Info
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  logoContainer: {
    width: 60,
    height: 60,
    marginRight: 15,
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  businessColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  businessName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
    color: '#111827',
  },
  headerLabel: {
    fontSize: 30,
    fontFamily: 'Helvetica-Bold',
    color: '#f3f4f6', // Subtle watermark effect
    letterSpacing: 4,
    textTransform: 'uppercase',
    position: 'absolute',
    right: 0,
    top: -5,
  },

  // The "Meta Bar" - High value info in a horizontal strip
  metaBar: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: '12 15',
    borderRadius: 6,
    marginBottom: 25,
    borderLeftWidth: 4, // Accent color applied dynamically
  },
  metaGroup: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },

  // Addresses Grid
  addressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 40,
  },
  addressCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 2,
  },
  clientName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 9,
    color: '#475569',
  },

  // Compact Table
  tableContainer: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 6,
  },
  th: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    alignItems: 'flex-start',
  },
  // Column Widths
  colDesc: { flex: 4, paddingRight: 10 },
  colQty: { width: 50, textAlign: 'center' },
  colRate: { width: 80, textAlign: 'right' },
  colTotal: { width: 80, textAlign: 'right' },

  itemName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  itemDesc: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  cellText: {
    fontSize: 9,
    color: '#334155',
  },

  // Bottom Section: Notes (Left) + Totals (Right)
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#f8fafc',
  },
  notesArea: {
    flex: 2,
    paddingRight: 40,
  },
  totalsArea: {
    flex: 1,
  },
  
  noteTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 8,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 1.4,
  },

  // Totals Rows
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  grandTotalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },

  // Footer / Signature
  footer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureBox: {
    alignItems: 'flex-start',
  },
  signatureImg: {
    height: 35,
    width: 100,
    objectFit: 'contain',
    marginBottom: 2,
  },
  signatureLine: {
    width: 120,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 4,
  },
  sigText: {
    fontSize: 7,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  thankYouMsg: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#cbd5e1',
  },

  // Custom Fields specific styling
  cfRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  cfLabel: {
    fontSize: 9,
    color: '#64748b',
    width: 65,
  },
  cfValue: {
    fontSize: 9,
    color: '#334155',
    flex: 1,
  },
});

export default function InvoicePDF({ data }: InvoicePDFProps) {
  const currencySymbol = getCurrencySymbol(data.currency);
  const themeColor = data.themeColor || '#111827'; // Default to dark/black if undefined

  return (
    <Document
      title={`Invoice-${data.invoiceNumber}`}
      author={data.businessName}
      creator="FreelancerAI"
    >
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.headerSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {data.businessLogo && (
              <View style={styles.logoContainer}>
                <Image src={data.businessLogo} style={styles.logo} />
              </View>
            )}
            <View>
              <Text style={styles.businessName}>{data.businessName || 'Business Name'}</Text>
              {data.businessAddress && (
                <Text style={[styles.addressText, { maxWidth: 200 }]}>{data.businessAddress}</Text>
              )}
               {data.businessCustomFields.map((field) => (
                <View key={field.id} style={styles.cfRow}>
                  <Text style={styles.cfLabel}>{field.label}:</Text>
                  <Text style={styles.cfValue}>{field.value}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.headerLabel}>INVOICE</Text>
        </View>

        {/* META DATA BAR - Horizontal Strip */}
        <View style={[styles.metaBar, { borderLeftColor: themeColor }]}>
          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Invoice No.</Text>
            <Text style={styles.metaValue}>#{data.invoiceNumber}</Text>
          </View>
          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Date Issued</Text>
            <Text style={styles.metaValue}>
              {new Date(data.invoiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>
              {new Date(data.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <View style={[styles.metaGroup, { alignItems: 'flex-end' }]}>
            <Text style={styles.metaLabel}>Amount Due</Text>
            <Text style={[styles.metaValue, { color: themeColor, fontSize: 11 }]}>
              {currencySymbol}{data.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* ADDRESSES - Clean 2 Col */}
        <View style={styles.addressGrid}>
          <View style={styles.addressCol}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.clientName}>{data.clientName || 'Client Name'}</Text>
            {data.clientAddress && (
              <Text style={styles.addressText}>{data.clientAddress}</Text>
            )}
             {data.clientCustomFields.map((field) => (
                <View key={field.id} style={styles.cfRow}>
                  <Text style={styles.cfLabel}>{field.label}:</Text>
                  <Text style={styles.cfValue}>{field.value}</Text>
                </View>
              ))}
          </View>
          {/* Right column could be used for specific shipping info or extra details if needed, 
              but for now we keep it clean or put "Payment Terms" here? */}
          <View style={styles.addressCol}>
             {data.paymentTerms && (
               <View>
                 <Text style={styles.sectionTitle}>Payment Terms</Text>
                 <Text style={styles.addressText}>{data.paymentTerms}</Text>
               </View>
             )}
          </View>
        </View>

        {/* TABLE */}
        <View style={styles.tableContainer}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colRate]}>Rate</Text>
            <Text style={[styles.th, styles.colTotal]}>Amount</Text>
          </View>

          {/* Body */}
          {data.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
              </View>
              <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.cellText, styles.colRate]}>{currencySymbol}{item.rate.toFixed(2)}</Text>
              <Text style={[styles.cellText, styles.colTotal]}>{currencySymbol}{item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* BOTTOM SECTION: NOTES + TOTALS */}
        <View style={styles.bottomSection}>
          {/* Left: Notes & Terms */}
          <View style={styles.notesArea}>
            {(data.notes || data.terms || data.paymentCustomFields.length > 0) && (
              <View>
                {data.notes && (
                  <View>
                    <Text style={styles.noteTitle}>Notes</Text>
                    <Text style={styles.noteText}>{data.notes}</Text>
                  </View>
                )}
                 {data.terms && (
                  <View>
                    <Text style={styles.noteTitle}>Terms & Conditions</Text>
                    <Text style={styles.noteText}>{data.terms}</Text>
                  </View>
                )}
                 {data.paymentCustomFields.map((field) => (
                    <View key={field.id} style={styles.cfRow}>
                      <Text style={[styles.cfLabel, { fontSize: 8 }]}>{field.label}:</Text>
                      <Text style={[styles.cfValue, { fontSize: 8 }]}>{field.value}</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>

          {/* Right: Totals */}
          <View style={styles.totalsArea}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{currencySymbol}{data.subtotal.toFixed(2)}</Text>
            </View>
            
            {data.billingDetails.map((detail) => {
              const amount = detail.type === 'percentage'
                ? (data.subtotal * detail.value) / 100
                : detail.value;
              const displayValue = detail.type === 'percentage'
                ? `(${detail.value}%)`
                : '';
              return (
                <View key={detail.id} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{detail.label} {displayValue}</Text>
                  <Text style={styles.summaryValue}>
                    {amount >= 0 ? '' : '-'}{currencySymbol}{Math.abs(amount).toFixed(2)}
                  </Text>
                </View>
              );
            })}

            <View style={styles.grandTotal}>
              <Text style={styles.grandTotalLabel}>Total Due</Text>
              <Text style={[styles.grandTotalValue, { color: themeColor }]}>
                {currencySymbol}{data.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* FOOTER / SIGNATURE */}
        <View style={styles.footer}>
           <View style={styles.signatureBox}>
             {data.businessSignature && (
               <Image src={data.businessSignature} style={styles.signatureImg} />
             )}
             {(data.businessSignature) && (
               <View style={styles.signatureLine}>
                 <Text style={styles.sigText}>Authorized Signature</Text>
               </View>
             )}
           </View>
           <Text style={styles.thankYouMsg}>Thank you for your business</Text>
        </View>

      </Page>
    </Document>
  );
}
