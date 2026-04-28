

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
// const OPUS_API_URL     = 'https://webapi.bajajallianz.com';

// const TOKEN_CAPTURE_TIMEOUT_MS = 120_000;
// const CAPTCHA_WAIT_MS          = 30_000;

// // log will be injected by main.js so IPC works
// let log = console.log;

// function setLogger(fn) {
//   log = fn;
// }

// // onBrowserClose will be injected by main.js
// let onBrowserClose = () => {};

// function setBrowserCloseHandler(fn) {
//   onBrowserClose = fn;
// }

// // -------------------------------------------------------
// // DETECT CLAIM TYPE
// // OC-XX-XXXX-XXXX-XXXXXXXX  => 'OPUS'
// // everything else            => 'HEALTH'
// // -------------------------------------------------------
// function getClaimType(claimNumber) {
//   return claimNumber.trim().toUpperCase().startsWith('OC-') ? 'OPUS' : 'HEALTH';
// }

// // -------------------------------------------------------
// // PARSE CLAIM NUMBERS — supports comma AND/OR space
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
// // STEP 2A — FETCH DOCUMENT LIST — HEALTH CLAIMS
// // -------------------------------------------------------
// async function fetchDocumentListHealth(accessToken, claimNumber) {
//   log('[INFO] [HEALTH] Fetching document list for claim: ' + claimNumber);
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

//     return docs; // already has documentId + documentName

//   } catch (err) {
//     log('[ERROR] fetchDocumentListHealth failed for ' + claimNumber + ': ' +
//       (err.response?.status ? 'HTTP ' + err.response.status + ' — ' : '') +
//       (err.response?.data ? JSON.stringify(err.response.data) : err.message));
//     return [];
//   }
// }

// // -------------------------------------------------------
// // STEP 2B — FETCH DOCUMENT LIST — OPUS / OC CLAIMS
// // -------------------------------------------------------
// async function fetchDocumentListOpus(accessToken, claimNumber) {
//   log('[INFO] [OPUS] Fetching document list for claim: ' + claimNumber);
//   try {
//     const response = await axios.post(
//       `${OPUS_API_URL}/ilm/document/api/opusClaimDocDownload`,
//       { claimNumber },
//       {
//         headers: {
//           auth: `Bearer ${accessToken}`,
//           'content-type': 'application/json;charset=UTF-8',
//         },
//       }
//     );

//     const status   = response.data?.responseData?.status;
//     const docDetails = response.data?.responseData?.docDetails || [];

//     if (status !== 'SUCCESS') {
//       log('[WARN] opusClaimDocDownload returned non-SUCCESS status for: ' + claimNumber);
//       log('[WARN] Response: ' + JSON.stringify(response.data));
//       return [];
//     }

//     if (docDetails.length === 0) {
//       log('[WARN] No documents found for OPUS claim: ' + claimNumber);
//       return [];
//     }

//     log(`[OK] OPUS document list fetched for ${claimNumber}. Found ${docDetails.length} document(s).`);

//     // Normalize to same shape as Health docs:
//     // documentId  = documentIndex
//     // documentName = docName
//     const normalized = docDetails.map((doc, i) => {
//       const normalized = {
//         documentId:   doc.documentIndex,
//         documentName: doc.docName,
//         docName:      doc.docName,
//       };
//       log(`  [DOC ${i + 1}] ${normalized.documentName} (ID: ${normalized.documentId})`);
//       return normalized;
//     });

//     return normalized;

//   } catch (err) {
//     log('[ERROR] fetchDocumentListOpus failed for ' + claimNumber + ': ' +
//       (err.response?.status ? 'HTTP ' + err.response.status + ' — ' : '') +
//       (err.response?.data ? JSON.stringify(err.response.data) : err.message));
//     return [];
//   }
// }

