import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInternalPdf = (poData: any) => {
  const { order, items } = poData;
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(`Purchase order ${order.po_number || ''}`, 14, 22);
  
  // Metadata
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  
  // Column 1
  doc.text("Number:", 14, 40);
  doc.text("Vendor:", 14, 46);
  doc.text("Number:", 14, 52);
  doc.text("Status:", 14, 58);
  doc.text("Created:", 14, 64);
  doc.text("Created by:", 14, 70);
  doc.text("Expected date:", 14, 76);
  
  doc.setFont("helvetica", "normal");
  doc.text(order.po_number || '', 45, 40);
  doc.text(order.vendor_name || '', 45, 46);
  doc.text(order.vendor_number || '', 45, 52);
  doc.text(order.status || '', 45, 58);
  doc.text(formatDate(order.created_date), 45, 64);
  doc.text(order.created_by || 'Admin', 45, 70);
  doc.text(formatDate(order.expected_date), 45, 76);

  // Column 2
  doc.setFont("helvetica", "bold");
  doc.text("Order ID:", 110, 40);
  doc.text("Order date:", 110, 46);
  doc.text("Invoice ID:", 110, 52);
  doc.text("Invoice date:", 110, 58);
  doc.text("Due date:", 110, 64);
  doc.text("Shipped on:", 110, 70);
  doc.text("Arrival date:", 110, 76);
  
  doc.setFont("helvetica", "normal");
  doc.text(order.order_id || '', 140, 40);
  doc.text(formatDate(order.order_date), 140, 46);
  doc.text(order.invoice_id || '', 140, 52);
  doc.text(formatDate(order.invoice_date), 140, 58);
  doc.text(formatDate(order.due_date), 140, 64);
  doc.text(formatDate(order.shipped_on), 140, 70);
  doc.text(formatDate(order.arrival_date), 140, 76);

  // Table
  const tableData = (items || []).map((item: any, index: number) => [
    index + 1,
    item.part_no || item.item_id || '',
    item.description || item.part_description || item.free_text || '',
    item.vendor_part_no || '',
    item.quantity || item.expected_quantity || '',
    `${order.currency || '$'} ${formatCurrency(item.price)}`,
    `${order.currency || '$'} ${formatCurrency(item.subtotal)}`,
    '' // Target lot placeholder
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['', 'Part #', 'Part description', 'Vendor part no.', 'Quantity', 'Price', 'Subtotal', 'Target lot']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 10 } }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Totals
  const total = calculateTotal(items);
  const tax = total * 0.1; // 10% tax mock
  const grandTotal = total + tax;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Total:", 14, finalY);
  doc.text(`${order.currency || '$'} ${formatCurrency(total)}`, 160, finalY);
  
  doc.setFillColor(230, 230, 230);
  doc.rect(14, finalY + 2, 182, 6, 'F');
  doc.text("Taxable fees:", 16, finalY + 6.5);
  doc.text(`${order.currency || '$'} 0.00`, 160, finalY + 6.5);
  
  doc.text("Tax:", 16, finalY + 12.5);
  doc.setFont("helvetica", "normal");
  doc.text("10%", 100, finalY + 12.5);
  doc.setFont("helvetica", "bold");
  doc.text(`${order.currency || '$'} ${formatCurrency(tax)}`, 160, finalY + 12.5);
  
  doc.rect(14, finalY + 16, 182, 6, 'F');
  doc.text("Additional fees:", 16, finalY + 20.5);
  doc.text(`${order.currency || '$'} 0.00`, 160, finalY + 20.5);

  doc.text("Grand total:", 16, finalY + 28);
  doc.text(`${order.currency || '$'} ${formatCurrency(grandTotal)}`, 160, finalY + 28);

  doc.save(`PO_${order.po_number}_Internal.pdf`);
};

