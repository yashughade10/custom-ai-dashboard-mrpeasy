import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const filePath = path.join(process.cwd(), 'procurement_critical_on_hand_20260805.csv');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const result = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    let data = result.data as any[];

    // Normalize keys to match what our frontend expects
    // CSV columns (based on image/standard export):
    // "Part No.","Group number","Group name","Available","Expected available","Reorder point","Part description ","In stock","Vendor number","Vendor name","Vendor part no.","Lead time","Price per UoM","Subtotal","Notes","BWE added value cost.","Buy Price","Supplier 1","S1 Buy price","Vender Part Number","Supplier 2","S2 Buy Price","Vender 2 Part Number","Sell Price"
    data = data.map((row: any) => {
      // Create a normalized row where keys are lowercase and stripped of special characters
      const normalizedRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        normalizedRow[normKey] = value;
      }

      return {
        part_no: normalizedRow['partno'] || row['part_no'] || '',
        group_number: normalizedRow['groupnumber'] || row['group_number'] || '',
        group_name: normalizedRow['groupname'] || row['group_name'] || '',
        available: normalizedRow['available'] || row['available'] || '',
        expected_available: normalizedRow['expectedavailable'] || row['expected_available'] || '',
        reorder_point: normalizedRow['reorderpoint'] || row['reorder_point'] || '',
        part_description: normalizedRow['partdescription'] || row['part_description'] || '',
        in_stock: normalizedRow['instock'] || row['in_stock'] || '',
        vendor_number: normalizedRow['vendornumber'] || row['vendor_number'] || '',
        vendor_name: normalizedRow['vendorname'] || row['vendor_name'] || '',
        vendor_part_no: normalizedRow['vendorpartno'] || row['vendor_part_no'] || '',
        lead_time: normalizedRow['leadtime'] || row['lead_time'] || '',
        price_per_uom: normalizedRow['priceperuom'] || row['price_per_uom'] || '',
        subtotal: normalizedRow['subtotal'] || row['subtotal'] || '',
        notes: normalizedRow['notes'] || row['notes'] || '',
        bwe_added_value_cost: normalizedRow['bweaddedvaluecost'] || row['bwe_added_value_cost'] || '',
        buy_price: normalizedRow['buyprice'] || row['buy_price'] || '',
        supplier_1: normalizedRow['supplier1'] || row['supplier_1'] || '',
        s1_buy_price: normalizedRow['s1buyprice'] || row['s1_buy_price'] || '',
        vender_part_number: normalizedRow['venderpartnumber'] || normalizedRow['vendorpartnumber'] || row['vender_part_number'] || '',
        supplier_2: normalizedRow['supplier2'] || row['supplier_2'] || '',
        s2_buy_price: normalizedRow['s2buyprice'] || row['s2_buy_price'] || '',
        vender_2_part_number: normalizedRow['vender2partnumber'] || normalizedRow['vendor2partnumber'] || row['vender_2_part_number'] || '',
        sell_price: normalizedRow['sellprice'] || row['sell_price'] || ''
      };
    });

    // Apply filters
    const filterKeys = Array.from(searchParams.keys()).filter(k => k !== 'page' && k !== 'limit');
    
    for (const key of filterKeys) {
      const val = searchParams.get(key)?.toLowerCase();
      if (!val) continue;

      if (key.startsWith('min_') || key.startsWith('max_')) {
        const fieldName = key.replace('min_', '').replace('max_', '');
        data = data.filter((row: any) => {
          let rowVal = row[fieldName];
          if (!rowVal) return false;
          // Strip currency symbols and letters (like ' pcs') for comparison
          const numRowVal = parseFloat(rowVal.replace(/[^0-9.-]+/g, ''));
          const numFilterVal = parseFloat(val);
          if (isNaN(numRowVal) || isNaN(numFilterVal)) return true;
          
          if (key.startsWith('min_')) return numRowVal >= numFilterVal;
          if (key.startsWith('max_')) return numRowVal <= numFilterVal;
          return true;
        });
      } else {
        data = data.filter((row: any) => {
          const rowVal = String(row[key] || '').toLowerCase();
          return rowVal.includes(val);
        });
      }
    }

    const total = data.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = data.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error("Error reading CSV:", error);
    return NextResponse.json({ error: error.message, data: [] }, { status: 500 });
  }
}
