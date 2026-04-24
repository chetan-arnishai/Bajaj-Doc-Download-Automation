// 'use strict';

// const { chromium } = require('playwright');
// const axios        = require('axios');
// const fs           = require('fs');
// const path         = require('path');
    

// const config       = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

// const APP_USERNAME = config.APP_USERNAME;
// const APP_PASSWORD = config.APP_PASSWORD;
// const LOGIN_URL    = config.url;
// const SELECTORS    = config.selectors;
// const BASE_API_URL = config.base_api_url;

// const TOKEN_CAPTURE_TIMEOUT_MS = 120_000;
// const CAPTCHA_WAIT_MS          = 60_000;

// // -------------------------------------------------------
// // LOGIN + TOKEN CAPTURE
// // -------------------------------------------------------
// async function getAccessToken() {
//   const browser = await chromium.launch({ headless: false });
//   const context = await browser.newContext();
//   const page    = await context.newPage();

//   let accessToken = null;

//   const tokenCaptured = new Promise((resolve, reject) => {
//     const timeout = setTimeout(
//       () => reject(new Error('Token capture timed out')),
//       TOKEN_CAPTURE_TIMEOUT_MS
//     );

//     page.on('response', async (response) => {
//       if (!response.url().includes('/openid-connect/token')) return;
//       try {
//         const body = await response.json();
//         if (body.access_token) {
//           accessToken = body.access_token;
//           clearTimeout(timeout);
//           console.log('  [AUTH] Access token captured.');
//           resolve(accessToken);
//         }
//       } catch {}
//     });
//   });

//   await page.goto(LOGIN_URL);
//   await page.fill(SELECTORS.username_input, APP_USERNAME);
//   await page.fill(SELECTORS.password_input, APP_PASSWORD);

//   console.log(`\n  [ACTION REQUIRED] Solve the CAPTCHA. Waiting ${CAPTCHA_WAIT_MS / 1000}s...\n`);
//   await page.waitForTimeout(CAPTCHA_WAIT_MS);

//   await tokenCaptured;
//   await browser.close();

//   return accessToken;
// }

// // -------------------------------------------------------
// // YOUR PDF DOWNLOAD LOGIC GOES HERE
// // Use accessToken + axios to call your PDF APIs
// // -------------------------------------------------------
// async function downloadPdfs(accessToken) {
//   // Example:
//   // const payload = Buffer.from(JSON.stringify({ claimNumber: 'XYZ' })).toString('base64');
//   // const response = await axios.get(`${BASE_API_URL}/your/pdf/endpoint`, {
//   //   params: { payload },
//   //   headers: { Authorization: `Bearer ${accessToken}` },
//   //   responseType: 'arraybuffer', // important for binary PDF data
//   // });
//   // fs.writeFileSync('output.pdf', response.data);
// }

// // -------------------------------------------------------
// // MAIN
// // -------------------------------------------------------
// (async () => {
//   const accessToken = await getAccessToken();
//   console.log(`  Token preview: ${accessToken.substring(0, 20)}...\n`);

//   await downloadPdfs(accessToken);
// })();


/**
 * =========================
 * ==============================
 * =================================
 */


// 'use strict';

// const { chromium } = require('playwright');
// const axios        = require('axios');
// const fs           = require('fs');
// const path         = require('path');



// const config       = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

// const APP_USERNAME = config.APP_USERNAME;
// const APP_PASSWORD = config.APP_PASSWORD;
// const LOGIN_URL    = config.url;
// const SELECTORS    = config.selectors;

// // Two different base URLs — one for listing, one for downloading
// const BASE_API_URL      = config.base_api_url;                          // webapi.bajajallianz.com
// const DOWNLOAD_API_URL  = 'https://ilmsoapapi.bagicprod.bajajallianz.com'; // different host for download

// const TOKEN_CAPTURE_TIMEOUT_MS = 120_000;
// const CAPTCHA_WAIT_MS          = 60_000;


// // -------------------------------------------------------
// // STEP 1 — LOGIN + TOKEN CAPTURE
// // -------------------------------------------------------
// async function getAccessToken() {
//   const browser = await chromium.launch({ headless: false });
//   const context = await browser.newContext();
//   const page    = await context.newPage();

//   let accessToken = null;

//   const tokenCaptured = new Promise((resolve, reject) => {
//     const timeout = setTimeout(
//       () => reject(new Error('Token capture timed out')),
//       TOKEN_CAPTURE_TIMEOUT_MS
//     );

//     page.on('response', async (response) => {
//       if (!response.url().includes('/openid-connect/token')) return;
//       try {
//         const body = await response.json();
//         if (body.access_token) {
//           accessToken = body.access_token;
//           clearTimeout(timeout);
//           console.log('  [AUTH] Access token captured.');
//           resolve(accessToken);
//         }
//       } catch {}
//     });
//   });

//   await page.goto(LOGIN_URL);
//   await page.fill(SELECTORS.username_input, APP_USERNAME);
//   await page.fill(SELECTORS.password_input, APP_PASSWORD);

//   console.log(`\n  [ACTION REQUIRED] Solve the CAPTCHA. Waiting ${CAPTCHA_WAIT_MS / 1000}s...\n`);
//   await page.waitForTimeout(CAPTCHA_WAIT_MS);

//   await tokenCaptured;
//   await browser.close();

//   return accessToken;
// }


// // -------------------------------------------------------
// // STEP 2 — FETCH DOCUMENT LIST FOR A CLAIM
// // GET /ilm/policyclaim/api/getClaimDocList?payload=...
// // -------------------------------------------------------
// async function fetchDocumentList(accessToken, claimNumber) {
//   const payloadObj = { claimNumber, caseType: '' };
//   const payload    = Buffer.from(JSON.stringify(payloadObj)).toString('base64');

//   console.log(`\n  Fetching document list for claim: ${claimNumber}`);

//   try {
//     const response = await axios.get(
//       `${BASE_API_URL}/ilm/policyclaim/api/getClaimDocList`,
//       {
//         params:  { payload },
//         headers: { auth: `Bearer ${accessToken}` },
//       }
//     );

//     const docs = response.data?.responseData || [];
//     console.log(`  [OK] Found ${docs.length} document(s)`);
//     return docs;

//   } catch (err) {
//     console.error('  [ERROR] Failed to fetch document list:', err.response?.data || err.message);
//     return [];
//   }
// }


// // -------------------------------------------------------
// // STEP 3 — DOWNLOAD A SINGLE PDF
// // POST /ilm/document/api/downloadMedia?documentId=...&externalId=&docType=VIEWPOLICYCLAIM
// // Body: { documentId, externalId, docType, policyNumber, claimType, docName }
// // -------------------------------------------------------
// async function downloadPdf(accessToken, doc, outputDir) {
//   const { claimNumber, documentId, documentName, investigationId } = doc;

//   // Build output folder: ./downloads/CLAIMNUMBER/
//   const claimFolder = path.join(outputDir, claimNumber);
//   fs.mkdirSync(claimFolder, { recursive: true });

//   // Handle duplicate filenames — e.g. "Hospital Main Bill.pdf" appears 5 times
//   let finalPath = path.join(claimFolder, documentName);
//   let counter   = 1;
//   while (fs.existsSync(finalPath)) {
//     const ext  = path.extname(documentName);
//     const base = path.basename(documentName, ext);
//     finalPath  = path.join(claimFolder, `${base}_${counter}${ext}`);
//     counter++;
//   }

//   console.log(`  Downloading: ${documentName} (id: ${documentId})`);

//   try {
//     // POST body — exactly as seen in the network request
//     const body = {
//       documentId,
//       externalId:   '',
//       docType:      'VIEWPOLICYCLAIM',
//       policyNumber: '',
//       claimType:    doc.documentFetchType || 'REIMBURSEMENT', // from doc list response
//       docName:      documentName,
//     };

//     const response = await axios.post(
//       `${DOWNLOAD_API_URL}/ilm/document/api/downloadMedia`,
//       body,
//       {
//         params: {
//           documentId,
//           externalId: '',
//           docType:    'VIEWPOLICYCLAIM',
//         },
//         headers: {
//           auth:           `Bearer ${accessToken}`,
//           'content-type': 'application/json;charset=UTF-8',
//         },
//         responseType: 'arraybuffer', // binary PDF data
//       }
//     );

//     fs.writeFileSync(finalPath, response.data);
//     console.log(`  [OK] Saved: ${path.basename(finalPath)}`);
//     return true;

//   } catch (err) {
//     console.error(`  [ERROR] Failed to download "${documentName}":`, err.response?.status || err.message);
//     return false;
//   }
// }


// // -------------------------------------------------------
// // STEP 4 — DOWNLOAD ALL DOCS FOR A CLAIM
// // -------------------------------------------------------
// async function downloadAllDocuments(accessToken, claimNumber, outputDir = './downloads') {
//   const docs = await fetchDocumentList(accessToken, claimNumber);

//   if (docs.length === 0) {
//     console.log('  No documents found. Nothing to download.');
//     return;
//   }

//   console.log(`\n  Starting download of ${docs.length} file(s)...\n`);

//   let successCount = 0;
//   let failCount    = 0;

//   for (const doc of docs) {
//     const ok = await downloadPdf(accessToken, doc, outputDir);
//     if (ok) successCount++;
//     else     failCount++;
//   }

//   console.log('\n==========================================');
//   console.log('  DOWNLOAD SUMMARY');
//   console.log('==========================================');
//   console.log(`  Claim   : ${claimNumber}`);
//   console.log(`  Success : ${successCount}`);
//   console.log(`  Failed  : ${failCount}`);
//   console.log(`  Saved to: ${path.resolve(outputDir, claimNumber)}`);
// }


// // -------------------------------------------------------
// // MAIN
// // -------------------------------------------------------
// (async () => {

//   const accessToken = await getAccessToken();
//   console.log(`  Token preview: ${accessToken.substring(0, 20)}...\n`);

//   // Add as many claim numbers as you need
//   const claimNumbers = [
//     '260102320P',
//     // '260102321P',
//   ];