// // -------------------------------------------------------
// // STEP 2 — ROUTER: pick correct fetch based on claim type
// // -------------------------------------------------------
// async function fetchDocumentList(accessToken, claimNumber) {
//   const type = getClaimType(claimNumber);
//   log('[INFO] Claim type detected: ' + type + ' for ' + claimNumber);
//   if (type === 'OPUS') {
//     return fetchDocumentListOpus(accessToken, claimNumber);
//   }
//   return fetchDocumentListHealth(accessToken, claimNumber);
// }

// // -------------------------------------------------------
// // SANITIZE FILENAME
// // -------------------------------------------------------
// function sanitizeFilename(filename) {
//   if (!filename || filename.trim() === '') return 'unnamed_document';
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

//   // Guard: skip docs with no ID or no name
//   if (!documentId || documentId.toString().trim() === '') {
//     log('[WARN] Skipping doc with empty documentId for claim: ' + claimNumber);
//     return { ok: false, name: documentName || 'unknown' };
//   }

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
//         headers: {
//           auth: `Bearer ${accessToken}`,
//           'content-type': 'application/json;charset=UTF-8',
//         },
//         responseType: 'json',
//       }
//     );

//     log('[INFO] Response received for: ' + safeName + '. Checking docData...');

//     const base64Data = response.data?.responseData?.docData;

//     if (!base64Data || base64Data.trim() === '') {
//       log('[ERROR] No docData in response for "' + safeName + '". Skipping file.');
//       return { ok: false, name: safeName };
//     }

//     log('[INFO] docData found. Decoding base64 for: ' + safeName);
//     const buffer = Buffer.from(base64Data, 'base64');

//     if (buffer.length === 0) {
//       log('[ERROR] Decoded buffer is 0 bytes for "' + safeName + '". Skipping file.');
//       return { ok: false, name: safeName };
//     }

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
// // STEP 4 — DOWNLOAD ALL DOCS FOR A CLAIM
// // -------------------------------------------------------
// async function downloadAllDocuments(accessToken, claimNumber, outputDir) {
//   try {
//     const docs = await fetchDocumentList(accessToken, claimNumber);

//     if (docs.length === 0) {
//       log('[WARN] Skipping download for ' + claimNumber + ' — no documents.');
//       return { success: 0, failed: 0 };
//     }

//     // Delete existing claim folder — always download fresh
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

//     // Inject claimNumber into each doc object for folder creation
//     const results = await Promise.all(
//       docs.map(doc => downloadPdf(accessToken, { ...doc, claimNumber }, outputDir))
//     );

//     const successCount = results.filter(r => r.ok).length;
//     const failCount    = results.filter(r => !r.ok).length;

//     log(`[OK] Parallel download complete for ${claimNumber}: ${successCount} success, ${failCount} failed.`);
//     log('========================================== ');
//     log('Failed files for ' + claimNumber + ':');
//     const failed = results.filter(r => !r.ok);
//     if (failed.length > 0) {
//       // log('[WARN] Failed files for ' + claimNumber + ':');
//       failed.forEach(r => log('  [FAILED] ' + r.name));
//     }
//     log('==========================================');

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
//     claimNumbers.forEach(c => log('  - ' + c + ' [' + getClaimType(c) + ']'));

//     const accessToken = await getAccessToken();
//     log('[INFO] Token preview: ' + accessToken.substring(0, 20) + '...');

//     const outputDir = getOutputDir();

//     log('==========================================');
//     log('  STARTING PARALLEL DOWNLOADS');
//     log('==========================================');

//     const summary = await Promise.all(
//       claimNumbers.map(async (claimNumber) => {
//         try {
//           log('\n[INFO] >> Processing claim: ' + claimNumber + ' [' + getClaimType(claimNumber) + ']');
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
//       log(`  ${claimNumber} [${getClaimType(claimNumber)}] → Downloaded: ${success} | Failed: ${failed}`);
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
 * ===============================
 * ==================================
 * ======================================
 */

'use strict';

const { chromium }   = require('playwright');
const axios          = require('axios');
const fs             = require('fs');
const path           = require('path');
const os             = require('os');
const XLSX           = require('xlsx');

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
const MAX_RETRIES              = 3; // max retry rounds for failed docs per claim

