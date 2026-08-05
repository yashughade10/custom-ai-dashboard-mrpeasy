export const generateCsvDownload = (poData: any) => {
  const { order, items } = poData;
  if (!items || items.length === 0) return;

  const headers = [
    "Part No.",
    "Part description",
    "Vendor part no.",
    "Quantity",
    "UoM",
    "Price",
    "Subtotal",
    "Target lot",
    "Expected date",
    "Arrival date"
  ];

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

  const rows = items.map((item: any) => {
    // Escape quotes and wrap in quotes for CSV safety
    const escapeCsv = (str: string | undefined | null) => {
      if (!str) return "";
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    return [
      escapeCsv(item.part_no || item.item_id),
      escapeCsv(item.description || item.part_description || item.free_text),
      escapeCsv(item.vendor_part_no),
      escapeCsv(item.quantity || item.expected_quantity),
      escapeCsv(item.uom || 'm²'), // Mock UoM or pull from item if exists
      escapeCsv(item.price),
      escapeCsv(item.subtotal),
      escapeCsv(item.target_lot || ''),
      escapeCsv(formatDate(order.expected_date)),
      escapeCsv(formatDate(item.arrival_date || order.expected_date))
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `PO_${order.po_number || 'export'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
