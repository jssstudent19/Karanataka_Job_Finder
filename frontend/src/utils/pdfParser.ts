// Since we are loading from CDN, pdfjsLib will be on the window object.
// We declare it here to satisfy TypeScript.
declare const pdfjsLib: any;

// Set the worker source, which is required by pdf.js
// We'll initialize this when the component loads
let workerInitialized = false;

const initializePdfJs = () => {
  if (!workerInitialized && typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
    workerInitialized = true;
  }
};

/**
 * Extracts text content from a PDF file.
 * @param file The PDF file to parse.
 * @returns A promise that resolves with the extracted text.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  if (!file) {
    throw new Error("No file provided for parsing.");
  }
  if (file.type !== 'application/pdf') {
    throw new Error("Invalid file type. Please upload a PDF file.");
  }

  // Initialize PDF.js if not already done
  initializePdfJs();

  if (typeof pdfjsLib === 'undefined') {
    throw new Error("PDF.js library is not loaded. Please include PDF.js in your HTML.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    // Rejoin text items with spaces
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n'; // Add a newline between pages for readability
  }
  
  return fullText;
}