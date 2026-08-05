const fs = require('fs');

const csv = fs.readFileSync('requirements_20260805.csv', 'utf8');

// Simple CSV parser
function parseCSVRow(text) {
  let inQuotes = false;
  let currentToken = '';
  const tokens = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i+1] === '"') {
        currentToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      tokens.push(currentToken);
      currentToken = '';
    } else {
      currentToken += char;
    }
  }
  tokens.push(currentToken);
  return tokens;
}

const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
const headers = parseCSVRow(lines[0]);

const data = lines.slice(1).map(line => {
  const values = parseCSVRow(line);
  const obj = {};
  headers.forEach((header, i) => {
    // Map headers to object keys
    const keyMap = {
      "Part No.": "part_no",
      "Part description": "part_description",
      "Group number": "group_number",
      "Group name": "group_name",
      "Source": "source",
      "Quantity": "quantity",
      "Requirement date": "requirement_date",
      "Action date": "action_date",
      "Vendor": "vendor_name",
      "Vendor part no.": "vendor_part_no",
      "Price per UoM": "price_per_uom",
      "Subtotal": "subtotal",
      "Notes": "notes",
      "BWE added value cost": "bwe_added_value_cost",
      "Buy Price": "buy_price",
      "Supplier 1": "supplier_1",
      "S1 Buy price": "s1_buy_price",
      "Vender Part Number": "vender_part_number",
      "Supplier 2": "supplier_2",
      "S2 Buy Price": "s2_buy_price",
      "Vender 2 Part Number": "vender_2_part_number",
      "Sell Price": "sell_price"
    };
    const key = keyMap[header] || header;
    obj[key] = values[i] !== undefined ? values[i] : '';
  });
  return obj;
});

// Ensure directory exists
if (!fs.existsSync('./src/data')) {
  fs.mkdirSync('./src/data');
}

fs.writeFileSync('./src/data/requirementsData.json', JSON.stringify(data, null, 2));
console.log('Successfully converted CSV to JSON!');
