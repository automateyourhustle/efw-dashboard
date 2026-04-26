#!/usr/bin/env node
/**
 * EFW Dashboard — local CSV upload script
 *
 * Usage:
 *   node scripts/upload-to-dashboard.js <path-to-csv> [city] [endpoint-url]
 *
 * Examples:
 *   node scripts/upload-to-dashboard.js ./orders.csv
 *   node scripts/upload-to-dashboard.js ./orders.csv "Houston 2026"
 *   node scripts/upload-to-dashboard.js ./orders.csv "Atlanta 2026" https://efw-dashboard.vercel.app/api/upload-orders
 *
 * Environment variables (optional):
 *   UPLOAD_SECRET  — bearer token if you set one in Vercel dashboard
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const [,, csvPath, city = 'Houston 2026', endpoint = 'https://efw-dashboard.vercel.app/api/upload-orders'] = process.argv;

if (!csvPath) {
  console.error('Usage: node scripts/upload-to-dashboard.js <path-to-csv> [city] [endpoint-url]');
  process.exit(1);
}

const uploadSecret = process.env.UPLOAD_SECRET || '';

try {
  console.log(`Reading CSV: ${csvPath}`);
  const csv_content = readFileSync(resolve(csvPath), 'utf8');
  const order_count = csv_content.trim().split('\n').length - 1;

  console.log(`Found ${order_count} data rows. Uploading to "${city}"...`);
  console.log(`Endpoint: ${endpoint}`);

  const headers = { 'Content-Type': 'application/json' };
  if (uploadSecret) {
    headers['Authorization'] = `Bearer ${uploadSecret}`;
  }

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ csv_content, city }),
  });

  const result = await resp.json();

  if (resp.ok) {
    console.log(`\n✅ Success: ${result.message}`);
    console.log(`   City: ${result.city}`);
    console.log(`   Orders uploaded: ${result.order_count}`);
  } else {
    console.error(`\n❌ Error (${resp.status}): ${result.error}`);
    process.exit(1);
  }
} catch (err) {
  console.error(`\n❌ Fatal error: ${err.message}`);
  process.exit(1);
}
