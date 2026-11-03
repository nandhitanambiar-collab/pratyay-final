import JSZip from 'jszip';

export interface ExtractionResult {
  success: boolean;
  filename: string;
  fileSize: number;
  fileType: string;
  text: string;
  wordCount: number;
  charCount: number;
  notice?: string;
  error?: string;
}

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const SUPPORTED_FILE_EXTENSIONS = ['.txt', '.docx', '.pdf'] as const;

export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the maximum allowed limit of 5.0 MB.`,
    };
  }

  const name = file.name.toLowerCase();
  const hasValidExt = SUPPORTED_FILE_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!hasValidExt) {
    return {
      valid: false,
      error: `Unsupported file type. Please upload a .txt, .docx, or .pdf document.`,
    };
  }

  return { valid: true };
}

/**
 * Extracts plain text from an uploaded document in the browser.
 * Supports .txt, .docx (via XML extraction in JSZip), and text-based .pdf stream extraction with fallbacks.
 */
export async function extractTextFromFile(file: File): Promise<ExtractionResult> {
  const validation = validateUploadFile(file);
  if (!validation.valid) {
    return {
      success: false,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type || 'unknown',
      text: '',
      wordCount: 0,
      charCount: 0,
      error: validation.error,
    };
  }

  const name = file.name.toLowerCase();

  try {
    // 1. Plain Text files (.txt)
    if (name.endsWith('.txt')) {
      const text = await file.text();
      const trimmed = text.trim();
      const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
      return {
        success: true,
        filename: file.name,
        fileSize: file.size,
        fileType: 'text/plain',
        text: trimmed,
        wordCount: words,
        charCount: trimmed.length,
      };
    }

    // 2. Word documents (.docx)
    if (name.endsWith('.docx')) {
      const zip = await JSZip.loadAsync(file);
      const documentXml = zip.file('word/document.xml');

      if (!documentXml) {
        return {
          success: false,
          filename: file.name,
          fileSize: file.size,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          text: '',
          wordCount: 0,
          charCount: 0,
          error: 'Corrupt or unreadable Word document: word/document.xml not found in archive.',
        };
      }

      const xmlString = await documentXml.async('text');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        return {
          success: false,
          filename: file.name,
          fileSize: file.size,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          text: '',
          wordCount: 0,
          charCount: 0,
          error: 'Failed to parse XML content of the Word document.',
        };
      }

      const paragraphs = Array.from(xmlDoc.getElementsByTagName('w:p')).map((p) => {
        const textElements = Array.from(p.getElementsByTagName('w:t'));
        return textElements.map((t) => t.textContent || '').join('');
      });

      const extractedText = paragraphs.join('\n\n').trim();
      const words = extractedText ? extractedText.split(/\s+/).filter(Boolean).length : 0;

      return {
        success: true,
        filename: file.name,
        fileSize: file.size,
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        text: extractedText,
        wordCount: words,
        charCount: extractedText.length,
        notice: 'Formatted text and headings converted into plain paragraphs.',
      };
    }

    // 3. PDF documents (.pdf)
    if (name.endsWith('.pdf')) {
      const buffer = await file.arrayBuffer();
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const rawString = textDecoder.decode(buffer);

      // Extract text objects inside BT (Begin Text) ... ET (End Text) blocks or Tj / TJ operators
      const textParts: string[] = [];
      const textBlockRegex = /BT[\s\S]*?ET/g;
      const literalStringRegex = /\(([^)]+)\)\s*Tj/g;
      const arrayStringRegex = /\[([^\]]+)\]\s*TJ/g;

      let blockMatch;
      while ((blockMatch = textBlockRegex.exec(rawString)) !== null) {
        const block = blockMatch[0];

        // Literal strings
        let litMatch;
        while ((litMatch = literalStringRegex.exec(block)) !== null) {
          const cleanText = unescapePdfString(litMatch[1]);
          if (cleanText.trim()) textParts.push(cleanText);
        }

        // Array strings
        let arrMatch;
        while ((arrMatch = arrayStringRegex.exec(block)) !== null) {
          const inner = arrMatch[1];
          const innerLiteral = /\(([^)]+)\)/g;
          let subMatch;
          const chunkParts: string[] = [];
          while ((subMatch = innerLiteral.exec(inner)) !== null) {
            chunkParts.push(unescapePdfString(subMatch[1]));
          }
          if (chunkParts.length > 0) {
            textParts.push(chunkParts.join(''));
          }
        }
      }

      const extracted = textParts.join(' ').replace(/\s+/g, ' ').trim();
      const words = extracted ? extracted.split(/\s+/).filter(Boolean).length : 0;

      // If we extracted a reasonable amount of text (> 15 words)
      if (words >= 15) {
        return {
          success: true,
          filename: file.name,
          fileSize: file.size,
          fileType: 'application/pdf',
          text: extracted,
          wordCount: words,
          charCount: extracted.length,
          notice: 'Extracted plain text stream from PDF. Please verify formatting before submitting.',
        };
      }

      // If little or no text was extractable (e.g. compressed streams, scanned images, or OCR required)
      return {
        success: false,
        filename: file.name,
        fileSize: file.size,
        fileType: 'application/pdf',
        text: '',
        wordCount: 0,
        charCount: 0,
        error:
          'Could not extract readable text streams from this PDF. Scanned documents and image-based PDFs require backend OCR service (Python/FastAPI). Please paste your text directly or upload a .txt or .docx file.',
      };
    }

    return {
      success: false,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type,
      text: '',
      wordCount: 0,
      charCount: 0,
      error: 'Unsupported file format.',
    };
  } catch (err) {
    return {
      success: false,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type,
      text: '',
      wordCount: 0,
      charCount: 0,
      error: `Extraction error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function unescapePdfString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}
