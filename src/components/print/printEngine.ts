/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function triggerPrint(
  element: HTMLElement,
  documentTitle: string = "Hosana",
): void {
  // Remove any existing print iframe
  const existingIframe = document.getElementById("hosana-print-iframe");
  if (existingIframe) {
    existingIframe.remove();
  }

  // Create an isolated hidden iframe
  const iframe = document.createElement("iframe");
  iframe.id = "hosana-print-iframe";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Gather styles from main document
  let stylesHtml = "";
  document.querySelectorAll("style, link[rel='stylesheet']").forEach((node) => {
    stylesHtml += node.outerHTML;
  });

  // Base print styles
  const printResetCss = `
    <style>
      @page {
        size: A4 portrait;
        margin: 12mm 15mm;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 0;
        background-color: #ffffff !important;
        color: #0f172a !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-sheet {
        page-break-inside: auto;
        break-inside: auto;
      }
      .print\\:page-break-after-always {
        page-break-after: always;
        break-after: page;
      }
      .folder-print-container .print-sheet,
      .service-print-container .print-sheet,
      .event-print-view .print-sheet,
      .batch-print-container .print-sheet {
        display: block !important;
        min-height: auto !important;
        height: auto !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      thead {
        display: table-header-group !important;
      }
      /* Ensure chordpro renderer containers flow normally in print without clipping */
      .print-chordpro-content,
      .print-chordpro-content > div,
      .print-chordpro-content .print-page {
        position: static !important;
        display: block !important;
        overflow: visible !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      .print-chordpro-content .print-song-card {
        page-break-after: auto !important;
        break-after: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      /* Hide ChordPro web header and interactive controls in print */
      .print-chordpro-content .print-song-card > div.border-b:first-child,
      .print-chordpro-content button,
      .print-chordpro-content select {
        display: none !important;
      }
      .print-chordpro-content,
      .print-chordpro-content * {
        color: inherit;
      }
      .print-chordpro-content [class*="text-slate-800"],
      .print-chordpro-content [class*="text-neutral-900"],
      .print-chordpro-content [class*="text-white"],
      .print-chordpro-content [class*="text-black"] {
        color: #0f172a !important;
      }
      .print-chordpro-content [class*="text-[#0284c7]"],
      .print-chordpro-content [class*="text-sky"],
      .print-chordpro-content [class*="text-indigo"],
      .print-chordpro-content [class*="text-blue"] {
        color: #0369a1 !important; /* Darker, high-contrast chord blue for paper */
        font-weight: 700 !important;
      }
    </style>
  `;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${documentTitle}</title>
        ${stylesHtml}
        ${printResetCss}
      </head>
      <body>
        <div class="hosana-print-root">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Wait for images and fonts to settle before printing
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }
  }, 400);
}
