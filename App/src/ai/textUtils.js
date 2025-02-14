import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (imageUrl) => {
  try {
    const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng');
    return text;
  } catch (error) {
    console.error('OCR failed:', error);
    return '';
  }
};