// log will be injected by main.js so IPC works
let log = console.log;
function setLogger(fn) { log = fn; }

// onBrowserClose will be injected by main.js
let onBrowserClose = () => {};
function setBrowserCloseHandler(fn) { onBrowserClose = fn; }

// -------------------------------------------------------
// SLEEP HELPER
// -------------------------------------------------------
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
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
// READ CLAIM NUMBERS FROM EXCEL (.xlsx)
// Requires a column named "Claim No" (case-insensitive)
// -------------------------------------------------------
function readClaimsFromExcel(excelPath) {
  if (!excelPath || typeof excelPath !== 'string') {
    throw new Error('Excel file path is missing.');
  }

  const ext = path.extname(excelPath).toLowerCase();
  if (ext !== '.xlsx') {
    throw new Error('Please upload a valid .xlsx Excel file.');
  }

  if (!fs.existsSync(excelPath)) {
    throw new Error('Excel file not found: ' + excelPath);
  }

  const workbook = XLSX.readFile(excelPath, { cellDates: true });
  const firstSheetName = workbook.SheetNames && workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Excel file has no sheets.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rows || rows.length === 0) {
    return [];
  }

  const headerKeys = Object.keys(rows[0] || {});
  const claimKey = headerKeys.find(k => String(k).trim().toLowerCase() === 'claim no');
  if (!claimKey) {
    throw new Error('Excel must contain a column named "Claim No".');
  }

  const claims = [];
  const seen = new Set();

  for (const r of rows) {
    const v = String(r[claimKey] ?? '').trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    claims.push(v);
  }

  return claims;
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
// Throws on failure so retry wrapper can catch it
// -------------------------------------------------------
async function fetchDocumentListHealth(accessToken, claimNumber) {
  log('[INFO] [HEALTH] Fetching document list for claim: ' + claimNumber);

  const payload = Buffer.from(JSON.stringify({ claimNumber, caseType: '' })).toString('base64');
  log('[INFO] Payload encoded. Sending GET request to getClaimDocList...');

  const response = await axios.get(
    `${BASE_API_URL}/ilm/policyclaim/api/getClaimDocList`,
    {
      params:  { payload },
      headers: { auth: `Bearer ${accessToken}` },
      timeout: 30_000,
    }
  );

  const docs = response.data?.responseData || [];
  log(`[OK] Document list fetched for ${claimNumber}. Found ${docs.length} document(s).`);

  if (docs.length === 0) {
    log('[WARN] No documents found for claim: ' + claimNumber);
  } else {
    docs.forEach((doc, i) => log(`  [DOC ${i + 1}] ${doc.documentName} (ID: ${doc.documentId})`));
  }

  return docs;
}

// -------------------------------------------------------
// STEP 2B — FETCH DOCUMENT LIST — OPUS / OC CLAIMS
// Throws on failure so retry wrapper can catch it
// -------------------------------------------------------
async function fetchDocumentListOpus(accessToken, claimNumber) {
  log('[INFO] [OPUS] Fetching document list for claim: ' + claimNumber);

  const response = await axios.post(
    `${OPUS_API_URL}/ilm/document/api/opusClaimDocDownload`,
    { claimNumber },
    {
      headers: {
        auth: `Bearer ${accessToken}`,
        'content-type': 'application/json;charset=UTF-8',
      },
      timeout: 30_000,
    }
  );

  const status     = response.data?.responseData?.status;
  const docDetails = response.data?.responseData?.docDetails || [];

  if (status !== 'SUCCESS') {
    throw new Error('opusClaimDocDownload non-SUCCESS: ' + JSON.stringify(response.data));
  }

  if (docDetails.length === 0) {
    log('[WARN] No documents found for OPUS claim: ' + claimNumber);
    return [];
  }

  log(`[OK] OPUS document list fetched for ${claimNumber}. Found ${docDetails.length} document(s).`);

  const normalized = docDetails.map((doc, i) => {
    const norm = {
      documentId:   doc.documentIndex,
      documentName: doc.docName,
      docName:      doc.docName,
    };
    log(`  [DOC ${i + 1}] ${norm.documentName} (ID: ${norm.documentId})`);
    return norm;
  });

  return normalized;
}