//   for (const claimNumber of claimNumbers) {
//     console.log('\n==========================================');
//     console.log(`  PROCESSING CLAIM: ${claimNumber}`);
//     console.log('==========================================');
//     await downloadAllDocuments(accessToken, claimNumber);
//   }

//   console.log('\n  All done!');

// })();

/**
 * ==============================
 * ===============================
 */

// 'use strict';

// const { chromium }   = require('playwright');
// const axios          = require('axios');
// const fs             = require('fs');
// const path           = require('path');
// const readline       = require('readline');
// const os             = require('os');

// const config           = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

// const APP_USERNAME     = config.APP_USERNAME;
// const APP_PASSWORD     = config.APP_PASSWORD;
// const LOGIN_URL        = config.url;
// const SELECTORS        = config.selectors;
// const BASE_API_URL     = config.base_api_url;
// const DOWNLOAD_API_URL = 'https://ilmsoapapi.bagicprod.bajajallianz.com';

// const TOKEN_CAPTURE_TIMEOUT_MS = 120_000;
// const CAPTCHA_WAIT_MS          = 60_000;


// // -------------------------------------------------------
// // TERMINAL INPUT
// // -------------------------------------------------------
// function askClaimNumbers() {
//   return new Promise((resolve) => {
//     const rl = readline.createInterface({
//       input:  process.stdin,
//       output: process.stdout,
//     });

//     console.log('\n============================================');
//     console.log('  BAJAJ ALLIANZ — CLAIM DOCUMENT DOWNLOADER');
//     console.log('============================================\n');
//     console.log('  Enter one or more claim numbers separated by commas.');
//     console.log('  Example: 260102320P, 260102321P\n');

//     rl.question('  Claim Number(s): ', (answer) => {
//       rl.close();

//       const claimNumbers = answer
//         .split(',')
//         .map(c => c.trim())
//         .filter(c => c.length > 0);

//       if (claimNumbers.length === 0) {
//         console.log('\n  No claim numbers entered. Exiting.');
//         process.exit(0);
//       }

//       console.log(`\n  You entered ${claimNumbers.length} claim(s):`);
//       claimNumbers.forEach(c => console.log(`    - ${c}`));
//       console.log('');

//       resolve(claimNumbers);
//     });
//   });
// }


// // -------------------------------------------------------
// // STEP 1 — LOGIN + TOKEN CAPTURE
// // -------------------------------------------------------
// async function getAccessToken() {
//   const browser = await chromium.launch({ headless: false });
//   const context = await browser.newContext();
//   const page    = await context.newPage();

//   let accessToken = null;

//   const tokenCaptured = new Promise((resolve, reject) => {
//     const timeout = setTimeout(
//       () => reject(new Error('Token capture timed out')),
//       TOKEN_CAPTURE_TIMEOUT_MS
//     );

//     page.on('response', async (response) => {
//       if (!response.url().includes('/openid-connect/token')) return;
//       try {
//         const body = await response.json();
//         if (body.access_token) {
//           accessToken = body.access_token;
//           clearTimeout(timeout);
//           console.log('  [AUTH] Access token captured.');
//           resolve(accessToken);
//         }
//       } catch {}
//     });
//   });

//   await page.goto(LOGIN_URL);
//   await page.fill(SELECTORS.username_input, APP_USERNAME);
//   await page.fill(SELECTORS.password_input, APP_PASSWORD);

//   console.log(`\n  [ACTION REQUIRED] Solve the CAPTCHA in the browser.`);
//   console.log(`  Waiting ${CAPTCHA_WAIT_MS / 1000} seconds...\n`);
//   await page.waitForTimeout(CAPTCHA_WAIT_MS);

//   await tokenCaptured;
//   await browser.close();

//   return accessToken;
// }


// // -------------------------------------------------------
// // STEP 2 — FETCH DOCUMENT LIST FOR A CLAIM
// // -------------------------------------------------------
// async function fetchDocumentList(accessToken, claimNumber) {
//   const payload = Buffer.from(JSON.stringify({ claimNumber, caseType: '' })).toString('base64');

//   console.log(`\n  Fetching document list for: ${claimNumber}`);

//   try {
//     const response = await axios.get(
//       `${BASE_API_URL}/ilm/policyclaim/api/getClaimDocList`,
//       {
//         params:  { payload },
//         headers: { auth: `Bearer ${accessToken}` },
//       }
//     );

//     const docs = response.data?.responseData || [];
//     console.log(`  [OK] Found ${docs.length} document(s)`);
//     return docs;

//   } catch (err) {
//     console.error('  [ERROR] Failed to fetch document list:', err.response?.data || err.message);
//     return [];
//   }
// }


// // -------------------------------------------------------
// // STEP 3 — DOWNLOAD A SINGLE PDF
// // -------------------------------------------------------
// async function downloadPdf(accessToken, doc, outputDir) {
//   const { claimNumber, documentId, documentName } = doc;

//   const claimFolder = path.join(outputDir, claimNumber);
//   fs.mkdirSync(claimFolder, { recursive: true });

//   // Handle duplicate filenames
//   let finalPath = path.join(claimFolder, documentName);
//   let counter   = 1;
//   while (fs.existsSync(finalPath)) {
//     const ext  = path.extname(documentName);
//     const base = path.basename(documentName, ext);
//     finalPath  = path.join(claimFolder, `${base}_${counter}${ext}`);
//     counter++;
//   }

//   console.log(`  Downloading: ${documentName}`);

//   try {
//     const body = {
//       documentId,
//       externalId:   '',
//       docType:      'VIEWPOLICYCLAIM',
//       policyNumber: '',
//       claimType:    doc.documentFetchType || 'REIMBURSEMENT',
//       docName:      documentName,
//     };

//     const response = await axios.post(
//       `${DOWNLOAD_API_URL}/ilm/document/api/downloadMedia`,
//       body,
//       {
//         params:       { documentId, externalId: '', docType: 'VIEWPOLICYCLAIM' },
//         headers:      { auth: `Bearer ${accessToken}`, 'content-type': 'application/json;charset=UTF-8' },
//         responseType: 'arraybuffer',
//       }
//     );

//     fs.writeFileSync(finalPath, response.data);
//     console.log(`  [OK] Saved: ${path.basename(finalPath)}`);
//     return true;

//   } catch (err) {
//     console.error(`  [ERROR] "${documentName}":`, err.response?.status || err.message);
//     return false;
//   }
// }


// // -------------------------------------------------------
// // STEP 4 — DOWNLOAD ALL DOCS FOR ONE CLAIM  ← was missing
// // -------------------------------------------------------
// async function downloadAllDocuments(accessToken, claimNumber, outputDir) {
//   const docs = await fetchDocumentList(accessToken, claimNumber);

//   if (docs.length === 0) {
//     console.log('  No documents found. Skipping.');
//     return { success: 0, failed: 0 };
//   }

//   console.log(`\n  Downloading ${docs.length} file(s) for ${claimNumber}...\n`);

//   let successCount = 0;
//   let failCount    = 0;

//   for (const doc of docs) {
//     const ok = await downloadPdf(accessToken, doc, outputDir);
//     if (ok) successCount++;
//     else     failCount++;
//   }

//   return { success: successCount, failed: failCount };
// }


// // -------------------------------------------------------
// // CROSS-PLATFORM DESKTOP PATH
// // -------------------------------------------------------
// function getOutputDir() {
//   const outputDir = path.join(os.homedir(), 'Desktop', 'Bajaj-doc-Automation');
//   fs.mkdirSync(outputDir, { recursive: true });
//   return outputDir;
// }


// // -------------------------------------------------------
// // MAIN
// // -------------------------------------------------------
// (async () => {

//   // 1. Get claim numbers from terminal BEFORE opening browser
//   const claimNumbers = await askClaimNumbers();

//   // 2. Login and capture token
//   const accessToken = await getAccessToken();
//   console.log(`  Token preview: ${accessToken.substring(0, 20)}...\n`);

//   const outputDir = getOutputDir(); // resolve once, reuse for all claims

//   // 3. Process each claim
//   const summary = [];

//   for (const claimNumber of claimNumbers) {
//     console.log('\n==========================================');
//     console.log(`  CLAIM: ${claimNumber}`);
//     console.log('==========================================');

//     const { success, failed } = await downloadAllDocuments(accessToken, claimNumber, outputDir);
//     summary.push({ claimNumber, success, failed });
//   }

//   // 4. Final summary
//   console.log('\n==========================================');
//   console.log('  FINAL SUMMARY');
//   console.log('==========================================');
//   summary.forEach(({ claimNumber, success, failed }) => {
//     console.log(`  ${claimNumber} → Downloaded: ${success} | Failed: ${failed}`);
//   });
//   console.log(`\n  Files saved to: ${outputDir}`);
//   console.log('\n  All done!');

// })();

/**
 * ===============================
 * ==============================
 */

// 'use strict';

// const { chromium }   = require('playwright');
// const axios          = require('axios');
// const fs             = require('fs');
// const path           = require('path');
// const readline       = require('readline');
// const os             = require('os');

// const config           = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

// const APP_USERNAME     = config.APP_USERNAME;
// const APP_PASSWORD     = config.APP_PASSWORD;
// const LOGIN_URL        = config.url;
// const SELECTORS        = config.selectors;
// const BASE_API_URL     = config.base_api_url;
// const DOWNLOAD_API_URL = 'https://ilmsoapapi.bagicprod.bajajallianz.com';

// const TOKEN_CAPTURE_TIMEOUT_MS = 120_000;
// const CAPTCHA_WAIT_MS          = 60_000;


// // -------------------------------------------------------
// // TERMINAL INPUT
// // -------------------------------------------------------
// function askClaimNumbers() {
//   return new Promise((resolve) => {
//     const rl = readline.createInterface({
//       input:  process.stdin,
//       output: process.stdout,
//     });

