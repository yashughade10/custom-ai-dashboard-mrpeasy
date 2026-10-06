import { BWE_LOGO_BASE64 } from './bweLogo';

export const addBWEHeader = (doc: any, isLandscape: boolean = false) => {
  // Page width
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header Logo (Left)
  // Approximate logo dimensions: adjust w/h based on aspect ratio
  const logoWidth = 60;
  const logoHeight = (logoWidth * 163) / 300; // rough aspect ratio
  doc.addImage(BWE_LOGO_BASE64, 'PNG', 14, 10, logoWidth, logoHeight);

  // Header Text (Right)
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  const rightAlignX = pageWidth - 14;
  
  const textLines = [
    "Blue Water Engineering Group Pty Ltd",
    "32 Jade Dr",
    "MOLENDINAR QLD 4214",
    "Opening Hours",
    "Monday-Thursday 7.00-4.00",
    "Fri 7.00 - 2.30",
    "ABN 40692516331",
    "admin@bweng.com.au",
    "61 755971244"
  ];
  
  let currentY = 12;
  textLines.forEach((line) => {
    doc.text(line, rightAlignX, currentY, { align: "right" });
    currentY += 4.5;
  });

  // Return the Y coordinate where the rest of the document can safely start
  return Math.max(10 + logoHeight, currentY) + 10;
};