export const generateVendorPdf = (poData: any) => {
  const { order, items } = poData;
  const doc = new jsPDF();
  
  // Logos Placeholder (Right aligned)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(50, 150, 50);
  doc.text("PIPEBOSS", 100, 20);
  doc.setTextColor(200, 150, 0);
  doc.text("VacLift", 135, 20);
  doc.setTextColor(0, 100, 200);
  doc.text("BWE", 170, 20);
  
  doc.setTextColor(0, 0, 0);
  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Purchase order ${order.po_number || ''}`, 14, 40);
  
  // Metadata
  doc.setFontSize(8);
  
  // Vendor Info
  doc.setFont("helvetica", "bold");
  doc.text("Vendor:", 14, 55);
  doc.text("Number:", 14, 60);
  doc.text("Address:", 14, 65);
  doc.text("Phone:", 14, 75);
  doc.text("E-mail:", 14, 80);
  doc.text("Order date:", 14, 85);
  doc.text("Order ID:", 14, 90);
  doc.text("Invoice ID:", 14, 95);
  doc.text("Expected date:", 14, 100);

  doc.setFont("helvetica", "normal");
  doc.text(order.vendor_name || '', 40, 55);
  doc.text(order.vendor_number || '', 40, 60);
  doc.text("56 Business St\nYATALA QLD 4207\nAustralia", 40, 65);
  doc.text("0733029 500", 40, 75);
  doc.text("stephenm@midwaymetals.com.au", 40, 80);
  doc.text(formatDate(order.order_date), 40, 85);
  doc.text(order.order_id || '', 40, 90);
  doc.text(order.invoice_id || '', 40, 95);
  doc.text(formatDate(order.expected_date), 40, 100);

  // Buyer Info
  doc.setFont("helvetica", "bold");
  doc.text("Attention:", 110, 55);
  doc.text("Buyer:", 110, 60);
  doc.text("Address:", 110, 65);
  doc.text("Phone:", 110, 75);
  doc.text("Website:", 110, 80);
  doc.text("E-mail:", 110, 85);
  doc.text("Payment details:", 110, 90);
  doc.text("B.W.E. Job ID:", 110, 115);

  doc.setFont("helvetica", "normal");
  doc.text(order.attention || 'DERRYN F', 140, 55);
  doc.text("Blue Water Engineering Group Pty Ltd", 140, 60);
  doc.text("32 JADE DRIVE, MOLENDINAR QLD 4214\nAUSTRALIA", 140, 65);
  doc.text("+61 7 5597 0511", 140, 75);
  doc.text("www.bluewaterengineering.com.au", 140, 80);
  doc.text("admin@bweng.com.au", 140, 85);
  doc.text("BLUE WATER ENGINEERING GROUP Pty\nLtd\nNOTE NEW BANK ACCOUNT DETAILS\nCOMMONWEALTH BANK\nBSB: 067-873\nACCOUNT: 20859684\nUSE INVOICE NO. AS REFERENCE", 140, 90);
  doc.text(order.bwe_job_id || 'JET', 140, 115);

  // Table
  const tableData = (items || []).map((item: any, index: number) => [
    index + 1,
    item.part_no || item.item_id || '',
    item.description || item.part_description || item.free_text || '',
    item.vendor_part_no || '',
    item.quantity || item.expected_quantity || '',
    `${order.currency || '$'} ${formatCurrency(item.price)}`,
    `${order.currency || '$'} ${formatCurrency(item.subtotal)}`
  ]);

  autoTable(doc, {
    startY: 125,
    head: [['', 'Part #', 'Part description', 'Vendor part no.', 'Quantity', 'Price', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 10 } }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 5;
  const total = calculateTotal(items);
  const tax = total * 0.1; 
  const grandTotal = total + tax;

  doc.setFont("helvetica", "bold");
  doc.text("Total:", 14, finalY + 5);
  doc.text(`${order.currency || '$'} ${formatCurrency(total)}`, 160, finalY + 5);
  
  doc.text("Tax:", 14, finalY + 10);
  doc.setFont("helvetica", "normal");
  doc.text("10%", 100, finalY + 10);
  doc.setFont("helvetica", "bold");
  doc.text(`${order.currency || '$'} ${formatCurrency(tax)}`, 160, finalY + 10);
  
  doc.text("Grand total:", 14, finalY + 15);
  doc.text(`${order.currency || '$'} ${formatCurrency(grandTotal)}`, 160, finalY + 15);

  doc.save(`PO_${order.po_number}_Vendor.pdf`);
};

export const generateDeliveryNotePdf = (poData: any) => {
  const { order, items } = poData;
  const doc = new jsPDF();
  
  // Logos Placeholder (Right aligned)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(50, 150, 50);
  doc.text("PIPEBOSS", 100, 20);
  doc.setTextColor(200, 150, 0);
  doc.text("VacLift", 135, 20);
  doc.setTextColor(0, 100, 200);
  doc.text("BWE", 170, 20);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Delivery note PO${order.po_number || ''}`, 14, 40);
  
  doc.setFontSize(8);
  
  // Vendor Info
  doc.setFont("helvetica", "bold");
  doc.text("Vendor:", 14, 55);
  doc.text("Address:", 14, 60);
  doc.text("Phone:", 14, 70);
  doc.text("E-mail:", 14, 75);

  doc.setFont("helvetica", "normal");
  doc.text(order.vendor_name || '', 40, 55);
  doc.text("56 Business St\nYATALA QLD 4207\nAustralia", 40, 60);
  doc.text("0733029 500", 40, 70);
  doc.text("stephenm@midwaymetals.com.au", 40, 75);

  // Buyer Info
  doc.setFont("helvetica", "bold");
  doc.text("Buyer:", 110, 55);
  doc.text("Shipping address:", 110, 60);
  doc.text("Phone:", 110, 70);
  doc.text("Website:", 110, 75);
  doc.text("E-mail:", 110, 80);

  doc.setFont("helvetica", "normal");
  doc.text("Blue Water Engineering Group Pty Ltd", 140, 55);
  doc.text("32 JADE DRIVE, MOLENDINAR QLD 4214\nAUSTRALIA", 140, 60);
  doc.text("+61 7 5597 0511", 140, 70);
  doc.text("www.bluewaterengineering.com.au", 140, 75);
  doc.text("admin@bweng.com.au", 140, 80);

  // Table
  const tableData = (items || []).map((item: any) => [
    item.part_no || item.item_id || '',
    item.description || item.part_description || item.free_text || '',
    item.vendor_part_no || '',
    item.quantity || item.expected_quantity || '',
    formatDate(item.arrival_date || order.expected_date)
  ]);

  autoTable(doc, {
    startY: 90,
    head: [['Part #', 'Part description', 'Vendor part no.', 'Quantity', 'Arrival date']],
    body: tableData,
    theme: 'plain',
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.1, lineColor: 200 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;

  doc.text("Loaded by:", 14, finalY);
  doc.line(40, finalY + 1, 90, finalY + 1);

  doc.text("Received by:", 110, finalY);
  doc.line(140, finalY + 1, 190, finalY + 1);

  doc.text("Driver:", 14, finalY + 15);
  doc.line(40, finalY + 16, 90, finalY + 16);

  doc.text("Date:", 14, finalY + 30);
  doc.line(40, finalY + 31, 90, finalY + 31);

  doc.text("Signature:", 14, finalY + 45);
  doc.line(40, finalY + 46, 90, finalY + 46);

  doc.save(`DeliveryNote_${order.po_number}.pdf`);
};

export const generateRfqPdf = (poData: any) => {
  const { order, items } = poData;
  const doc = new jsPDF();
  
  // Logos
  doc.setFontSize(14);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(50, 150, 50);
  doc.text("PIPEBOSS", 100, 20);
  doc.setTextColor(200, 150, 0);
  doc.text("VacLift", 135, 20);
  doc.setTextColor(0, 100, 200);
  doc.text("BWE", 170, 20);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Request for Quote ${order.po_number || ''}`, 14, 40);
  
  // Metadata
  doc.setFontSize(8);
  
  // Vendor Info
  doc.setFont("helvetica", "bold");
  doc.text("Vendor:", 14, 55);
  doc.text("Number:", 14, 60);
  doc.text("Address:", 14, 65);
  doc.text("Phone:", 14, 75);
  doc.text("E-mail:", 14, 80);
  doc.text("Order date:", 14, 85);
  doc.text("Order ID:", 14, 90);
  doc.text("Invoice ID:", 14, 95);
  doc.text("Expected date:", 14, 100);

  doc.setFont("helvetica", "normal");
  doc.text(order.vendor_name || '', 40, 55);
  doc.text(order.vendor_number || '', 40, 60);
  doc.text("56 Business St\nYATALA QLD 4207\nAustralia", 40, 65);
  doc.text("0733029 500", 40, 75);
  doc.text("stephenm@midwaymetals.com.au", 40, 80);
  doc.text(formatDate(order.order_date), 40, 85);
  doc.text(order.order_id || '', 40, 90);
  doc.text(order.invoice_id || '', 40, 95);
  doc.text(formatDate(order.expected_date), 40, 100);

  // Buyer Info
  doc.setFont("helvetica", "bold");
  doc.text("Attention:", 110, 55);
  doc.text("Buyer:", 110, 60);
  doc.text("Address:", 110, 65);
  doc.text("Phone:", 110, 75);
  doc.text("Website:", 110, 80);
  doc.text("E-mail:", 110, 85);
  doc.text("Payment details:", 110, 90);
  doc.text("B.W.E. Job ID:", 110, 115);

  doc.setFont("helvetica", "normal");
  doc.text(order.attention || 'DERRYN F', 140, 55);
  doc.text("Blue Water Engineering Group Pty Ltd", 140, 60);
  doc.text("32 JADE DRIVE, MOLENDINAR QLD 4214\nAUSTRALIA", 140, 65);
  doc.text("+61 7 5597 0511", 140, 75);
  doc.text("www.bluewaterengineering.com.au", 140, 80);
  doc.text("admin@bweng.com.au", 140, 85);
  doc.text("BLUE WATER ENGINEERING GROUP Pty\nLtd\nNOTE NEW BANK ACCOUNT DETAILS\nCOMMONWEALTH BANK\nBSB: 067-873\nACCOUNT: 20859684\nUSE INVOICE NO. AS REFERENCE", 140, 90);
  doc.text(order.bwe_job_id || 'JET', 140, 115);

  // Table (No prices)
  const tableData = (items || []).map((item: any, index: number) => [
    index + 1,
    item.part_no || item.item_id || '',
    item.description || item.part_description || item.free_text || '',
    item.vendor_part_no || '',
    item.quantity || item.expected_quantity || ''
  ]);

  autoTable(doc, {
    startY: 125,
    head: [['', 'Part #', 'Part description', 'Vendor part no.', 'Quantity']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 10 } }
  });

  doc.save(`RFQ_${order.po_number}.pdf`);
};

// Utils
const formatDate = (d: string | null) => {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return d;
  }
};

const formatCurrency = (val: any) => {
  const num = parseFloat(val);
  if (isNaN(num)) return "0.00";
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

const calculateTotal = (items: any[]) => {
  if (!items) return 0;
  return items.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.subtotal) || 0);
  }, 0);
};

export const generateLabelsPdf = (items: any[], order: any, labelCountOverride?: number) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [100, 50]
  });

  let isFirstPage = true;

  items.forEach((item: any) => {
    const qtyNum = parseFloat(item.quantity || item.expected_quantity);
    const labelCount = labelCountOverride !== undefined 
      ? labelCountOverride 
      : (isNaN(qtyNum) ? 1 : Math.max(1, Math.ceil(qtyNum)));

    for (let i = 0; i < labelCount; i++) {
      if (!isFirstPage) {
        doc.addPage([100, 50], 'landscape');
      }
      isFirstPage = false;

      // Draw border
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(2, 2, 96, 46);

      // Header
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Blue Water Engineering Group Pty Ltd", 4, 7);
      
      // Line 1
      doc.line(2, 9, 98, 9);
      
      // Lot & Printed
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Lot:", 4, 12);
      doc.text("Printed:", 65, 12);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(item.target_lot || item.lot || '', 4, 16);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(new Date().toISOString()), 65, 16);
      
      // Vertical divider
      doc.line(63, 9, 63, 25);
      
      // Line 2
      doc.line(2, 18, 98, 18);
      
      // Part No & Quantity
      doc.setFontSize(7);
      doc.text("Part No.:", 4, 21);
      doc.text("Quantity:", 65, 21);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(item.part_no || item.item_id || '', 4, 25);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${item.quantity || item.expected_quantity || ''} ${item.uom || item.unit || ''}`.trim(), 65, 25);
      
      // Line 3
      doc.line(2, 27, 98, 27);
      
      // Description
      doc.setFontSize(7);
      doc.text("Part description:", 4, 31);
      
      doc.setFontSize(8);
      const desc = item.description || item.part_description || item.free_text || '';
      const splitDesc = doc.splitTextToSize(desc, 90);
      doc.text(splitDesc, 8, 36);
    }
  });

  doc.save(`Labels_${order.po_number || 'PO'}.pdf`);
};