//     console.log('\n============================================');
//     console.log('  BAJAJ ALLIANZ — CLAIM DOCUMENT DOWNLOADER');
//     console.log('============================================\n');
//     console.log('  Enter one or more claim numbers separated by commas.');
//     console.log('  Example: 260102320P, 260102321P\n');

//     rl.question('  Claim Number(s): ', (answer) => {
//       rl.close();

//       const claimNumbers = answer
//         .split(',')
//         .map(c => c.trim())
//         .filter(c => c.length > 0);

//       if (claimNumbers.length === 0) {
//         console.log('\n  No claim numbers entered. Exiting.');
//         process.exit(0);
//       }

//       console.log(`\n  You entered ${claimNumbers.length} claim(s):`);
//       claimNumbers.forEach(c => console.log(`    - ${c}`));
//       console.log('');

//       resolve(claimNumbers);
//     });
//   });
// }


// // -------------------------------------------------------
// // STEP 1 — LOGIN + TOKEN CAPTURE
// // -------------------------------------------------------
// async function getAccessToken() {
//   const browser = await chromium.launch({ headless: false });
//   const context = await browser.newContext();
//   const page    = await context.newPage();

//   let accessToken = null;

//   const tokenCaptured = new Promise((resolve, reject) => {
//     const timeout = setTimeout(
//       () => reject(new Error('Token capture timed out')),
//       TOKEN_CAPTURE_TIMEOUT_MS
//     );

//     page.on('response', async (response) => {
//       if (!response.url().includes('/openid-connect/token')) return;
//       try {
//         const body = await response.json();
//         if (body.access_token) {
//           accessToken = body.access_token;
//           clearTimeout(timeout);
//           console.log('  [AUTH] Access token captured.');
//           resolve(accessToken);
//         }
//       } catch {}
//     });
//   });

//   await page.goto(LOGIN_URL);
//   await page.fill(SELECTORS.username_input, APP_USERNAME);
//   await page.fill(SELECTORS.password_input, APP_PASSWORD);

//   console.log(`\n  [ACTION REQUIRED] Solve the CAPTCHA in the browser.`);
//   console.log(`  Waiting ${CAPTCHA_WAIT_MS / 1000} seconds...\n`);
//   await page.waitForTimeout(CAPTCHA_WAIT_MS);

//   await tokenCaptured;
//   await browser.close();

//   return accessToken;
// }


// // -------------------------------------------------------
// // STEP 2 — FETCH DOCUMENT LIST FOR A CLAIM
// // -------------------------------------------------------
// async function fetchDocumentList(accessToken, claimNumber) {
//   const payload = Buffer.from(JSON.stringify({ claimNumber, caseType: '' })).toString('base64');

//   console.log(`\n  Fetching document list for: ${claimNumber}`);

//   try {
//     const response = await axios.get(
//       `${BASE_API_URL}/ilm/policyclaim/api/getClaimDocList`,
//       {
//         params:  { payload },
//         headers: { auth: `Bearer ${accessToken}` },
//       }
//     );

//     const docs = response.data?.responseData || [];
//     console.log(`  [OK] Found ${docs.length} document(s)`);
//     return docs;

//   } catch (err) {
//     console.error('  [ERROR] Failed to fetch document list:', err.response?.data || err.message);
//     return [];
//   }
// }


// // -------------------------------------------------------
// // SANITIZE FILENAME
// // -------------------------------------------------------
// function sanitizeFilename(filename) {
//   const ext   = path.extname(filename);
//   const base  = path.basename(filename, ext);
//   const clean = base
//     .replace(/[<>:"/\\|?*]/g, '_')
//     .replace(/\s+/g, ' ')
//     .trim()
//     .substring(0, 100);
//   return `${clean}${ext}`;
// }


// // -------------------------------------------------------
// // STEP 3 — DOWNLOAD A SINGLE PDF (DEBUG MODE)
// // -------------------------------------------------------
// async function downloadPdf(accessToken, doc, outputDir) {
//   const { claimNumber, documentId, documentName } = doc;

//   const claimFolder = path.join(outputDir, claimNumber);
//   fs.mkdirSync(claimFolder, { recursive: true });

//   const safeName = sanitizeFilename(documentName);

//   // Handle duplicate filenames
//   let finalPath = path.join(claimFolder, safeName);
//   let counter   = 1;
//   while (fs.existsSync(finalPath)) {
//     const ext  = path.extname(safeName);
//     const base = path.basename(safeName, ext);
//     finalPath  = path.join(claimFolder, `${base}_${counter}${ext}`);
//     counter++;
//   }

//   console.log(`  Downloading: ${safeName}`);

//   try {
//     const body = {
//       documentId,
//       externalId:   '',
//       docType:      'VIEWPOLICYCLAIM',
//       policyNumber: '',
//       claimType:    doc.documentFetchType || 'REIMBURSEMENT',
//       docName:      documentName,
//     };

//     // ⚠️ DEBUG MODE — responseType is 'json' to see what API actually returns
//     const response = await axios.post(
//       `${DOWNLOAD_API_URL}/ilm/document/api/downloadMedia`,
//       body,
//       {
//         params:  { documentId, externalId: '', docType: 'VIEWPOLICYCLAIM' },
//         headers: { auth: `Bearer ${accessToken}`, 'content-type': 'application/json;charset=UTF-8' },
//         responseType: 'json',   // ← DEBUG: changed from 'arraybuffer'
//       }
//     );

//     // ⚠️ DEBUG — print full response structure (only first file, then we fix)
//     console.log('  [DEBUG] Response keys:', Object.keys(response.data));
//     console.log('  [DEBUG] Full response:', JSON.stringify(response.data).substring(0, 500));

//     // TODO: actual save logic comes after we see the debug output
//     // fs.writeFileSync(finalPath, ...);

//     return { ok: true, name: safeName };

//   } catch (err) {
//     console.error(`  [ERROR] "${safeName}":`, err.response?.status || err.message);
//     return { ok: false, name: safeName };
//   }
// }


// // -------------------------------------------------------
// // STEP 4 — DOWNLOAD ALL DOCS — FULL PARALLEL
// // -------------------------------------------------------
// async function downloadAllDocuments(accessToken, claimNumber, outputDir) {
//   const docs = await fetchDocumentList(accessToken, claimNumber);

//   if (docs.length === 0) {
//     console.log('  No documents found. Skipping.');
//     return { success: 0, failed: 0 };
//   }

//   console.log(`\n  Starting PARALLEL download of ${docs.length} file(s)...\n`);

//   const results = await Promise.all(
//     docs.map(doc => downloadPdf(accessToken, doc, outputDir))
//   );

//   const successCount = results.filter(r => r.ok).length;
//   const failCount    = results.filter(r => !r.ok).length;

//   const failed = results.filter(r => !r.ok);
//   if (failed.length > 0) {
//     console.warn(`\n  [FAILED FILES]`);
//     failed.forEach(r => console.warn(`    - ${r.name}`));
//   }

//   return { success: successCount, failed: failCount };
// }


// // -------------------------------------------------------
// // CROSS-PLATFORM DESKTOP PATH
// // -------------------------------------------------------
// function getOutputDir() {
//   const outputDir = path.join(os.homedir(), 'Desktop', 'Bajaj-doc-Automation');
//   fs.mkdirSync(outputDir, { recursive: true });
//   return outputDir;
// }


// // -------------------------------------------------------
// // MAIN
// // -------------------------------------------------------
// (async () => {

//   const claimNumbers = await askClaimNumbers();
//   const accessToken  = await getAccessToken();
//   console.log(`  Token preview: ${accessToken.substring(0, 20)}...\n`);

//   const outputDir = getOutputDir();

//   console.log('\n==========================================');
//   console.log('  STARTING DOWNLOADS');
//   console.log('==========================================');

//   const summary = await Promise.all(
//     claimNumbers.map(async (claimNumber) => {
//       console.log(`\n  >> Processing claim: ${claimNumber}`);
//       const { success, failed } = await downloadAllDocuments(accessToken, claimNumber, outputDir);
//       return { claimNumber, success, failed };
//     })
//   );

//   console.log('\n==========================================');
//   console.log('  FINAL SUMMARY');
//   console.log('==========================================');
//   summary.forEach(({ claimNumber, success, failed }) => {
//     console.log(`  ${claimNumber} → ✅ Downloaded: ${success} | ❌ Failed: ${failed}`);
//   });
//   console.log(`\n  Files saved to: ${outputDir}`);
//   console.log('\n  All done!');

// })();

/**
 * ===============================
 * ===============================
 */

// 'use strict';

// const { chromium }   = require('playwright');
// const axios          = require('axios');
// const fs             = require('fs');
// const path           = require('path');
// const readline       = require('readline');
// const os             = require('os');

// const config           = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

// const APP_USERNAME     = config.APP_USERNAME;
// const APP_PASSWORD     = config.APP_PASSWORD;
// const LOGIN_URL        = config.url;
// const SELECTORS        = config.selectors;
// const BASE_API_URL     = config.base_api_url;
// const DOWNLOAD_API_URL = 'https://ilmsoapapi.bagicprod.bajajallianz.com';

// const TOKEN_CAPTURE_TIMEOUT_MS = 120_000;
// const CAPTCHA_WAIT_MS          = 60_000;


// // -------------------------------------------------------
// // TERMINAL INPUT
// // -------------------------------------------------------
// function askClaimNumbers() {
//   return new Promise((resolve) => {
//     const rl = readline.createInterface({
//       input:  process.stdin,
//       output: process.stdout,
//     });

//     console.log('\n============================================');
//     console.log('  BAJAJ ALLIANZ — CLAIM DOCUMENT DOWNLOADER');
//     console.log('============================================\n');
//     console.log('  Enter one or more claim numbers separated by commas.');
//     console.log('  Example: 260102320P, 260102321P\n');

//     rl.question('  Claim Number(s): ', (answer) => {
//       rl.close();

//       const claimNumbers = answer
//         .split(',')
//         .map(c => c.trim())
//         .filter(c => c.length > 0);

