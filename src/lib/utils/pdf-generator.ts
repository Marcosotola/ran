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
    item.boxes.toString(),
    item.pricePerBox ? formatARS(item.pricePerBox) : '-',
    formatARS(item.subtotal)
  ]);

  autoTable(doc, {
    startY: 100,
    head: [['Descripción de Producto', 'Cajas', 'Precio x Caja', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [27, 42, 74], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 40 },
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

  // 4. Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 42, 74);
  const totalText = `TOTAL PRESUPUESTO: ${formatARS(quote.grandTotal)}`;
  doc.text(totalText, PAGE_WIDTH - MARGIN, finalY + 10, { align: 'right' });

  // 5. Terms (Optional)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text('Presupuesto sujeto a disponibilidad de stock y cambios de precio sin previo aviso.', MARGIN, finalY + 30);
  doc.text('El material se retira de nuestro showroom previa coordinación.', MARGIN, finalY + 35);

  // Download
  doc.save(`Presupuesto_RAN_${(quote.clientName || 'Cliente').replace(/\s/g, '_')}.pdf`);
};
