const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// --- PATHS ---
const redirectsJsonPath = path.join(__dirname, 'src', 'data', 'redirects.json');
const excelFilePath = 'C:\\Users\\nandh\\Downloads\\page with redirect.xlsx';

// 1. Read your existing redirects.json
let redirects = {};
try {
  const rawData = fs.readFileSync(redirectsJsonPath, 'utf8');
  redirects = JSON.parse(rawData);
  console.log(`✅ Loaded ${Object.keys(redirects).length} existing redirects from redirects.json`);
} catch (err) {
  console.error("❌ Error reading existing redirects.json:", err.message);
  process.exit(1);
}

// 2. Read and parse the Excel file
try {
  const workbook = XLSX.readFile(excelFilePath);

  // Use the first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  console.log(`📄 Reading sheet: "${sheetName}"`);

  // Convert to JSON (array of row objects)
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`📊 Found ${rows.length} rows in the Excel file`);

  // Show column headers so user can verify
  if (rows.length > 0) {
    console.log(`📋 Column headers: ${Object.keys(rows[0]).join(' | ')}`);
  }

  // Auto-detect the correct columns
  // Look for columns containing "URL", "Address", "Redirect" etc.
  let oldUrlCol = null;
  let newUrlCol = null;

  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    for (const h of headers) {
      const lower = h.toLowerCase().trim();
      if (!oldUrlCol && (lower.includes('address') || lower === 'url' || lower === 'old url' || lower === 'source')) {
        oldUrlCol = h;
      }
      if (!newUrlCol && (lower.includes('redirect') || lower === 'new url' || lower === 'target' || lower === 'destination')) {
        newUrlCol = h;
      }
    }

    // Fallback: use first and second columns if auto-detect fails
    if (!oldUrlCol) oldUrlCol = headers[0];
    if (!newUrlCol) newUrlCol = headers[1];
  }

  console.log(`🔗 Using columns: Old URL = "${oldUrlCol}" | New URL = "${newUrlCol}"`);

  let addedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    const oldUrl = String(row[oldUrlCol] || '').trim();
    const newUrl = String(row[newUrlCol] || '').trim();

    // Ensure both URLs exist, it's a valid link, and it doesn't redirect to itself
    if (oldUrl && newUrl && oldUrl.startsWith('http') && oldUrl !== newUrl) {
      if (!redirects[oldUrl]) {
        redirects[oldUrl] = newUrl;
        addedCount++;
      } else {
        skippedCount++;
      }
    }
  }

  // 3. Write everything back to redirects.json
  fs.writeFileSync(redirectsJsonPath, JSON.stringify(redirects, null, 2), 'utf8');
  console.log(`\n✅ Success! Merged ${addedCount} new redirects into redirects.json.`);
  console.log(`⏭️  Skipped ${skippedCount} (already existed).`);
  console.log(`📦 Total redirects now: ${Object.keys(redirects).length}`);

} catch (err) {
  console.error("❌ Error processing Excel file:", err.message);
}