//       if (claimNumbers.length === 0) {
//         console.log('\n  No claim numbers entered. Exiting.');
//         process.exit(0);
//       }

//       console.log(`\n  You entered ${claimNumbers.length} claim(s):`);
//       claimNumbers.forEach(c => console.log(`    - ${c}`));
//       console.log('');

//       resolve(claimNumbers);
//     });
//   });
// }


// // -------------------------------------------------------
// // STEP 1 — LOGIN + TOKEN CAPTURE
// // -------------------------------------------------------
// async function getAccessToken() {
//   const browser = await chromium.launch({ headless: false });
//   const context = await browser.newContext();
//   const page    = await context.newPage();

//   let accessToken = null;

//   const tokenCaptured = new Promise((resolve, reject) => {
//     const timeout = setTimeout(
//       () => reject(new Error('Token capture timed out')),
//       TOKEN_CAPTURE_TIMEOUT_MS
//     );

//     page.on('response', async (response) => {
//       if (!response.url().includes('/openid-connect/token')) return;
//       try {
//         const body = await response.json();
//         if (body.access_token) {
//           accessToken = body.access_token;
//           clearTimeout(timeout);
//           console.log('  [AUTH] Access token captured.');
//           resolve(accessToken);
//         }
//       } catch {}
//     });
//   });

//   await page.goto(LOGIN_URL);
//   await page.fill(SELECTORS.username_input, APP_USERNAME);
//   await page.fill(SELECTORS.password_input, APP_PASSWORD);

//   console.log(`\n  [ACTION REQUIRED] Solve the CAPTCHA in the browser.`);
//   console.log(`  Waiting ${CAPTCHA_WAIT_MS / 1000} seconds...\n`);
//   await page.waitForTimeout(CAPTCHA_WAIT_MS);

//   await tokenCaptured;
//   await browser.close();

//   return accessToken;
// }


// // -------------------------------------------------------
// // STEP 2 — FETCH DOCUMENT LIST FOR A CLAIM
// // -------------------------------------------------------
// async function fetchDocumentList(accessToken, claimNumber) {
//   const payload = Buffer.from(JSON.stringify({ claimNumber, caseType: '' })).toString('base64');

//   console.log(`\n  Fetching document list for: ${claimNumber}`);

//   try {
//     const response = await axios.get(
//       `${BASE_API_URL}/ilm/policyclaim/api/getClaimDocList`,
//       {
//         params:  { payload },
//         headers: { auth: `Bearer ${accessToken}` },
//       }
//     );

//     const docs = response.data?.responseData || [];
//     console.log(`  [OK] Found ${docs.length} document(s)`);
//     return docs;

//   } catch (err) {
//     console.error('  [ERROR] Failed to fetch document list:', err.response?.data || err.message);
//     return [];
//   }
// }


// // -------------------------------------------------------
// // SANITIZE FILENAME
// // Removes illegal Windows characters + truncates to 100 chars
// // -------------------------------------------------------
// function sanitizeFilename(filename) {
//   const ext   = path.extname(filename);
//   const base  = path.basename(filename, ext);
//   const clean = base
//     .replace(/[<>:"/\\|?*]/g, '_')
//     .replace(/\s+/g, ' ')
//     .trim()
//     .substring(0, 100);
//   return `${clean}${ext}`;
// }


// // -------------------------------------------------------
// // STEP 3 — DOWNLOAD A SINGLE FILE
// // API returns base64 in response.data.responseData.docData
// // We decode it and save as actual binary file
// // -------------------------------------------------------
// async function downloadPdf(accessToken, doc, outputDir) {
//   const { claimNumber, documentId, documentName } = doc;

//   const claimFolder = path.join(outputDir, claimNumber);
//   fs.mkdirSync(claimFolder, { recursive: true });

//   const safeName = sanitizeFilename(documentName);

//   // Handle duplicate filenames
//   let finalPath = path.join(claimFolder, safeName);
//   let counter   = 1;
//   while (fs.existsSync(finalPath)) {
//     const ext  = path.extname(safeName);
//     const base = path.basename(safeName, ext);
//     finalPath  = path.join(claimFolder, `${base}_${counter}${ext}`);
//     counter++;
//   }

//   console.log(`  Downloading: ${safeName}`);

//   try {
//     const body = {
//       documentId,
//       externalId:   '',
//       docType:      'VIEWPOLICYCLAIM',
//       policyNumber: '',
//       claimType:    doc.documentFetchType || 'REIMBURSEMENT',
//       docName:      documentName,
//     };

//     const response = await axios.post(
//       `${DOWNLOAD_API_URL}/ilm/document/api/downloadMedia`,
//       body,
//       {
//         params:  { documentId, externalId: '', docType: 'VIEWPOLICYCLAIM' },
//         headers: { auth: `Bearer ${accessToken}`, 'content-type': 'application/json;charset=UTF-8' },
//         responseType: 'json',  // API returns JSON with base64 inside
//       }
//     );

//     // ✅ API returns: response.data.responseData.docData = base64 string
//     const base64Data = response.data?.responseData?.docData;

//     if (!base64Data) {
//       console.error(`  [ERROR] No docData in response for "${safeName}"`);
//       return { ok: false, name: safeName };
//     }

//     // Decode base64 → binary buffer → save as file
//     const buffer = Buffer.from(base64Data, 'base64');
//     fs.writeFileSync(finalPath, buffer);

//     console.log(`  [OK] Saved: ${path.basename(finalPath)}`);
//     return { ok: true, name: safeName };

//   } catch (err) {
//     console.error(`  [ERROR] "${safeName}":`, err.response?.status || err.message);
//     return { ok: false, name: safeName };
//   }
// }


// // -------------------------------------------------------
// // STEP 4 — DOWNLOAD ALL DOCS — FULL PARALLEL
// // -------------------------------------------------------
// async function downloadAllDocuments(accessToken, claimNumber, outputDir) {
//   const docs = await fetchDocumentList(accessToken, claimNumber);

//   if (docs.length === 0) {
//     console.log('  No documents found. Skipping.');
//     return { success: 0, failed: 0 };
//   }

//   console.log(`\n  Starting PARALLEL download of ${docs.length} file(s)...\n`);

//   const results = await Promise.all(
//     docs.map(doc => downloadPdf(accessToken, doc, outputDir))
//   );

//   const successCount = results.filter(r => r.ok).length;
//   const failCount    = results.filter(r => !r.ok).length;

//   const failed = results.filter(r => !r.ok);
//   if (failed.length > 0) {
//     console.warn(`\n  [FAILED FILES]`);
//     failed.forEach(r => console.warn(`    - ${r.name}`));
//   }

//   return { success: successCount, failed: failCount };
// }


// // -------------------------------------------------------
// // CROSS-PLATFORM DESKTOP PATH
// // -------------------------------------------------------
// function getOutputDir() {
//   const outputDir = path.join(os.homedir(), 'Desktop', 'Bajaj-doc-Automation');
//   fs.mkdirSync(outputDir, { recursive: true });
//   return outputDir;
// }


// // -------------------------------------------------------
// // MAIN
// // -------------------------------------------------------
// (async () => {

//   const claimNumbers = await askClaimNumbers();
//   const accessToken  = await getAccessToken();
//   console.log(`  Token preview: ${accessToken.substring(0, 20)}...\n`);

//   const outputDir = getOutputDir();

//   console.log('\n==========================================');
//   console.log('  STARTING DOWNLOADS');
//   console.log('==========================================');

//   const summary = await Promise.all(
//     claimNumbers.map(async (claimNumber) => {
//       console.log(`\n  >> Processing claim: ${claimNumber}`);
//       const { success, failed } = await downloadAllDocuments(accessToken, claimNumber, outputDir);
//       return { claimNumber, success, failed };
//     })
//   );

//   console.log('\n==========================================');
//   console.log('  FINAL SUMMARY');
//   console.log('==========================================');
//   summary.forEach(({ claimNumber, success, failed }) => {
//     console.log(`  ${claimNumber} → ✅ Downloaded: ${success} | ❌ Failed: ${failed}`);
//   });
//   console.log(`\n  Files saved to: ${outputDir}`);
//   console.log('\n  All done!');

// })();

/**
 * ======
 * ------
 * ======
 */

// 'use strict';

// const { chromium }   = require('playwright');
// const axios          = require('axios');
// const fs             = require('fs');
// const path           = require('path');
// const os             = require('os');

// const config           = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

// const APP_USERNAME     = config.APP_USERNAME;
// const APP_PASSWORD     = config.APP_PASSWORD;
// const LOGIN_URL        = config.url;
// const SELECTORS        = config.selectors;
// const BASE_API_URL     = config.base_api_url;
// const DOWNLOAD_API_URL = 'https://ilmsoapapi.bagicprod.bajajallianz.com';

// const TOKEN_CAPTURE_TIMEOUT_MS = 120_000;
// const CAPTCHA_WAIT_MS          = 60_000;

// // log will be injected by main.js so IPC works
// let log = console.log;

// function setLogger(fn) {
//   log = fn;
// }

// // -------------------------------------------------------
// // PARSE CLAIM NUMBERS — supports comma AND/OR space
// // e.g. "123, 456 789" => ["123","456","789"]
// // -------------------------------------------------------
// function parseClaimNumbers(input) {
//   return input
//     .split(/[\s,]+/)
//     .map(c => c.trim())
//     .filter(c => c.length > 0);
// }

// // -------------------------------------------------------
// // STEP 1 — LOGIN + TOKEN CAPTURE
// // -------------------------------------------------------
// async function getAccessToken() {
//   let browser = null;
//   try {
//     log('[INFO] Launching browser...');
//     browser = await chromium.launch({ headless: false });
//     log('[OK] Browser launched successfully.');

//     const context = await browser.newContext();
//     const page    = await context.newPage();
//     log('[INFO] New browser page created.');

//     let accessToken = null;

