export interface ParsedOrder {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  sourceName: string;
  orderDate: string;
  orderTime: string;
  className: string;
  quantity: number;
  price: number;
  lineItemSubtotal: number;
  orderSubTotal: number;
  orderTaxAmount: number;
  orderTotalAmount: number;
}

export function parseCSVData(csvText: string, filterCity?: 'dc' | 'atlanta'): ParsedOrder[] {
  const lines = csvText.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  
  console.log('CSV Headers:', headers);
  
  // Find column indices
  const getColumnIndex = (header: string) => {
    const index = headers.findIndex(h => h.toLowerCase().includes(header.toLowerCase()));
    if (index === -1) {
      throw new Error(`Column "${header}" not found in CSV`);
    }
    return index;
  };

  const indices = {
    orderId: getColumnIndex('Internal order id'),
    customerName: getColumnIndex('Customer name'),
    customerEmail: getColumnIndex('Customer email'),
    customerPhone: getColumnIndex('Customer phone'),
    status: getColumnIndex('Status'),
    sourceName: getColumnIndex('Source name'),
    orderDate: getColumnIndex('Order date'),
    orderTime: getColumnIndex('Order time'),
    className: getColumnIndex('Line item Name'),
    quantity: getColumnIndex('Line item Quantity'),
    price: getColumnIndex('Line item Price'),
    lineItemSubtotal: getColumnIndex('Line item Subtotal'),
    orderSubTotal: getColumnIndex('Sub total'),
    orderTaxAmount: getColumnIndex('Tax Amount'),
    orderTotalAmount: getColumnIndex('Total Amount')
  };

  // Determine which source to filter for
  const targetSource = filterCity 
    ? `Ebony Fit Weekend - ${filterCity === 'dc' ? 'DC' : 'Atlanta'}`
    : null;

  // First pass: identify all valid order IDs for the correct city
  const validOrderIds = new Set<string>();
  const orderTotals = new Map<string, {
    orderSubTotal: number;
    orderTaxAmount: number;
    orderTotalAmount: number;
    sourceName: string;
  }>();
  
  console.log('Starting first pass - looking for valid orders...');
  if (targetSource) {
    console.log(`Filtering for source: "${targetSource}"`);
  }
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    // Skip empty lines or lines with insufficient data
    if (values.length < Math.max(...Object.values(indices)) + 1) continue;
    
    const orderId = values[indices.orderId]?.trim() || '';
    const sourceName = values[indices.sourceName]?.trim() || '';
    const status = values[indices.status]?.trim() || '';
    
    // Debug logging for first few rows
    if (i <= 5) {
      console.log(`Row ${i}: OrderID="${orderId}", Source="${sourceName}", Status="${status}"`);
    }
    
    // Only process rows that have an order ID and source name
    if (!orderId || !sourceName) continue;
    
    // For debugging - log all unique source names we encounter
    if (i <= 20) {
      console.log(`Source found: "${sourceName}"`);
    }
    
    // Check for valid city sources
    const isValidSource = targetSource ? sourceName === targetSource : 
      (sourceName === 'Ebony Fit Weekend - DC' || sourceName === 'Ebony Fit Weekend - Atlanta');
    
    if (isValidSource && status.toLowerCase() === 'completed' && orderId) {
      console.log(`Valid order found: ${orderId} for ${sourceName}`);
      validOrderIds.add(orderId);
      
      // Store order-level totals
      if (!orderTotals.has(orderId)) {
        orderTotals.set(orderId, {
          orderSubTotal: parseFloat(values[indices.orderSubTotal]?.replace(/[^0-9.-]/g, '') || '0'),
          orderTaxAmount: parseFloat(values[indices.orderTaxAmount]?.replace(/[^0-9.-]/g, '') || '0'),
          orderTotalAmount: parseFloat(values[indices.orderTotalAmount]?.replace(/[^0-9.-]/g, '') || '0'),
          sourceName: sourceName
        });
      }
    }
  }

  console.log(`Found ${validOrderIds.size} valid orders`);
  console.log('Valid order IDs:', Array.from(validOrderIds).slice(0, 10));

  // Second pass: collect all line items for valid orders
  const orders: ParsedOrder[] = [];
  
  console.log('Starting second pass - collecting line items...');
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    // Skip empty lines or lines with insufficient data
    if (values.length < Math.max(...Object.values(indices)) + 1) continue;
    
    const orderId = values[indices.orderId]?.trim() || '';
    
    // Only process line items that belong to valid orders
    if (!orderId || !validOrderIds.has(orderId)) continue;
    
    const className = values[indices.className]?.trim() || '';
    if (!className) continue;

    // Get the source name from our stored order data
    const orderData = orderTotals.get(orderId);
    if (!orderData) {
      if (i <= 10) {
        console.log(`Skipping line item for order ${orderId} - not in valid orders`);
      }
      continue;
    }
    
    // Debug logging for first few processed items
    if (orders.length < 5) {
      console.log(`Processing line item: ${className} for order ${orderId} with source ${orderData.sourceName}`);
    }
    
    // For multi-item orders, customer data might be blank on continuation lines
    let customerName = values[indices.customerName]?.trim() || '';
    let customerEmail = values[indices.customerEmail]?.trim() || '';
    let customerPhone = values[indices.customerPhone]?.trim() || '';
    let status = values[indices.status]?.trim() || '';
    let sourceName = values[indices.sourceName]?.trim() || orderData.sourceName;
    let orderDate = values[indices.orderDate]?.trim() || '';
    let orderTime = values[indices.orderTime]?.trim() || '';
    
    // If customer data is missing, find it from the main order line
    if (!customerName || !customerEmail) {
      for (let j = 1; j < lines.length; j++) {
        const mainValues = parseCSVLine(lines[j]);
        if (mainValues.length < Math.max(...Object.values(indices)) + 1) continue;
        
        const mainOrderId = mainValues[indices.orderId]?.trim() || '';
        const mainCustomerName = mainValues[indices.customerName]?.trim() || '';
        
        if (mainOrderId === orderId && mainCustomerName) {
          customerName = mainCustomerName;
          customerEmail = mainValues[indices.customerEmail]?.trim() || customerEmail;
          customerPhone = mainValues[indices.customerPhone]?.trim() || '';
          status = mainValues[indices.status]?.trim() || '';
          orderDate = mainValues[indices.orderDate]?.trim() || '';
          orderTime = mainValues[indices.orderTime]?.trim() || '';
          break;
        }
      }
    }
    
    // Skip if we still don't have essential customer data
    if (!customerName || !customerEmail) continue;
    
    const order: ParsedOrder = {
      orderId: orderId,
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      status: status,
      sourceName: orderData.sourceName,
      orderDate: orderDate,
      orderTime: orderTime,
      className: cleanClassName(className),
      quantity: parseInt(values[indices.quantity] || '0', 10),
      price: parseFloat(values[indices.price]?.replace(/[^0-9.-]/g, '') || '0'),
      lineItemSubtotal: parseFloat(values[indices.lineItemSubtotal]?.replace(/[^0-9.-]/g, '') || '0'),
      orderSubTotal: orderData.orderSubTotal,
      orderTaxAmount: orderData.orderTaxAmount,
      orderTotalAmount: orderData.orderTotalAmount
    };

    orders.push(order);
  }

  console.log(`Final parsed orders: ${orders.length}`);
  console.log('Sample classes:', orders.slice(0, 5).map(o => o.className));
  console.log('Sample sources:', orders.slice(0, 5).map(o => o.sourceName));

  return orders;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}

function cleanClassName(className: string): string {
  // Remove "@ 24" or similar patterns
  let cleaned = className.replace(/\s*@\s*\d+\s*$/, '');
  
  // Handle duplicate names with various patterns
  const parts = cleaned.split(' - ');
  if (parts.length === 2 && parts[0].trim().toLowerCase() === parts[1].trim().toLowerCase()) {
    // Simple duplicates like "ONLY YAMS - ONLY YAMS" or "TRAP MOBILITY - Trap Mobility"
    cleaned = parts[0].trim();
  } else if (parts.length === 4) {
    // Complex duplicates like "PILATES - TIGHT & TONE - PILATES - TIGHT & TONE"
    const firstHalf = parts[0].trim() + ' - ' + parts[1].trim();
    const secondHalf = parts[2].trim() + ' - ' + parts[3].trim();
    if (firstHalf.toLowerCase() === secondHalf.toLowerCase()) {
      cleaned = firstHalf;
    }
  }
  
  return cleaned.trim();
}