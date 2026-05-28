import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Quote } from '@/lib/types';
import { AppSettings } from '@/lib/firebase/settings';
import { formatARS, formatQuoteNumber } from './calculations';

// @ts-ignore
import autoTable from 'jspdf-autotable';

export const generateQuotePDF = async (quote: Quote, settings: AppSettings) => {
  const doc = new jsPDF();
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const MARGIN = 20;

  // 1. Header & Logo
  const addHeader = async () => {
    // Attempt to load and add logo
    try {
      const logoUrl = '/logo2Azul.svg';
      const img = new Image();
      img.src = logoUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      const canvas = document.createElement('canvas');
      // Logo original aspect ratio is approx 2:1 (900x450 according to the file)
      canvas.width = 400;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 400, 200);
        const dataUrl = canvas.toDataURL('image/png');
        doc.addImage(dataUrl, 'PNG', MARGIN, 5, 40, 20);
      }
    } catch (e) {
      console.error("Error loading logo for PDF:", e);
      // Fallback: Just the text if logo fails
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(27, 42, 74);
      doc.text('RAN', MARGIN, 25);
    }

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 42, 74);
    doc.text('PRESUPUESTO', PAGE_WIDTH - MARGIN, 35, { align: 'right' });
    
    // Company Info (From Settings)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 42, 74);
    const startY = 40;
    doc.text('RAN PISOS & REVESTIMIENTOS', MARGIN, startY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(settings.contactInfo.address || '', MARGIN, startY + 5);
    doc.text(`WhatsApp: ${settings.contactInfo.phone || ''} | Email: ${settings.contactInfo.email || ''}`, MARGIN, startY + 10);

    // Quote Number & Date (Lower right of header)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 42, 74);
    doc.text(`N°: ${formatQuoteNumber(quote.id || '')}`, PAGE_WIDTH - MARGIN, startY + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    const date = quote.createdAt ? new Date((quote.createdAt as any).seconds ? (quote.createdAt as any).seconds * 1000 : quote.createdAt).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR');
    doc.text(`Fecha: ${date}`, PAGE_WIDTH - MARGIN, startY + 10, { align: 'right' });
  };

  // 2. Client Info
  const addClientInfo = () => {
    doc.setFillColor(248, 250, 252);
    doc.rect(MARGIN, 65, PAGE_WIDTH - (MARGIN * 2), 25, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 244);
    doc.text('DATOS DEL CLIENTE', MARGIN + 5, 72);
    
    doc.setFontSize(11);
    doc.setTextColor(27, 42, 74);
    doc.text(quote.clientName || 'Consumidor Final', MARGIN + 5, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${quote.clientEmail || ''}  |  ${quote.clientPhone || ''}`, MARGIN + 5, 85);
  };

  // EXECUTE HEADER & CLIENT INFO
  await addHeader();
  addClientInfo();

  // 3. Table of Items
  const tableData = quote.items.map(item => [
    item.name,
    item.pricePerM2 ? formatARS(item.pricePerM2) : (item.pricePerBox && item.boxes ? formatARS(item.pricePerBox * item.boxes / item.m2) : '-'),
    (item.pallets || 0).toString(),
    (item.m2 || 0).toFixed(2),
    formatARS(item.subtotal)
  ]);

  autoTable(doc, {
    startY: 100,
    head: [['Nombre', '$ m2', 'Pallets', 'm2 totales', '$ total']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [27, 42, 74], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { halign: 'right', cellWidth: 25 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 35 },
    },
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: MARGIN, right: MARGIN },
    didDrawPage: (data) => {
      // Footer on every page
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        PAGE_WIDTH / 2,
        PAGE_HEIGHT - 10,
        { align: 'center' }
      );
      
      // Horizontal line in footer
      doc.setDrawColor(230, 230, 230);
      doc.line(MARGIN, PAGE_HEIGHT - 15, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 15);
      doc.text('RAN Pisos & Revestimientos - www.ran-app.com', MARGIN, PAGE_HEIGHT - 10);
    }
  });

  // 4. Totals breakdown
  let currentY = (doc as any).lastAutoTable.finalY + 15;

  const materials = quote.totalMaterials || 0;
  const shipping = quote.shipping || 0;
  const discount = quote.discount || 0;
  const discountType = quote.discountType || 'amount';
  const vatRate = quote.vatRate || 0;

  const discountAmount = discount > 0
    ? (discountType === 'percentage' ? materials * discount / 100 : discount)
    : 0;
  const afterDiscount = materials - discountAmount;
  const vatAmount = vatRate > 0 ? (afterDiscount + shipping) * vatRate / 100 : 0;

  const hasBreakdown = discountAmount > 0 || shipping > 0 || vatAmount > 0;

  if (hasBreakdown) {
    const colLabel = MARGIN;
    const colValue = PAGE_WIDTH - MARGIN;
    const lineH = 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal Materiales', colLabel, currentY);
    doc.text(formatARS(materials), colValue, currentY, { align: 'right' });
    currentY += lineH;

    if (discountAmount > 0) {
      const label = discountType === 'percentage'
        ? `Descuento (${discount}%)`
        : 'Descuento';
      doc.setTextColor(180, 50, 50);
      doc.text(label, colLabel, currentY);
      doc.text(`-${formatARS(discountAmount)}`, colValue, currentY, { align: 'right' });
      doc.setTextColor(100, 100, 100);
      currentY += lineH;
    }

    if (shipping > 0) {
      doc.text('Flete', colLabel, currentY);
      doc.text(formatARS(shipping), colValue, currentY, { align: 'right' });
      currentY += lineH;
    }

    if (vatAmount > 0) {
      doc.setTextColor(30, 100, 50);
      doc.text(`IVA (${vatRate}%)`, colLabel, currentY);
      doc.text(formatARS(vatAmount), colValue, currentY, { align: 'right' });
      doc.setTextColor(100, 100, 100);
      currentY += lineH;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(colLabel, currentY + 2, colValue, currentY + 2);
    currentY += 10;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 42, 74);
    doc.text('TOTAL FINAL', colLabel, currentY);
    doc.text(formatARS(quote.grandTotal), colValue, currentY, { align: 'right' });
    currentY += 15;
  } else {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 42, 74);
    doc.text(`TOTAL PRESUPUESTO: ${formatARS(quote.grandTotal)}`, PAGE_WIDTH - MARGIN, currentY, { align: 'right' });
    currentY += 20;
  }

  // 5. PDF Notes (solo si están cargadas)
  if (quote.pdfNotes && quote.pdfNotes.trim()) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    const splitNotes = doc.splitTextToSize(quote.pdfNotes.trim(), PAGE_WIDTH - (MARGIN * 2));
    doc.text(splitNotes, MARGIN, currentY + 5);
  }

  // Download
  doc.save(`Presupuesto_RAN_${(quote.clientName || 'Cliente').replace(/\s/g, '_')}.pdf`);
};