//     const tokenCaptured = new Promise((resolve, reject) => {
//       const timeout = setTimeout(() => {
//         reject(new Error('Token capture timed out after ' + (TOKEN_CAPTURE_TIMEOUT_MS / 1000) + 's'));
//       }, TOKEN_CAPTURE_TIMEOUT_MS);

//       page.on('response', async (response) => {
//         if (!response.url().includes('/openid-connect/token')) return;
//         try {
//           const body = await response.json();
//           if (body.access_token) {
//             accessToken = body.access_token;
//             clearTimeout(timeout);
//             log('[OK] Access token captured successfully.');
//             resolve(accessToken);
//           }
//         } catch (err) {
//           log('[WARN] Response parse failed (non-token response skipped): ' + err.message);
//         }
//       });
//     });

//     log('[INFO] Navigating to login URL: ' + LOGIN_URL);
//     await page.goto(LOGIN_URL);
//     log('[OK] Login page loaded.');

//     log('[INFO] Filling username...');
//     await page.fill(SELECTORS.username_input, APP_USERNAME);
//     log('[OK] Username filled.');

//     log('[INFO] Filling password...');
//     await page.fill(SELECTORS.password_input, APP_PASSWORD);
//     log('[OK] Password filled.');

//     log('[ACTION REQUIRED] Solve the CAPTCHA in the browser window.');
//     log('[INFO] Waiting ' + (CAPTCHA_WAIT_MS / 1000) + ' seconds for CAPTCHA...');
//     await page.waitForTimeout(CAPTCHA_WAIT_MS);
//     log('[INFO] CAPTCHA wait complete. Waiting for token...');

//     await tokenCaptured;

//     log('[INFO] Closing browser...');
//     await browser.close();
//     log('[OK] Browser closed.');

//     return accessToken;

//   } catch (err) {
//     log('[ERROR] getAccessToken failed: ' + err.message);
//     if (browser) {
//       try { await browser.close(); log('[INFO] Browser force-closed after error.'); }
//       catch (e) { log('[WARN] Could not close browser: ' + e.message); }
//     }
//     throw err;
//   }
// }

// // -------------------------------------------------------
// // STEP 2 — FETCH DOCUMENT LIST FOR A CLAIM
// // -------------------------------------------------------
// async function fetchDocumentList(accessToken, claimNumber) {
//   log('[INFO] Fetching document list for claim: ' + claimNumber);
//   try {
//     const payload = Buffer.from(JSON.stringify({ claimNumber, caseType: '' })).toString('base64');
//     log('[INFO] Payload encoded. Sending GET request to getClaimDocList...');

//     const response = await axios.get(
//       `${BASE_API_URL}/ilm/policyclaim/api/getClaimDocList`,
//       {
//         params:  { payload },
//         headers: { auth: `Bearer ${accessToken}` },
//       }
//     );

//     const docs = response.data?.responseData || [];
//     log(`[OK] Document list fetched for ${claimNumber}. Found ${docs.length} document(s).`);

//     if (docs.length === 0) {
//       log('[WARN] No documents found for claim: ' + claimNumber);
//     } else {
//       docs.forEach((doc, i) => {
//         log(`  [DOC ${i + 1}] ${doc.documentName} (ID: ${doc.documentId})`);
//       });
//     }

//     return docs;

//   } catch (err) {
//     log('[ERROR] fetchDocumentList failed for ' + claimNumber + ': ' +
//       (err.response?.status ? 'HTTP ' + err.response.status + ' — ' : '') +
//       (err.response?.data ? JSON.stringify(err.response.data) : err.message));
//     return [];
//   }
// }

// // -------------------------------------------------------
// // SANITIZE FILENAME
// // -------------------------------------------------------
// function sanitizeFilename(filename) {
//   const ext   = path.extname(filename);
//   const base  = path.basename(filename, ext);
//   const clean = base
//     .replace(/[<>:"/\\|?*]/g, '_')
//     .replace(/\s+/g, ' ')
//     .trim()
//     .substring(0, 100);
//   return `${clean}${ext}`;
// }

// // -------------------------------------------------------
// // STEP 3 — DOWNLOAD A SINGLE FILE
// // -------------------------------------------------------
// async function downloadPdf(accessToken, doc, outputDir) {
//   const { claimNumber, documentId, documentName } = doc;

//   try {
//     const claimFolder = path.join(outputDir, claimNumber);
//     fs.mkdirSync(claimFolder, { recursive: true });
//     log('[OK] Claim folder ready: ' + claimFolder);

//     const safeName = sanitizeFilename(documentName);

//     // Handle duplicate filenames
//     let finalPath = path.join(claimFolder, safeName);
//     let counter   = 1;
//     while (fs.existsSync(finalPath)) {
//       const ext  = path.extname(safeName);
//       const base = path.basename(safeName, ext);
//       finalPath  = path.join(claimFolder, `${base}_${counter}${ext}`);
//       counter++;
//     }

//     log('[INFO] Downloading: ' + safeName + ' (ID: ' + documentId + ')');

//     const body = {
//       documentId,
//       externalId:   '',
//       docType:      'VIEWPOLICYCLAIM',
//       policyNumber: '',
//       claimType:    doc.documentFetchType || 'REIMBURSEMENT',
//       docName:      documentName,
//     };

//     log('[INFO] Sending POST request to downloadMedia for: ' + safeName);

//     const response = await axios.post(
//       `${DOWNLOAD_API_URL}/ilm/document/api/downloadMedia`,
//       body,
//       {
//         params:  { documentId, externalId: '', docType: 'VIEWPOLICYCLAIM' },
//         headers: { auth: `Bearer ${accessToken}`, 'content-type': 'application/json;charset=UTF-8' },
//         responseType: 'json',
//       }
//     );

//     log('[INFO] Response received for: ' + safeName + '. Checking docData...');

//     const base64Data = response.data?.responseData?.docData;

//     if (!base64Data) {
//       log('[ERROR] No docData in response for "' + safeName + '". Skipping file.');
//       return { ok: false, name: safeName };
//     }

//     log('[INFO] docData found. Decoding base64 for: ' + safeName);
//     const buffer = Buffer.from(base64Data, 'base64');
//     log('[INFO] Base64 decoded successfully. Size: ' + buffer.length + ' bytes.');

//     fs.writeFileSync(finalPath, buffer);
//     log('[OK] File saved: ' + path.basename(finalPath) + ' → ' + finalPath);

//     return { ok: true, name: safeName };

//   } catch (err) {
//     log('[ERROR] downloadPdf failed for "' + documentName + '": ' +
//       (err.response?.status ? 'HTTP ' + err.response.status + ' — ' : '') +
//       err.message);
//     return { ok: false, name: documentName };
//   }
// }

// // -------------------------------------------------------
// // STEP 4 — DOWNLOAD ALL DOCS — FULL PARALLEL
// // -------------------------------------------------------
// async function downloadAllDocuments(accessToken, claimNumber, outputDir) {
//   try {
//     const docs = await fetchDocumentList(accessToken, claimNumber);

//     if (docs.length === 0) {
//       log('[WARN] Skipping download for ' + claimNumber + ' — no documents.');
//       return { success: 0, failed: 0 };
//     }

//     log('[INFO] Starting PARALLEL download of ' + docs.length + ' file(s) for claim: ' + claimNumber);

//     const results = await Promise.all(
//       docs.map(doc => downloadPdf(accessToken, doc, outputDir))
//     );

//     const successCount = results.filter(r => r.ok).length;
//     const failCount    = results.filter(r => !r.ok).length;

//     log(`[OK] Parallel download complete for ${claimNumber}: ${successCount} success, ${failCount} failed.`);

//     const failed = results.filter(r => !r.ok);
//     if (failed.length > 0) {
//       log('[WARN] Failed files for ' + claimNumber + ':');
//       failed.forEach(r => log('  [FAILED] ' + r.name));
//     }

//     return { success: successCount, failed: failCount };

//   } catch (err) {
//     log('[ERROR] downloadAllDocuments crashed for ' + claimNumber + ': ' + err.message);
//     return { success: 0, failed: 0 };
//   }
// }

// // -------------------------------------------------------
// // CROSS-PLATFORM DESKTOP PATH
// // -------------------------------------------------------
// function getOutputDir() {
//   try {
//     const outputDir = path.join(os.homedir(), 'Desktop', 'Bajaj-doc-Automation');
//     fs.mkdirSync(outputDir, { recursive: true });
//     log('[OK] Output directory ready: ' + outputDir);
//     return outputDir;
//   } catch (err) {
//     log('[ERROR] Could not create output directory: ' + err.message);
//     throw err;
//   }
// }

// // -------------------------------------------------------
// // MAIN RUN — called from main.js
// // -------------------------------------------------------
// async function run(rawInput) {
//   try {
//     log('============================================');
//     log('  BAJAJ ALLIANZ — CLAIM DOCUMENT DOWNLOADER');
//     log('============================================');

//     const claimNumbers = parseClaimNumbers(rawInput);

//     if (claimNumbers.length === 0) {
//       log('[ERROR] No valid claim numbers entered. Aborting.');
//       return;
//     }

//     log('[INFO] Parsed ' + claimNumbers.length + ' claim number(s):');
//     claimNumbers.forEach(c => log('  - ' + c));

//     const accessToken = await getAccessToken();
//     log('[INFO] Token preview: ' + accessToken.substring(0, 20) + '...');

//     const outputDir = getOutputDir();

//     log('==========================================');
//     log('  STARTING PARALLEL DOWNLOADS');
//     log('==========================================');

//     const summary = await Promise.all(
//       claimNumbers.map(async (claimNumber) => {
//         try {
//           log('\n[INFO] >> Processing claim: ' + claimNumber);
//           const { success, failed } = await downloadAllDocuments(accessToken, claimNumber, outputDir);
//           return { claimNumber, success, failed };
//         } catch (err) {
//           log('[ERROR] Claim ' + claimNumber + ' crashed: ' + err.message);
//           return { claimNumber, success: 0, failed: 0 };
//         }
//       })
//     );

