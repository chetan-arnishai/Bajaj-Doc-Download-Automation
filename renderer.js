// 'use strict';

// // -------------------------------------------------------
// // DOM REFERENCES
// // -------------------------------------------------------
// const claimInput   = document.getElementById('claimInput');
// const btnStart     = document.getElementById('btnStart');
// const btnHow       = document.getElementById('btnHow');
// const logWindow    = document.getElementById('logWindow');
// const banner       = document.getElementById('banner');
// const runBadge     = document.getElementById('runBadge');
// const popup        = document.getElementById('popup');

// let runCount = 1;
// let isRunning = false;

// // -------------------------------------------------------
// // LOGGING — appends a line to the log window with timestamp
// // -------------------------------------------------------
// function appendLog(message) {
//   try {
//     // Remove initial placeholder if present
//     const placeholder = logWindow.querySelector('span');
//     if (placeholder) placeholder.remove();

//     const now = new Date();
//     const timestamp =
//       String(now.getHours()).padStart(2, '0') + ':' +
//       String(now.getMinutes()).padStart(2, '0') + ':' +
//       String(now.getSeconds()).padStart(2, '0');

//     const line = document.createElement('div');
//     line.style.marginBottom = '2px';

//     // Color code by prefix
//     if (message.includes('[OK]')) {
//       line.style.color = '#2e7d32';
//     } else if (message.includes('[ERROR]')) {
//       line.style.color = '#c62828';
//     } else if (message.includes('[WARN]')) {
//       line.style.color = '#e65100';
//     } else if (message.includes('[ACTION REQUIRED]')) {
//       line.style.color = '#6a1b9a';
//       line.style.fontWeight = 'bold';
//     } else {
//       line.style.color = '#222';
//     }

//     line.textContent = `[${timestamp}] ${message}`;
//     logWindow.appendChild(line);

//     // Auto-scroll to bottom
//     logWindow.scrollTop = logWindow.scrollHeight;

//   } catch (err) {
//     console.error('[RENDERER] appendLog error:', err.message);
//   }
// }

// // -------------------------------------------------------
// // SEPARATOR LINE in log
// // -------------------------------------------------------
// function appendSeparator() {
//   try {
//     const hr = document.createElement('hr');
//     hr.style.border = 'none';
//     hr.style.borderTop = '1px dashed #bbb';
//     hr.style.margin = '5px 0';
//     logWindow.appendChild(hr);
//     logWindow.scrollTop = logWindow.scrollHeight;
//   } catch (err) {
//     console.error('[RENDERER] appendSeparator error:', err.message);
//   }
// }

// // -------------------------------------------------------
// // BANNER — shows status at top
// // -------------------------------------------------------
// function setBanner(status) {
//   try {
//     banner.className = 'banner';
//     switch (status) {
//       case 'running':
//         banner.classList.add('running');
//         banner.textContent = '⏳ Automation is running… Do NOT touch keyboard or mouse.';
//         break;
//       case 'success':
//         banner.classList.add('success');
//         banner.textContent = '✅ Automation completed successfully!';
//         break;
//       case 'error':
//         banner.classList.add('error');
//         banner.textContent = '❌ Automation encountered an error. Check logs below.';
//         break;
//       case 'stopped':
//         banner.classList.add('stopped');
//         banner.textContent = '⚠️ Automation stopped.';
//         break;
//       default:
//         banner.style.display = 'none';
//         return;
//     }
//   } catch (err) {
//     console.error('[RENDERER] setBanner error:', err.message);
//   }
// }

// // -------------------------------------------------------
// // SET UI STATE — enable/disable controls during run
// // -------------------------------------------------------
// function setRunning(running) {
//   try {
//     isRunning = running;
//     btnStart.disabled  = running;
//     claimInput.disabled = running;
//     btnStart.textContent = running ? '⏳ Running…' : '▶ Start';
//   } catch (err) {
//     console.error('[RENDERER] setRunning error:', err.message);
//   }
// }

// // -------------------------------------------------------
// // START BUTTON CLICK
// // -------------------------------------------------------
// btnStart.addEventListener('click', () => {
//   try {
//     if (isRunning) return;

//     const raw = claimInput.value.trim();

//     if (!raw) {
//       appendLog('[ERROR] Please enter at least one claim number before starting.');
//       setBanner('error');
//       return;
//     }

