import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          if (val === null || val === undefined) return "";
          // Escape quotes and wrap in quotes if there's a comma
          const stringVal = String(val).replace(/"/g, '""');
          return `"${stringVal}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToPDF = (
  data: any[],
  columns: { header: string; dataKey: string }[],
  filename: string,
  title: string
) => {
  if (!data || data.length === 0) return;

  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 22);

  // Table
  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: data.map((row) => columns.map((c) => row[c.dataKey] || "")),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }, // blue-500
  });

  doc.save(`${filename}.pdf`);
};