//     log('\n==========================================');
//     log('  FINAL SUMMARY');
//     log('==========================================');
//     summary.forEach(({ claimNumber, success, failed }) => {
//       log(`  ${claimNumber} → Downloaded: ${success} | Failed: ${failed}`);
//     });
//     log('[INFO] Files saved to: ' + outputDir);
//     log('[OK] All done!');

//   } catch (err) {
//     log('[ERROR] Critical failure in run(): ' + err.message);
//     log('[INFO] Automation stopped due to critical error. Other tasks were not affected.');
//   }
// }

// module.exports = { run, setLogger, parseClaimNumbers };









// 'use strict';

// const { chromium }   = require('playwright');
// const axios          = require('axios');
// const fs             = require('fs');
// const path           = require('path');
// const os             = require('os');

// const config           = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

// const APP_USERNAME     = config.APP_USERNAME;
// const APP_PASSWORD     = config.APP_PASSWORD;
// const LOGIN_URL        = config.url;
// const SELECTORS        = config.selectors;
// const BASE_API_URL     = config.base_api_url;
// const DOWNLOAD_API_URL = 'https://ilmsoapapi.bagicprod.bajajallianz.com';

// const TOKEN_CAPTURE_TIMEOUT_MS = 120_000;
// const CAPTCHA_WAIT_MS          = 60_000;

// // log will be injected by main.js so IPC works
// let log = console.log;

// function setLogger(fn) {
//   log = fn;
// }

// // onBrowserClose will be injected by main.js
// // called the moment browser closes — success, crash, or manual close
// let onBrowserClose = () => {};

// function setBrowserCloseHandler(fn) {
//   onBrowserClose = fn;
// }

// // -------------------------------------------------------
// // PARSE CLAIM NUMBERS — supports comma AND/OR space
// // e.g. "123, 456 789" => ["123","456","789"]
// // -------------------------------------------------------
// function parseClaimNumbers(input) {
//   return input
//     .split(/[\s,]+/)
//     .map(c => c.trim())
//     .filter(c => c.length > 0);
// }

// // -------------------------------------------------------
// // STEP 1 — LOGIN + TOKEN CAPTURE
// // -------------------------------------------------------
// async function getAccessToken() {
//   let browser = null;
//   try {
//     log('[INFO] Launching browser...');
//     browser = await chromium.launch({ headless: false });
//     log('[OK] Browser launched successfully.');

//     // Fire onBrowserClose the moment browser closes — for ANY reason
//     // (success, crash, manual close, timeout)
//     browser.on('disconnected', () => {
//       try {
//         log('[INFO] Browser disconnected — enabling Start button.');
//         onBrowserClose();
//       } catch (e) {
//         console.error('[INDEX] onBrowserClose callback error:', e.message);
//       }
//     });

//     const context = await browser.newContext();
//     const page    = await context.newPage();
//     log('[INFO] New browser page created.');

//     let accessToken = null;

//     const tokenCaptured = new Promise((resolve, reject) => {
//       const timeout = setTimeout(() => {
//         reject(new Error('Token capture timed out after ' + (TOKEN_CAPTURE_TIMEOUT_MS / 1000) + 's'));
//       }, TOKEN_CAPTURE_TIMEOUT_MS);

//       page.on('response', async (response) => {
//         if (!response.url().includes('/openid-connect/token')) return;
//         try {
//           const body = await response.json();
//           if (body.access_token) {
//             accessToken = body.access_token;
//             clearTimeout(timeout);
//             log('[OK] Access token captured successfully.');
//             resolve(accessToken);
//           }
//         } catch (err) {
//           log('[WARN] Response parse failed (non-token response skipped): ' + err.message);
//         }
//       });
//     });

//     log('[INFO] Navigating to login URL: ' + LOGIN_URL);
//     await page.goto(LOGIN_URL);
//     log('[OK] Login page loaded.');

//     log('[INFO] Filling username...');
//     await page.fill(SELECTORS.username_input, APP_USERNAME);
//     log('[OK] Username filled.');

//     log('[INFO] Filling password...');
//     await page.fill(SELECTORS.password_input, APP_PASSWORD);
//     log('[OK] Password filled.');

//     log('[ACTION REQUIRED] Solve the CAPTCHA in the browser window.');
//     log('[INFO] Waiting ' + (CAPTCHA_WAIT_MS / 1000) + ' seconds for CAPTCHA...');
//     await page.waitForTimeout(CAPTCHA_WAIT_MS);
//     log('[INFO] CAPTCHA wait complete. Waiting for token...');

//     await tokenCaptured;

//     log('[INFO] Closing browser...');
//     await browser.close();
//     log('[OK] Browser closed.');

//     return accessToken;

//   } catch (err) {
//     log('[ERROR] getAccessToken failed: ' + err.message);
//     if (browser) {
//       try { await browser.close(); log('[INFO] Browser force-closed after error.'); }
//       catch (e) { log('[WARN] Could not close browser: ' + e.message); }
//     }
//     throw err;
//   }
// }

// // -------------------------------------------------------
// // STEP 2 — FETCH DOCUMENT LIST FOR A CLAIM
// // -------------------------------------------------------
// async function fetchDocumentList(accessToken, claimNumber) {
//   log('[INFO] Fetching document list for claim: ' + claimNumber);
//   try {
//     const payload = Buffer.from(JSON.stringify({ claimNumber, caseType: '' })).toString('base64');
//     log('[INFO] Payload encoded. Sending GET request to getClaimDocList...');

//     const response = await axios.get(
//       `${BASE_API_URL}/ilm/policyclaim/api/getClaimDocList`,
//       {
//         params:  { payload },
//         headers: { auth: `Bearer ${accessToken}` },
//       }
//     );

//     const docs = response.data?.responseData || [];
//     log(`[OK] Document list fetched for ${claimNumber}. Found ${docs.length} document(s).`);

//     if (docs.length === 0) {
//       log('[WARN] No documents found for claim: ' + claimNumber);
//     } else {
//       docs.forEach((doc, i) => {
//         log(`  [DOC ${i + 1}] ${doc.documentName} (ID: ${doc.documentId})`);
//       });
//     }

//     return docs;

//   } catch (err) {
//     log('[ERROR] fetchDocumentList failed for ' + claimNumber + ': ' +
//       (err.response?.status ? 'HTTP ' + err.response.status + ' — ' : '') +
//       (err.response?.data ? JSON.stringify(err.response.data) : err.message));
//     return [];
//   }
// }

// // -------------------------------------------------------
// // SANITIZE FILENAME
// // -------------------------------------------------------
// function sanitizeFilename(filename) {
//   const ext   = path.extname(filename);
//   const base  = path.basename(filename, ext);
//   const clean = base
//     .replace(/[<>:"/\\|?*]/g, '_')
//     .replace(/\s+/g, ' ')
//     .trim()
//     .substring(0, 100);
//   return `${clean}${ext}`;
// }

// // -------------------------------------------------------
// // STEP 3 — DOWNLOAD A SINGLE FILE
// // -------------------------------------------------------
// async function downloadPdf(accessToken, doc, outputDir) {
//   const { claimNumber, documentId, documentName } = doc;

//   try {
//     const claimFolder = path.join(outputDir, claimNumber);
//     fs.mkdirSync(claimFolder, { recursive: true });
//     log('[OK] Claim folder ready: ' + claimFolder);

//     const safeName = sanitizeFilename(documentName);

//     // Handle duplicate filenames
//     let finalPath = path.join(claimFolder, safeName);
//     let counter   = 1;
//     while (fs.existsSync(finalPath)) {
//       const ext  = path.extname(safeName);
//       const base = path.basename(safeName, ext);
//       finalPath  = path.join(claimFolder, `${base}_${counter}${ext}`);
//       counter++;
//     }

//     log('[INFO] Downloading: ' + safeName + ' (ID: ' + documentId + ')');

//     const body = {
//       documentId,
//       externalId:   '',
//       docType:      'VIEWPOLICYCLAIM',
//       policyNumber: '',
//       claimType:    doc.documentFetchType || 'REIMBURSEMENT',
//       docName:      documentName,
//     };

//     log('[INFO] Sending POST request to downloadMedia for: ' + safeName);

//     const response = await axios.post(
//       `${DOWNLOAD_API_URL}/ilm/document/api/downloadMedia`,
//       body,
//       {
//         params:  { documentId, externalId: '', docType: 'VIEWPOLICYCLAIM' },
//         headers: { auth: `Bearer ${accessToken}`, 'content-type': 'application/json;charset=UTF-8' },
//         responseType: 'json',
//       }
//     );

//     log('[INFO] Response received for: ' + safeName + '. Checking docData...');

//     const base64Data = response.data?.responseData?.docData;

//     if (!base64Data) {
//       log('[ERROR] No docData in response for "' + safeName + '". Skipping file.');
//       return { ok: false, name: safeName };
//     }

//     log('[INFO] docData found. Decoding base64 for: ' + safeName);
//     const buffer = Buffer.from(base64Data, 'base64');
//     log('[INFO] Base64 decoded successfully. Size: ' + buffer.length + ' bytes.');

//     fs.writeFileSync(finalPath, buffer);
//     log('[OK] File saved: ' + path.basename(finalPath) + ' → ' + finalPath);

//     return { ok: true, name: safeName };

//   } catch (err) {
//     log('[ERROR] downloadPdf failed for "' + documentName + '": ' +
//       (err.response?.status ? 'HTTP ' + err.response.status + ' — ' : '') +
//       err.message);
//     return { ok: false, name: documentName };
//   }
// }

// // -------------------------------------------------------
// // STEP 4 — DOWNLOAD ALL DOCS — FULL PARALLEL
// // -------------------------------------------------------
// async function downloadAllDocuments(accessToken, claimNumber, outputDir) {
//   try {
//     const docs = await fetchDocumentList(accessToken, claimNumber);

//     if (docs.length === 0) {
//       log('[WARN] Skipping download for ' + claimNumber + ' — no documents.');
//       return { success: 0, failed: 0 };
//     }