//     // Clear previous logs
//     logWindow.innerHTML = '';
//     appendSeparator();
//     appendLog('[INFO] ========== RUN #' + runCount + ' STARTED ==========');
//     appendSeparator();
//     appendLog('[INFO] Raw input: ' + raw);

//     setBanner('running');
//     setRunning(true);

//     // Send to main process
//     window.electronAPI.startAutomation(raw);

//   } catch (err) {
//     console.error('[RENDERER] btnStart click error:', err.message);
//     appendLog('[ERROR] UI error on start: ' + err.message);
//     setRunning(false);
//     setBanner('error');
//   }
// });

// // -------------------------------------------------------
// // RECEIVE LOGS FROM MAIN PROCESS
// // -------------------------------------------------------
// window.electronAPI.onLog((message) => {
//   try {
//     appendLog(message);
//   } catch (err) {
//     console.error('[RENDERER] onLog error:', err.message);
//   }
// });

// // -------------------------------------------------------
// // RECEIVE STATUS FROM MAIN PROCESS
// // -------------------------------------------------------
// window.electronAPI.onStatus((status) => {
//   try {
//     setBanner(status);
//     setRunning(false);

//     if (status === 'success' || status === 'error') {
//       appendSeparator();
//       appendLog('[INFO] ========== RUN #' + runCount + ' ENDED ==========');
//       appendSeparator();
//       runBadge.textContent = 'Run #' + (++runCount);
//     }

//   } catch (err) {
//     console.error('[RENDERER] onStatus error:', err.message);
//   }
// });

// // -------------------------------------------------------
// // HOW TO RUN MODAL
// // -------------------------------------------------------
// btnHow.addEventListener('click', () => {
//   try {
//     popup.classList.add('open');
//     popup.setAttribute('aria-hidden', 'false');
//   } catch (err) {
//     console.error('[RENDERER] btnHow error:', err.message);
//   }
// });

// popup.addEventListener('click', (e) => {
//   try {
//     if (e.target === popup) {
//       popup.classList.remove('open');
//       popup.setAttribute('aria-hidden', 'true');
//     }
//   } catch (err) {
//     console.error('[RENDERER] popup click error:', err.message);
//   }
// });

// // -------------------------------------------------------
// // CLEANUP ON WINDOW UNLOAD
// // -------------------------------------------------------
// window.addEventListener('beforeunload', () => {
//   try {
//     window.electronAPI.removeAllListeners();
//   } catch (err) {
//     console.error('[RENDERER] cleanup error:', err.message);
//   }
// });


'use strict';

// -------------------------------------------------------
// DOM REFERENCES
// -------------------------------------------------------
const claimInput   = document.getElementById('claimInput');
const btnStart     = document.getElementById('btnStart');
const btnHow       = document.getElementById('btnHow');
const logWindow    = document.getElementById('logWindow');
const banner       = document.getElementById('banner');
const runBadge     = document.getElementById('runBadge');
const popup        = document.getElementById('popup');

let runCount = 1;
let isRunning = false;

// -------------------------------------------------------
// LOGGING — appends a line to the log window with timestamp
// -------------------------------------------------------
function appendLog(message) {
  try {
    const placeholder = logWindow.querySelector('span');
    if (placeholder) placeholder.remove();

    const now = new Date();
    const timestamp =
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');

    const line = document.createElement('div');
    line.style.marginBottom = '2px';

    if (message.includes('[OK]')) {
      line.style.color = '#222';
    } else if (message.includes('[ERROR]')) {
      line.style.color = '#222';
    } else if (message.includes('[WARN]')) {
      line.style.color = '#222';
    } else if (message.includes('[ACTION REQUIRED]')) {
      line.style.color = '#222';
      line.style.fontWeight = 'bold';
    } else {
      line.style.color = '#222';
    }

    line.textContent = `[${timestamp}] ${message}`;
    logWindow.appendChild(line);
    logWindow.scrollTop = logWindow.scrollHeight;

  } catch (err) {
    console.error('[RENDERER] appendLog error:', err.message);
  }
}

// -------------------------------------------------------
// SEPARATOR LINE
// -------------------------------------------------------
function appendSeparator() {
  try {
    const hr = document.createElement('hr');
    hr.style.border = 'none';
    hr.style.borderTop = '1px dashed #bbb';
    hr.style.margin = '5px 0';
    logWindow.appendChild(hr);
    logWindow.scrollTop = logWindow.scrollHeight;
  } catch (err) {
    console.error('[RENDERER] appendSeparator error:', err.message);
  }
}