// -------------------------------------------------------
// STEP 2 — FETCH DOCUMENT LIST WITH RETRY
// Retries up to MAX_RETRIES times if the server fails
// Returns null if all attempts fail (fetch itself broken)
// -------------------------------------------------------
async function fetchDocumentList(accessToken, claimNumber) {
  const type = getClaimType(claimNumber);
  log('[INFO] Claim type detected: ' + type + ' for ' + claimNumber);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (type === 'OPUS') {
        return await fetchDocumentListOpus(accessToken, claimNumber);
      } else {
        return await fetchDocumentListHealth(accessToken, claimNumber);
      }
    } catch (err) {
      const isLast = attempt === MAX_RETRIES;
      const errMsg = (err.response?.status ? 'HTTP ' + err.response.status + ' — ' : '') +
                     (err.response?.data ? JSON.stringify(err.response.data) : err.message);

      if (isLast) {
        log(`[ERROR] fetchDocumentList failed for ${claimNumber} after ${MAX_RETRIES} attempts: ` + errMsg);
        return null; // null = fetch itself failed permanently
      }

      const waitMs = 3000 * attempt; // 3s, 6s
      log(`[RETRY] fetchDocumentList attempt ${attempt}/${MAX_RETRIES} failed for ${claimNumber}: ${errMsg} — retrying in ${waitMs / 1000}s...`);
      await sleep(waitMs);
    }
  }
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
// Always returns { ok, name, claimNumber, doc }
// doc is included on failure so retry rounds can reuse it
// doc: null = not retryable (empty documentId)
// -------------------------------------------------------
async function downloadPdf(accessToken, doc, outputDir) {
  const { claimNumber, documentId, documentName } = doc;

  if (!documentId || documentId.toString().trim() === '') {
    log('[WARN] Skipping doc with empty documentId for claim: ' + claimNumber);
    return { ok: false, name: documentName || 'unknown', claimNumber, doc: null };
  }

  try {
    const claimFolder = path.join(outputDir, claimNumber);
    fs.mkdirSync(claimFolder, { recursive: true });

    const safeName = sanitizeFilename(documentName);

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

    const response = await axios.post(
      `${DOWNLOAD_API_URL}/ilm/document/api/downloadMedia`,
      body,
      {
        params:  { documentId, externalId: '', docType: 'VIEWPOLICYCLAIM' },
        headers: {
          auth:           `Bearer ${accessToken}`,
          'content-type': 'application/json;charset=UTF-8',
        },
        responseType: 'json',
        timeout:      60_000, // 60s — large files need more time
      }
    );

    const base64Data = response.data?.responseData?.docData;

    if (!base64Data || base64Data.trim() === '') {
      log('[ERROR] No docData in response for "' + safeName + '". Will retry.');
      return { ok: false, name: safeName, claimNumber, doc };
    }

    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length === 0) {
      log('[ERROR] Decoded buffer is 0 bytes for "' + safeName + '". Will retry.');
      return { ok: false, name: safeName, claimNumber, doc };
    }

    fs.writeFileSync(finalPath, buffer);
    log('[OK] File saved: ' + path.basename(finalPath));

    return { ok: true, name: safeName, claimNumber };

  } catch (err) {
    log('[ERROR] downloadPdf failed for "' + documentName + '": ' +
      (err.response?.status ? 'HTTP ' + err.response.status + ' — ' : '') +
      err.message);
    return { ok: false, name: documentName, claimNumber, doc };
  }
}