//     // Delete existing claim folder if present — always download fresh
//     const claimFolder = path.join(outputDir, claimNumber);
//     if (fs.existsSync(claimFolder)) {
//       try {
//         fs.rmSync(claimFolder, { recursive: true, force: true });
//         log('[INFO] Existing folder deleted for fresh download: ' + claimFolder);
//       } catch (err) {
//         log('[WARN] Could not delete existing folder for ' + claimNumber + ': ' + err.message);
//       }
//     } else {
//       log('[INFO] No existing folder found for ' + claimNumber + '. Creating fresh.');
//     }

//     log('[INFO] Starting PARALLEL download of ' + docs.length + ' file(s) for claim: ' + claimNumber);

//     const results = await Promise.all(
//       docs.map(doc => downloadPdf(accessToken, doc, outputDir))
//     );

//     const successCount = results.filter(r => r.ok).length;
//     const failCount    = results.filter(r => !r.ok).length;

//     log(`[OK] Parallel download complete for ${claimNumber}: ${successCount} success, ${failCount} failed.`);

//     const failed = results.filter(r => !r.ok);
//     if (failed.length > 0) {
//       log('[WARN] Failed files for ' + claimNumber + ':');
//       failed.forEach(r => log('  [FAILED] ' + r.name));
//     }

//     return { success: successCount, failed: failCount };

//   } catch (err) {
//     log('[ERROR] downloadAllDocuments crashed for ' + claimNumber + ': ' + err.message);
//     return { success: 0, failed: 0 };
//   }
// }

// // -------------------------------------------------------
// // CROSS-PLATFORM DESKTOP PATH
// // -------------------------------------------------------
// function getOutputDir() {
//   try {
//     const outputDir = path.join(os.homedir(), 'Desktop', 'Bajaj-doc-Automation');
//     fs.mkdirSync(outputDir, { recursive: true });
//     log('[OK] Output directory ready: ' + outputDir);
//     return outputDir;
//   } catch (err) {
//     log('[ERROR] Could not create output directory: ' + err.message);
//     throw err;
//   }
// }

// // -------------------------------------------------------
// // MAIN RUN — called from main.js
// // -------------------------------------------------------
// async function run(rawInput) {
//   try {
//     log('============================================');
//     log('  BAJAJ ALLIANZ — CLAIM DOCUMENT DOWNLOADER');
//     log('============================================');

//     const claimNumbers = parseClaimNumbers(rawInput);

//     if (claimNumbers.length === 0) {
//       log('[ERROR] No valid claim numbers entered. Aborting.');
//       return;
//     }

//     log('[INFO] Parsed ' + claimNumbers.length + ' claim number(s):');
//     claimNumbers.forEach(c => log('  - ' + c));

//     const accessToken = await getAccessToken();
//     log('[INFO] Token preview: ' + accessToken.substring(0, 20) + '...');

//     const outputDir = getOutputDir();

//     log('==========================================');
//     log('  STARTING PARALLEL DOWNLOADS');
//     log('==========================================');

//     const summary = await Promise.all(
//       claimNumbers.map(async (claimNumber) => {
//         try {
//           log('\n[INFO] >> Processing claim: ' + claimNumber);
//           const { success, failed } = await downloadAllDocuments(accessToken, claimNumber, outputDir);
//           return { claimNumber, success, failed };
//         } catch (err) {
//           log('[ERROR] Claim ' + claimNumber + ' crashed: ' + err.message);
//           return { claimNumber, success: 0, failed: 0 };
//         }
//       })
//     );

//     log('\n==========================================');
//     log('  FINAL SUMMARY');
//     log('==========================================');
//     summary.forEach(({ claimNumber, success, failed }) => {
//       log(`  ${claimNumber} → Downloaded: ${success} | Failed: ${failed}`);
//     });
//     log('[INFO] Files saved to: ' + outputDir);
//     log('[OK] All done!');

//   } catch (err) {
//     log('[ERROR] Critical failure in run(): ' + err.message);
//     log('[INFO] Automation stopped due to critical error. Other tasks were not affected.');
//   }
// }

// module.exports = { run, setLogger, setBrowserCloseHandler, parseClaimNumbers };

/**
 * =========================
 * ========================
 */

'use strict';

const { chromium }   = require('playwright');
const axios          = require('axios');
const fs             = require('fs');
const path           = require('path');
const os             = require('os');

const config           = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

const APP_USERNAME     = config.APP_USERNAME;
const APP_PASSWORD     = config.APP_PASSWORD;
const LOGIN_URL        = config.url;
const SELECTORS        = config.selectors;
const BASE_API_URL     = config.base_api_url;
const DOWNLOAD_API_URL = 'https://ilmsoapapi.bagicprod.bajajallianz.com';
const OPUS_API_URL     = 'https://webapi.bajajallianz.com';

const TOKEN_CAPTURE_TIMEOUT_MS = 120_000;
const CAPTCHA_WAIT_MS          = 30_000;

// log will be injected by main.js so IPC works
let log = console.log;

function setLogger(fn) {
  log = fn;
}

// onBrowserClose will be injected by main.js
let onBrowserClose = () => {};

function setBrowserCloseHandler(fn) {
  onBrowserClose = fn;
}

// -------------------------------------------------------
// DETECT CLAIM TYPE
// OC-XX-XXXX-XXXX-XXXXXXXX  => 'OPUS'
// everything else            => 'HEALTH'
// -------------------------------------------------------
function getClaimType(claimNumber) {
  return claimNumber.trim().toUpperCase().startsWith('OC-') ? 'OPUS' : 'HEALTH';
}

// -------------------------------------------------------
// PARSE CLAIM NUMBERS — supports comma AND/OR space
// -------------------------------------------------------
function parseClaimNumbers(input) {
  return input
    .split(/[\s,]+/)
    .map(c => c.trim())
    .filter(c => c.length > 0);
}

// -------------------------------------------------------
// STEP 1 — LOGIN + TOKEN CAPTURE
// -------------------------------------------------------
async function getAccessToken() {
  let browser = null;
  try {
    log('[INFO] Launching browser...');
    browser = await chromium.launch({ headless: false });
    log('[OK] Browser launched successfully.');

    browser.on('disconnected', () => {
      try {
        log('[INFO] Browser disconnected — enabling Start button.');
        onBrowserClose();
      } catch (e) {
        console.error('[INDEX] onBrowserClose callback error:', e.message);
      }
    });

    const context = await browser.newContext();
    const page    = await context.newPage();
    log('[INFO] New browser page created.');

    let accessToken = null;

    const tokenCaptured = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Token capture timed out after ' + (TOKEN_CAPTURE_TIMEOUT_MS / 1000) + 's'));
      }, TOKEN_CAPTURE_TIMEOUT_MS);

      page.on('response', async (response) => {
        if (!response.url().includes('/openid-connect/token')) return;
        try {
          const body = await response.json();
          if (body.access_token) {
            accessToken = body.access_token;
            clearTimeout(timeout);
            log('[OK] Access token captured successfully.');
            resolve(accessToken);
          }
        } catch (err) {
          log('[WARN] Response parse failed (non-token response skipped): ' + err.message);
        }
      });
    });

    log('[INFO] Navigating to login URL: ' + LOGIN_URL);
    await page.goto(LOGIN_URL);
    log('[OK] Login page loaded.');

    log('[INFO] Filling username...');
    await page.fill(SELECTORS.username_input, APP_USERNAME);
    log('[OK] Username filled.');

    log('[INFO] Filling password...');
    await page.fill(SELECTORS.password_input, APP_PASSWORD);
    log('[OK] Password filled.');

    log('[ACTION REQUIRED] Solve the CAPTCHA in the browser window.');
    log('[INFO] Waiting ' + (CAPTCHA_WAIT_MS / 1000) + ' seconds for CAPTCHA...');
    await page.waitForTimeout(CAPTCHA_WAIT_MS);
    log('[INFO] CAPTCHA wait complete. Waiting for token...');

    await tokenCaptured;

    log('[INFO] Closing browser...');
    await browser.close();
    log('[OK] Browser closed.');

    return accessToken;

  } catch (err) {
    log('[ERROR] getAccessToken failed: ' + err.message);
    if (browser) {
      try { await browser.close(); log('[INFO] Browser force-closed after error.'); }
      catch (e) { log('[WARN] Could not close browser: ' + e.message); }
    }
    throw err;
  }
}

