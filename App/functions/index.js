const { onCall, https } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');
const axios = require('axios');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { createCanvas } = require('canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

admin.initializeApp();
const visionClient = new vision.ImageAnnotatorClient();

exports.extract1 = onCall(async (request) => {
  console.log('Received request:', request);
  const pdfUrl = request.data.pdfUrl;
  console.log('Extracted PDF URL:', pdfUrl);

  if (!pdfUrl) {
    console.error('PDF URL is missing or empty');
    throw new functions.https.HttpsError('invalid-argument', 'PDF URL is required');
  }

  try {
    const tempDir = os.tmpdir();
    console.log('Downloading PDF from:', pdfUrl);
    const response = await axios({
      method: 'GET',
      url: pdfUrl,
      responseType: 'arraybuffer'
    });

    // Convert Buffer to Uint8Array
    const pdfBuffer = response.data;
    const pdfData = Uint8Array.from(pdfBuffer);
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    // Process the PDF (e.g., extract text, render pages, etc.)
    const pageCount = pdf.numPages;
    console.log(`PDF has ${pageCount} pages`);

    const extractedText = [];

    for (let i = 1; i <= pageCount; i++) {
      console.log(`Processing page ${i}/${pageCount}`);
      const imagePath = path.join(tempDir, `page-${i}.png`);
      await renderPdfPageToPng(pdf, i, imagePath);

      console.log(`Extracting text from page ${i}`);
      const [textDetection] = await visionClient.textDetection(imagePath);
      const pageText = textDetection.fullTextAnnotation ? textDetection.fullTextAnnotation.text : '';

      extractedText.push({
        page: i,
        text: pageText
      });

      fs.unlinkSync(imagePath);
    }

    const combinedText = extractedText.map(page => `Page ${page.page}:\n${page.text}`).join('\n\n');

    return {
      text: combinedText,
      pages: extractedText
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new functions.https.HttpsError('internal', 'Error processing PDF', error.message);
  }
});

// Custom canvas factory for Node.js
class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext) {
    // No-op
  }
}

async function renderPdfPageToPng(pdf, pageNumber, outputPath) {
  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2.0 }); // Increase scale for better OCR
    const canvasFactory = new NodeCanvasFactory();
    const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    await page.render(renderContext).promise;
    const stream = fs.createWriteStream(outputPath);
    const pngStream = canvas.createPNGStream();
    return new Promise((resolve, reject) => {
      pngStream.pipe(stream);
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('Error rendering PDF page:', error);
    throw error;
  }
}