// -------------------------------------------------------
// STEP 4 — DOWNLOAD ALL DOCS FOR ONE CLAIM
//
// Flow per claim:
//   1. Fetch doc list (with retry if server fails)
//   2. Round 1 → Promise.all() ALL docs at once
//   3. Round 2 → Promise.all() only FAILED docs  (wait 3s)
//   4. Round 3 → Promise.all() still FAILED docs (wait 6s)
//   5. Round 4 → Promise.all() still FAILED docs (wait 9s)
//   6. Anything still failing → permanently failed
// -------------------------------------------------------
async function downloadAllDocuments(accessToken, claimNumber, outputDir) {
  try {
    // Fetch doc list — has its own retry built in
    const docs = await fetchDocumentList(accessToken, claimNumber);

    // null = fetch API itself failed after all retries
    if (docs === null) {
      log(`[ERROR] Could not fetch document list for ${claimNumber} — marking as fetch-failed.`);
      return { success: 0, failed: 0, fetchFailed: true, permanentFailures: [] };
    }

    if (docs.length === 0) {
      log('[WARN] No documents found for: ' + claimNumber);
      return { success: 0, failed: 0, fetchFailed: false, permanentFailures: [] };
    }

    // Delete existing folder — always fresh download
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

    // ── ROUND 1: download ALL docs in parallel ────────────────────────────
    log(`[INFO] Round 1: Downloading all ${docs.length} file(s) for ${claimNumber} in parallel...`);

    let results = await Promise.all(
      docs.map(doc => downloadPdf(accessToken, { ...doc, claimNumber }, outputDir))
    );

    let successCount  = results.filter(r => r.ok).length;
    let failedResults = results.filter(r => !r.ok && r.doc !== null); // only retryable

    log(`[INFO] Round 1 done → Success: ${successCount} | Failed: ${failedResults.length}`);

    // ── RETRY ROUNDS 2, 3, 4 — only the failed docs ──────────────────────
    for (let attempt = 1; attempt <= MAX_RETRIES && failedResults.length > 0; attempt++) {
      const waitMs = 3000 * attempt; // 3s → 6s → 9s
      log(`[RETRY] Waiting ${waitMs / 1000}s before retry round ${attempt + 1}...`);
      await sleep(waitMs);

      log(`[RETRY] Round ${attempt + 1}: Retrying ${failedResults.length} failed file(s) for ${claimNumber}...`);

      const retryResults = await Promise.all(
        failedResults.map(r => downloadPdf(accessToken, { ...r.doc, claimNumber }, outputDir))
      );

      const recovered = retryResults.filter(r => r.ok).length;
      successCount   += recovered;
      failedResults   = retryResults.filter(r => !r.ok && r.doc !== null);

      log(`[INFO] Round ${attempt + 1} done → Recovered: ${recovered} | Still failing: ${failedResults.length}`);
    }

    // ── RESULT ────────────────────────────────────────────────────────────
    log('==========================================');
    log(`[OK] Claim ${claimNumber} done: ${successCount} downloaded | ${failedResults.length} permanently failed.`);

    if (failedResults.length > 0) {
      log(`[FAILED] Permanent failures for ${claimNumber}:`);
      failedResults.forEach(r => log(`  ✗ ${r.name}`));
    }
    log('==========================================');

    return {
      success:          successCount,
      failed:           failedResults.length,
      fetchFailed:      false,
      permanentFailures: failedResults,
    };

  } catch (err) {
    log('[ERROR] downloadAllDocuments crashed for ' + claimNumber + ': ' + err.message);
    return { success: 0, failed: 0, fetchFailed: false, permanentFailures: [] };
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
//
// KEY CHANGE: claims are processed ONE BY ONE (sequential)
// Within each claim: all docs download in parallel (Promise.all)
// Failed docs are retried up to MAX_RETRIES times (still parallel)
// Only after one claim is fully done does the next claim start
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
    claimNumbers.forEach((c, i) => log(`  ${i + 1}. ${c} [${getClaimType(c)}]`));

    const accessToken = await getAccessToken();
    log('[INFO] Token preview: ' + accessToken.substring(0, 20) + '...');

    const outputDir = getOutputDir();

    log('==========================================');
    log('  STARTING DOWNLOADS — ONE CLAIM AT A TIME');
    log('==========================================');

    const summary = [];

    // ── SEQUENTIAL: finish one claim completely before starting the next ──
    for (let i = 0; i < claimNumbers.length; i++) {
      const claimNumber = claimNumbers[i];
      log(`\n[INFO] ========== Claim ${i + 1}/${claimNumbers.length}: ${claimNumber} [${getClaimType(claimNumber)}] ==========`);

      try {
        const result = await downloadAllDocuments(accessToken, claimNumber, outputDir);
        summary.push({ claimNumber, ...result });
      } catch (err) {
        log('[ERROR] Claim ' + claimNumber + ' crashed: ' + err.message);
        summary.push({ claimNumber, success: 0, failed: 0, fetchFailed: false, permanentFailures: [] });
      }
    }

    // ── FINAL SUMMARY ─────────────────────────────────────────────────────
    log('\n==========================================');
    log('  FINAL SUMMARY');
    log('==========================================');

    const allPermanentFailures = [];
    const fetchFailedClaims    = [];

    summary.forEach(({ claimNumber, success, failed, fetchFailed, permanentFailures }) => {
      if (fetchFailed) {
        log(`  ⚠ ${claimNumber} [${getClaimType(claimNumber)}] → DOCUMENT LIST FETCH FAILED (server error)`);
        fetchFailedClaims.push(claimNumber);
      } else {
        const icon = failed === 0 ? '✓' : '✗';
        log(`  ${icon} ${claimNumber} [${getClaimType(claimNumber)}] → Downloaded: ${success} | Permanently Failed: ${failed}`);
        if (permanentFailures?.length > 0) {
          allPermanentFailures.push({ claimNumber, failures: permanentFailures });
        }
      }
    });

    // Claims where doc list fetch itself failed
    if (fetchFailedClaims.length > 0) {
      log('\n==========================================');
      log('  CLAIMS WHERE DOC LIST COULD NOT BE FETCHED');
      log('==========================================');
      fetchFailedClaims.forEach(c => {
        log(`  ⚠ Claim: ${c} — server timed out. Please retry this claim manually.`);
      });
    }

    // Files that failed to download even after all retries
    if (allPermanentFailures.length > 0) {
      log('\n==========================================');
      log(`  PERMANENTLY FAILED FILES (after ${MAX_RETRIES} retries)`);
      log('==========================================');
      allPermanentFailures.forEach(({ claimNumber, failures }) => {
        log(`  Claim: ${claimNumber}`);
        failures.forEach(r => log(`    ✗ ${r.name}`));
      });
      log('\n[INFO] Above files could not be downloaded. Please check manually.');
    }

    if (fetchFailedClaims.length === 0 && allPermanentFailures.length === 0) {
      log('\n[OK] All documents downloaded successfully!');
      // Always show permanently failed files section at the very end
      log('\n==========================================');
      log(`  PERMANENTLY FAILED FILES (after ${MAX_RETRIES} retries)`);
      log('==========================================');

      if (fetchFailedClaims.length === 0 && allPermanentFailures.length === 0) {
        log('  ✓ None — all files downloaded successfully!');
      } else {
        if (fetchFailedClaims.length > 0) {
          fetchFailedClaims.forEach(c => {
            log(`  Claim: ${c}`);
            log(`    ✗ Document list could not be fetched (server error) — retry manually.`);
          });
        }
        if (allPermanentFailures.length > 0) {
          allPermanentFailures.forEach(({ claimNumber, failures }) => {
            log(`  Claim: ${claimNumber}`);
            failures.forEach(r => log(`    ✗ ${r.name}`));
          });
        }
        log('\n[INFO] Above files could not be downloaded. Please check manually.');
      }
    }

    log('\n[INFO] Files saved to: ' + outputDir);
    log('[OK] All done!');

  } catch (err) {
    log('[ERROR] Critical failure in run(): ' + err.message);
    log('[INFO] Automation stopped due to critical error. Other tasks were not affected.');
  }
}