// -------------------------------------------------------
// STEP 2A — FETCH DOCUMENT LIST — HEALTH CLAIMS
// -------------------------------------------------------
async function fetchDocumentListHealth(accessToken, claimNumber) {
  log('[INFO] [HEALTH] Fetching document list for claim: ' + claimNumber);
  try {
    const payload = Buffer.from(JSON.stringify({ claimNumber, caseType: '' })).toString('base64');
    log('[INFO] Payload encoded. Sending GET request to getClaimDocList...');

    const response = await axios.get(
      `${BASE_API_URL}/ilm/policyclaim/api/getClaimDocList`,
      {
        params:  { payload },
        headers: { auth: `Bearer ${accessToken}` },
      }
    );

    const docs = response.data?.responseData || [];
    log(`[OK] Document list fetched for ${claimNumber}. Found ${docs.length} document(s).`);

    if (docs.length === 0) {
      log('[WARN] No documents found for claim: ' + claimNumber);
    } else {
      docs.forEach((doc, i) => {
        log(`  [DOC ${i + 1}] ${doc.documentName} (ID: ${doc.documentId})`);
      });
    }

    return docs; // already has documentId + documentName

  } catch (err) {
    log('[ERROR] fetchDocumentListHealth failed for ' + claimNumber + ': ' +
      (err.response?.status ? 'HTTP ' + err.response.status + ' — ' : '') +
      (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    return [];
  }
}

// -------------------------------------------------------
// STEP 2B — FETCH DOCUMENT LIST — OPUS / OC CLAIMS
// -------------------------------------------------------
async function fetchDocumentListOpus(accessToken, claimNumber) {
  log('[INFO] [OPUS] Fetching document list for claim: ' + claimNumber);
  try {
    const response = await axios.post(
      `${OPUS_API_URL}/ilm/document/api/opusClaimDocDownload`,
      { claimNumber },
      {
        headers: {
          auth: `Bearer ${accessToken}`,
          'content-type': 'application/json;charset=UTF-8',
        },
      }
    );

    const status   = response.data?.responseData?.status;
    const docDetails = response.data?.responseData?.docDetails || [];

    if (status !== 'SUCCESS') {
      log('[WARN] opusClaimDocDownload returned non-SUCCESS status for: ' + claimNumber);
      log('[WARN] Response: ' + JSON.stringify(response.data));
      return [];
    }

    if (docDetails.length === 0) {
      log('[WARN] No documents found for OPUS claim: ' + claimNumber);
      return [];
    }

    log(`[OK] OPUS document list fetched for ${claimNumber}. Found ${docDetails.length} document(s).`);

    // Normalize to same shape as Health docs:
    // documentId  = documentIndex
    // documentName = docName
    const normalized = docDetails.map((doc, i) => {
      const normalized = {
        documentId:   doc.documentIndex,
        documentName: doc.docName,
        docName:      doc.docName,
      };
      log(`  [DOC ${i + 1}] ${normalized.documentName} (ID: ${normalized.documentId})`);
      return normalized;
    });

    return normalized;

  } catch (err) {
    log('[ERROR] fetchDocumentListOpus failed for ' + claimNumber + ': ' +
      (err.response?.status ? 'HTTP ' + err.response.status + ' — ' : '') +
      (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    return [];
  }
}

// -------------------------------------------------------
// STEP 2 — ROUTER: pick correct fetch based on claim type
// -------------------------------------------------------
async function fetchDocumentList(accessToken, claimNumber) {
  const type = getClaimType(claimNumber);
  log('[INFO] Claim type detected: ' + type + ' for ' + claimNumber);
  if (type === 'OPUS') {
    return fetchDocumentListOpus(accessToken, claimNumber);
  }
  return fetchDocumentListHealth(accessToken, claimNumber);
}

// -------------------------------------------------------
// SANITIZE FILENAME
// -------------------------------------------------------
function sanitizeFilename(filename) {
  if (!filename || filename.trim() === '') return 'unnamed_document';
  const ext   = path.extname(filename);
  const base  = path.basename(filename, ext);
  const clean = base
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100);
  return `${clean}${ext}`;
}

// -------------------------------------------------------
// STEP 3 — DOWNLOAD A SINGLE FILE
// -------------------------------------------------------
async function downloadPdf(accessToken, doc, outputDir) {
  const { claimNumber, documentId, documentName } = doc;

  // Guard: skip docs with no ID or no name
  if (!documentId || documentId.toString().trim() === '') {
    log('[WARN] Skipping doc with empty documentId for claim: ' + claimNumber);
    return { ok: false, name: documentName || 'unknown' };
  }

  try {
    const claimFolder = path.join(outputDir, claimNumber);
    fs.mkdirSync(claimFolder, { recursive: true });
    log('[OK] Claim folder ready: ' + claimFolder);

    const safeName = sanitizeFilename(documentName);

    // Handle duplicate filenames
    let finalPath = path.join(claimFolder, safeName);
    let counter   = 1;
    while (fs.existsSync(finalPath)) {
      const ext  = path.extname(safeName);
      const base = path.basename(safeName, ext);
      finalPath  = path.join(claimFolder, `${base}_${counter}${ext}`);
      counter++;
    }

    log('[INFO] Downloading: ' + safeName + ' (ID: ' + documentId + ')');

    const body = {
      documentId,
      externalId:   '',
      docType:      'VIEWPOLICYCLAIM',
      policyNumber: '',
      claimType:    doc.documentFetchType || 'REIMBURSEMENT',
      docName:      documentName,
    };

    log('[INFO] Sending POST request to downloadMedia for: ' + safeName);

    const response = await axios.post(
      `${DOWNLOAD_API_URL}/ilm/document/api/downloadMedia`,
      body,
      {
        params:  { documentId, externalId: '', docType: 'VIEWPOLICYCLAIM' },
        headers: {
          auth: `Bearer ${accessToken}`,
          'content-type': 'application/json;charset=UTF-8',
        },
        responseType: 'json',
      }
    );

    log('[INFO] Response received for: ' + safeName + '. Checking docData...');

    const base64Data = response.data?.responseData?.docData;

    if (!base64Data || base64Data.trim() === '') {
      log('[ERROR] No docData in response for "' + safeName + '". Skipping file.');
      return { ok: false, name: safeName };
    }

    log('[INFO] docData found. Decoding base64 for: ' + safeName);
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length === 0) {
      log('[ERROR] Decoded buffer is 0 bytes for "' + safeName + '". Skipping file.');
      return { ok: false, name: safeName };
    }

    log('[INFO] Base64 decoded successfully. Size: ' + buffer.length + ' bytes.');

    fs.writeFileSync(finalPath, buffer);
    log('[OK] File saved: ' + path.basename(finalPath) + ' → ' + finalPath);

    return { ok: true, name: safeName };

  } catch (err) {
    log('[ERROR] downloadPdf failed for "' + documentName + '": ' +
      (err.response?.status ? 'HTTP ' + err.response.status + ' — ' : '') +
      err.message);
    return { ok: false, name: documentName };
  }
}

// -------------------------------------------------------
// STEP 4 — DOWNLOAD ALL DOCS FOR A CLAIM
// -------------------------------------------------------
async function downloadAllDocuments(accessToken, claimNumber, outputDir) {
  try {
    const docs = await fetchDocumentList(accessToken, claimNumber);

    if (docs.length === 0) {
      log('[WARN] Skipping download for ' + claimNumber + ' — no documents.');
      return { success: 0, failed: 0 };
    }

    // Delete existing claim folder — always download fresh
    const claimFolder = path.join(outputDir, claimNumber);
    if (fs.existsSync(claimFolder)) {
      try {
        fs.rmSync(claimFolder, { recursive: true, force: true });
        log('[INFO] Existing folder deleted for fresh download: ' + claimFolder);
      } catch (err) {
        log('[WARN] Could not delete existing folder for ' + claimNumber + ': ' + err.message);
      }
    } else {
      log('[INFO] No existing folder found for ' + claimNumber + '. Creating fresh.');
    }

    log('[INFO] Starting PARALLEL download of ' + docs.length + ' file(s) for claim: ' + claimNumber);

    // Inject claimNumber into each doc object for folder creation
    const results = await Promise.all(
      docs.map(doc => downloadPdf(accessToken, { ...doc, claimNumber }, outputDir))
    );

    const successCount = results.filter(r => r.ok).length;
    const failCount    = results.filter(r => !r.ok).length;

    log(`[OK] Parallel download complete for ${claimNumber}: ${successCount} success, ${failCount} failed.`);
    log('========================================== ');
    log('Failed files for ' + claimNumber + ':');
    const failed = results.filter(r => !r.ok);
    if (failed.length > 0) {
      // log('[WARN] Failed files for ' + claimNumber + ':');
      failed.forEach(r => log('  [FAILED] ' + r.name));
    }
    log('==========================================');

    return { success: successCount, failed: failCount };

  } catch (err) {
    log('[ERROR] downloadAllDocuments crashed for ' + claimNumber + ': ' + err.message);
    return { success: 0, failed: 0 };
  }
}

// -------------------------------------------------------
// CROSS-PLATFORM DESKTOP PATH
// -------------------------------------------------------
function getOutputDir() {
  try {
    const outputDir = path.join(os.homedir(), 'Desktop', 'Bajaj-doc-Automation');
    fs.mkdirSync(outputDir, { recursive: true });
    log('[OK] Output directory ready: ' + outputDir);
    return outputDir;
  } catch (err) {
    log('[ERROR] Could not create output directory: ' + err.message);
    throw err;
  }
}

// -------------------------------------------------------
// MAIN RUN — called from main.js
// -------------------------------------------------------
async function run(rawInput) {
  try {
    log('============================================');
    log('  BAJAJ ALLIANZ — CLAIM DOCUMENT DOWNLOADER');
    log('============================================');

    const claimNumbers = parseClaimNumbers(rawInput);

    if (claimNumbers.length === 0) {
      log('[ERROR] No valid claim numbers entered. Aborting.');
      return;
    }

    log('[INFO] Parsed ' + claimNumbers.length + ' claim number(s):');
    claimNumbers.forEach(c => log('  - ' + c + ' [' + getClaimType(c) + ']'));

    const accessToken = await getAccessToken();
    log('[INFO] Token preview: ' + accessToken.substring(0, 20) + '...');

    const outputDir = getOutputDir();

    log('==========================================');
    log('  STARTING PARALLEL DOWNLOADS');
    log('==========================================');

    const summary = await Promise.all(
      claimNumbers.map(async (claimNumber) => {
        try {
          log('\n[INFO] >> Processing claim: ' + claimNumber + ' [' + getClaimType(claimNumber) + ']');
          const { success, failed } = await downloadAllDocuments(accessToken, claimNumber, outputDir);
          return { claimNumber, success, failed };
        } catch (err) {
          log('[ERROR] Claim ' + claimNumber + ' crashed: ' + err.message);
          return { claimNumber, success: 0, failed: 0 };
        }
      })
    );

    log('\n==========================================');
    log('  FINAL SUMMARY');
    log('==========================================');
    summary.forEach(({ claimNumber, success, failed }) => {
      log(`  ${claimNumber} [${getClaimType(claimNumber)}] → Downloaded: ${success} | Failed: ${failed}`);
    });
    log('[INFO] Files saved to: ' + outputDir);
    log('[OK] All done!');

  } catch (err) {
    log('[ERROR] Critical failure in run(): ' + err.message);
    log('[INFO] Automation stopped due to critical error. Other tasks were not affected.');
  }
}

module.exports = { run, setLogger, setBrowserCloseHandler, parseClaimNumbers };