// -------------------------------------------------------
// BANNER
// -------------------------------------------------------
function setBanner(status) {
  try {
    banner.className = 'banner';
    switch (status) {
      case 'running':
        banner.classList.add('running');
        banner.textContent = '⏳ Automation is running… Do NOT touch keyboard or mouse.';
        break;
      case 'success':
        banner.classList.add('success');
        banner.textContent = '✅ Automation completed successfully!';
        break;
      case 'error':
        banner.classList.add('error');
        banner.textContent = '❌ Automation encountered an error. Check logs below.';
        break;
      case 'stopped':
        banner.classList.add('stopped');
        banner.textContent = '⚠️ Automation stopped.';
        break;
      default:
        banner.style.display = 'none';
        return;
    }
  } catch (err) {
    console.error('[RENDERER] setBanner error:', err.message);
  }
}

// -------------------------------------------------------
// SET RUNNING STATE — disables button + shows spinner
// -------------------------------------------------------
function setRunning(running) {
  try {
    isRunning = running;
    claimInput.disabled = running;

    if (running) {
      btnStart.disabled = true;
      btnStart.innerHTML = `
        <span style="
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 6px;
        "></span>Running…`;
    } else {
      btnStart.disabled = false;
      btnStart.innerHTML = '▶ Start';
    }

  } catch (err) {
    console.error('[RENDERER] setRunning error:', err.message);
  }
}

// -------------------------------------------------------
// START BUTTON CLICK — debounced with isRunning guard
// -------------------------------------------------------
btnStart.addEventListener('click', () => {
  try {
    if (isRunning) return;

    const raw = claimInput.value.trim();

    if (!raw) {
      appendLog('[ERROR] Please enter at least one claim number before starting.');
      setBanner('error');
      return;
    }

    logWindow.innerHTML = '';
    appendSeparator();
    appendLog('[INFO] ========== RUN #' + runCount + ' STARTED ==========');
    appendSeparator();
    appendLog('[INFO] Raw input: ' + raw);

    setBanner('running');
    setRunning(true);

    window.electronAPI.startAutomation(raw);

  } catch (err) {
    console.error('[RENDERER] btnStart click error:', err.message);
    appendLog('[ERROR] UI error on start: ' + err.message);
    setRunning(false);
    setBanner('error');
  }
});

// -------------------------------------------------------
// RECEIVE LOGS FROM MAIN PROCESS
// -------------------------------------------------------
window.electronAPI.onLog((message) => {
  try {
    appendLog(message);
  } catch (err) {
    console.error('[RENDERER] onLog error:', err.message);
  }
});

// -------------------------------------------------------
// RECEIVE STATUS FROM MAIN PROCESS
// -------------------------------------------------------
window.electronAPI.onStatus((status) => {
  try {
    setBanner(status);

    if (status === 'success' || status === 'error') {
      setRunning(false);
      appendSeparator();
      appendLog('[INFO] ========== RUN #' + runCount + ' ENDED ==========');
      appendSeparator();
      runBadge.textContent = 'Run #' + (++runCount);
    }

  } catch (err) {
    console.error('[RENDERER] onStatus error:', err.message);
    // Safety fallback — always re-enable button if status handler crashes
    setRunning(false);
  }
});

// -------------------------------------------------------
// HOW TO RUN MODAL
// -------------------------------------------------------
btnHow.addEventListener('click', () => {
  try {
    popup.classList.add('open');
    popup.setAttribute('aria-hidden', 'false');
  } catch (err) {
    console.error('[RENDERER] btnHow error:', err.message);
  }
});

popup.addEventListener('click', (e) => {
  try {
    if (e.target === popup) {
      popup.classList.remove('open');
      popup.setAttribute('aria-hidden', 'true');
    }
  } catch (err) {
    console.error('[RENDERER] popup click error:', err.message);
  }
});

// -------------------------------------------------------
// CLEANUP ON WINDOW UNLOAD
// -------------------------------------------------------
window.addEventListener('beforeunload', () => {
  try {
    window.electronAPI.removeAllListeners();
  } catch (err) {
    console.error('[RENDERER] cleanup error:', err.message);
  }
});