// -------------------------------------------------------
// MAIN RUN FROM EXCEL — called from main.js
// Excel parsing happens BEFORE browser/token launch
// -------------------------------------------------------
async function runFromExcel(excelPath) {
  try {
    log('============================================');
    log('  BAJAJ ALLIANZ — CLAIM DOCUMENT DOWNLOADER');
    log('============================================');

    log('[INFO] Reading claims from Excel: ' + excelPath);

    // ✅ BEFORE browser launching:
    const claimNumbers = readClaimsFromExcel(excelPath);

    if (claimNumbers.length === 0) {
      log('[ERROR] No valid claim numbers found in Excel. Aborting.');
      return;
    }

    log('[INFO] Parsed ' + claimNumbers.length + ' claim number(s) from Excel:');
    claimNumbers.forEach((c, i) => log(`  ${i + 1}. ${c} [${getClaimType(c)}]`));

    // 🚀 Browser launches after this point
    const accessToken = await getAccessToken();
    log('[INFO] Token preview: ' + accessToken.substring(0, 20) + '...');

    const outputDir = getOutputDir();

    log('==========================================');
    log('  STARTING DOWNLOADS — ONE CLAIM AT A TIME');
    log('==========================================');

    const summary = [];

    for (let i = 0; i < claimNumbers.length; i++) {
      const claimNumber = claimNumbers[i];
      log(`\n[INFO] ========== Claim ${i + 1}/${claimNumbers.length}: ${claimNumber} [${getClaimType(claimNumber)}] ==========`);

      try {
        const result = await downloadAllDocuments(accessToken, claimNumber, outputDir);
        summary.push({ claimNumber, ...result });
      } catch (err) {
        log('[ERROR] Claim ' + claimNumber + ' crashed: ' + err.message);
        summary.push({ claimNumber, success: 0, failed: 0, fetchFailed: false, permanentFailures: [] });
      }
    }

    log('\n==========================================');
    log('  FINAL SUMMARY');
    log('==========================================');

    const allPermanentFailures = [];
    const fetchFailedClaims    = [];

    summary.forEach(({ claimNumber, success, failed, fetchFailed, permanentFailures }) => {
      if (fetchFailed) {
        log(`  ⚠ ${claimNumber} [${getClaimType(claimNumber)}] → DOCUMENT LIST FETCH FAILED (server error)`);
        fetchFailedClaims.push(claimNumber);
      } else {
        const icon = failed === 0 ? '✓' : '✗';
        log(`  ${icon} ${claimNumber} [${getClaimType(claimNumber)}] → Downloaded: ${success} | Permanently Failed: ${failed}`);
        if (permanentFailures?.length > 0) {
          allPermanentFailures.push({ claimNumber, failures: permanentFailures });
        }
      }
    });

    if (fetchFailedClaims.length > 0) {
      log('\n==========================================');
      log('  CLAIMS WHERE DOC LIST COULD NOT BE FETCHED');
      log('==========================================');
      fetchFailedClaims.forEach(c => {
        log(`  ⚠ Claim: ${c} — server timed out. Please retry this claim manually.`);
      });
    }

    if (allPermanentFailures.length > 0) {
      log('\n==========================================');
      log(`  PERMANENTLY FAILED FILES (after ${MAX_RETRIES} retries)`);
      log('==========================================');
      allPermanentFailures.forEach(({ claimNumber, failures }) => {
        log(`  Claim: ${claimNumber}`);
        failures.forEach(r => log(`    ✗ ${r.name}`));
      });
      log('\n[INFO] Above files could not be downloaded. Please check manually.');
    }

    if (fetchFailedClaims.length === 0 && allPermanentFailures.length === 0) {
      log('\n[OK] All documents downloaded successfully!');
      log('\n==========================================');
      log(`  PERMANENTLY FAILED FILES (after ${MAX_RETRIES} retries)`);
      log('==========================================');
      log('  ✓ None — all files downloaded successfully!');
    }

    log('\n[INFO] Files saved to: ' + outputDir);
    log('[OK] All done!');

  } catch (err) {
    log('[ERROR] Critical failure in runFromExcel(): ' + err.message);
    log('[INFO] Automation stopped due to critical error. Other tasks were not affected.');
  }
}

module.exports = { run, runFromExcel, setLogger, setBrowserCloseHandler, parseClaimNumbers };