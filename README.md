## Bajaj Claim Document Downloader (Electron)

This is a Windows desktop app (Electron + Playwright) that downloads claim documents for Bajaj claims.

You upload an **Excel (.xlsx)** file containing a **Claim No** column. The app reads claim numbers from Excel, then:
- Opens the browser for login (CAPTCHA / OTP)
- Fetches document list for each claim
- Downloads all available documents
- Saves files into folders on your Desktop

---

## Requirements (any system)
- **Windows 10/11**
- **Node.js (LTS recommended)**
- **Internet access** to the Bajaj portal/APIs used by this tool

### Verify Node + npm
Open PowerShell / CMD and run:

```bash
node -v
npm -v
```

---

## How to run (from a fresh download)

### 1) Download + extract
- Go to the GitHub repo
- Click **Code → Download ZIP**
- Extract anywhere (example: `C:\Projects\Bajaj-Doc-Download-Automation`)

### 2) Install dependencies
Open PowerShell / CMD inside the extracted folder and run:

```bash
npm install
```

### 3) Start the app

```bash
npm start
```

---

## How to use the app (Excel mode)
1. Click **Upload Excel (.xlsx)** and select your file
2. Click **Start**
3. Browser opens → solve **CAPTCHA** → enter **OTP**
4. Wait until it finishes (you’ll see a final summary in logs)

---

## Excel format
Your Excel file must contain a column:
- **Claim No**

Example:

| Claim No |
|---------|
| 260102320P |
| OC-XX-XXXX-XXXX-XXXXXXXX |

Notes:
- Empty rows are ignored
- Duplicate claim numbers are ignored (deduplicated)

---

## Output folder
Files are saved to:
- `Desktop → Bajaj-doc-Automation`

Each claim gets its own folder:
- `Desktop\Bajaj-doc-Automation\<CLAIM_NO>\...`

---

## Build EXE / portable app (Windows)
This project already has a packaging command.

### 1) Install dependencies (first time)

```bash
npm install
```

### 2) Build portable app

```bash
npm run package
```

Output:
- A folder will be created in `dist\`
- Inside it you will find the `.exe` (portable app)

---

## Project structure (for beginners)
- `index.html` : UI layout (Excel upload, Start button, logs, modal)
- `renderer.js` : UI logic (reads selected Excel file path, sends IPC to main)
- `preload.js` : safe bridge (IPC + helpers like getting file path)
- `main.js` : Electron main process (creates window, receives IPC, runs automation)
- `index.js` : automation logic (Playwright login + API calls + downloads)
- `config.json` : selectors + credentials + URLs (keep private)
- `package.json` : scripts + dependencies

---

## Troubleshooting

### “Please select an Excel (.xlsx) file before starting”
- Close and restart the app
- Re-select the Excel file
- Confirm the file is `.xlsx`

### Some claims/documents fail
The tool is designed to:
- log failures in **Live Logs**
- retry downloads for failed documents
- continue with the next claim

### `git push` fails with “Could not resolve host: github.com”
This is a DNS/network issue (not a code issue). Check internet/DNS and retry.

---

## Security note (important)
`config.json` contains login details. Do **not** share it publicly and do **not** commit real credentials to GitHub.

