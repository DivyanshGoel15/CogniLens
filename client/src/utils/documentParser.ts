import JSZip from 'jszip';

/**
 * Checks if a string is raw binary garbage, compressed bytes, or corrupt text.
 */
export function isBinaryOrCorruptText(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;

  // Signatures of binary files
  if (
    trimmed.startsWith('%PDF-') ||
    trimmed.startsWith('PK\x03\x04') ||
    trimmed.startsWith('\x1f\x8b') ||
    trimmed.startsWith('{\\rtf')
  ) {
    return true;
  }

  // Count replacement characters \uFFFD (the black diamond with question mark)
  // and unprintable non-whitespace ASCII control characters
  let invalidCount = 0;
  const sampleLength = Math.min(trimmed.length, 3000);
  for (let i = 0; i < sampleLength; i++) {
    const code = trimmed.charCodeAt(i);
    // 65533 is \uFFFD (Unicode replacement character)
    if (code === 65533 || (code < 32 && code !== 9 && code !== 10 && code !== 13)) {
      invalidCount++;
    }
  }

  // If more than 2.5% of characters are invalid or replacement characters, it's corrupt binary
  return (invalidCount / sampleLength) > 0.025;
}

/**
 * Strips null bytes and invalid control characters from human-readable text.
 */
export function cleanExtractedText(text: string): string | null {
  if (!text || isBinaryOrCorruptText(text)) return null;
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFD]/g, '').trim();
  return cleaned.length > 15 ? cleaned : null;
}

/**
 * Extracts slide-by-slide text from a PowerPoint (.pptx) file using JSZip.
 */
export async function extractTextFromPPTX(file: File): Promise<{ text: string; pagesCount: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Collect all slide files
    const slideEntries: { num: number; entry: JSZip.JSZipObject }[] = [];
    zip.forEach((relativePath, zipEntry) => {
      const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
      if (match) {
        slideEntries.push({ num: parseInt(match[1], 10), entry: zipEntry });
      }
    });

    slideEntries.sort((a, b) => a.num - b.num);

    if (slideEntries.length === 0) {
      return { text: '', pagesCount: 1 };
    }

    const pagesText: string[] = [];

    for (const slide of slideEntries) {
      const xml = await slide.entry.async('string');
      // Text in PowerPoint is stored inside <a:t>...</a:t> elements
      const matches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || [];
      const lines: string[] = [];

      for (const m of matches) {
        const decoded = m
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .trim();
        if (decoded) {
          lines.push(decoded);
        }
      }

      const slideText = lines.join(' ').replace(/\s+/g, ' ').trim();
      pagesText.push(`--- Page ${slide.num} ---\n${slideText}`);
    }

    const fullText = pagesText.join('\n\n');
    return {
      text: isBinaryOrCorruptText(fullText) ? '' : fullText,
      pagesCount: slideEntries.length
    };
  } catch (err) {
    console.warn('Failed to extract text from PPTX:', err);
    return { text: '', pagesCount: 1 };
  }
}

/**
 * Extracts structured text from a Word (.docx) file using JSZip.
 */
export async function extractTextFromDOCX(file: File): Promise<{ text: string; pagesCount: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docEntry = zip.file('word/document.xml');
    if (!docEntry) return { text: '', pagesCount: 1 };

    const xml = await docEntry.async('string');
    // Extract paragraphs <w:p>
    const paragraphs: string[] = [];
    const pMatches = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/gi) || [];

    for (const p of pMatches) {
      const tMatches = p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi) || [];
      const pText = tMatches
        .map(t => t.replace(/<[^>]+>/g, ''))
        .join('')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim();
      if (pText) {
        paragraphs.push(pText);
      }
    }

    // Paginate every ~1400 characters
    const pages: string[] = [];
    let curPageLines: string[] = [];
    let curLen = 0;
    let pageNum = 1;

    for (const p of paragraphs) {
      curPageLines.push(p);
      curLen += p.length;
      if (curLen > 1400) {
        pages.push(`--- Page ${pageNum} ---\n${curPageLines.join('\n\n')}`);
        pageNum++;
        curPageLines = [];
        curLen = 0;
      }
    }

    if (curPageLines.length > 0) {
      pages.push(`--- Page ${pageNum} ---\n${curPageLines.join('\n\n')}`);
    }

    const fullText = pages.join('\n\n');
    return {
      text: isBinaryOrCorruptText(fullText) ? '' : fullText,
      pagesCount: Math.max(1, pages.length)
    };
  } catch (err) {
    console.warn('Failed to extract text from DOCX:', err);
    return { text: '', pagesCount: 1 };
  }
}

/**
 * Extracts and paginates plain text, Markdown, code, and CSV files.
 */
export async function extractTextFromPlaintext(file: File): Promise<{ text: string; pagesCount: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = (reader.result as string) || '';
      if (isBinaryOrCorruptText(raw)) {
        resolve({ text: '', pagesCount: 1 });
        return;
      }

      const lines = raw.split(/\r?\n/);
      const pages: string[] = [];
      let curPageLines: string[] = [];
      let curLen = 0;
      let pageNum = 1;

      for (const line of lines) {
        curPageLines.push(line);
        curLen += line.length + 1;
        if (curLen > 1400) {
          pages.push(`--- Page ${pageNum} ---\n${curPageLines.join('\n')}`);
          pageNum++;
          curPageLines = [];
          curLen = 0;
        }
      }

      if (curPageLines.length > 0) {
        pages.push(`--- Page ${pageNum} ---\n${curPageLines.join('\n')}`);
      }

      resolve({
        text: pages.join('\n\n'),
        pagesCount: Math.max(1, pages.length)
      });
    };
    reader.onerror = () => resolve({ text: '', pagesCount: 1 });
    reader.readAsText(file);
  });
}

/**
 * Scans a PDF file for embedded plain text operators.
 * Rejects corrupt binary streams so raw PDF bytes never leak to the reader.
 */
export async function extractTextFromPDF(file: File): Promise<{ text: string; pagesCount: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('latin1');
    const headerStr = decoder.decode(bytes.slice(0, Math.min(bytes.length, 600000)));

    // Estimate page count from PDF catalog
    const countMatch = headerStr.match(/\/Count\s+(\d+)/);
    const estimatedPages = countMatch ? Math.min(100, Math.max(1, parseInt(countMatch[1], 10))) : 12;

    // Search for uncompressed text blocks inside BT ... ET
    const btRegex = /BT[\s\S]*?ET/g;
    let match;
    let extractedWords: string[] = [];

    while ((match = btRegex.exec(headerStr)) !== null) {
      const block = match[0];
      const tjMatches = block.match(/\((.*?)\)\s*Tj/g) || [];
      for (const tj of tjMatches) {
        const clean = tj.replace(/^\(/, '').replace(/\)\s*Tj$/, '').trim();
        if (clean && !isBinaryOrCorruptText(clean) && /^[a-zA-Z0-9\s.,;:'"()\-_=+/*%]+$/.test(clean)) {
          extractedWords.push(clean);
        }
      }
    }

    const totalText = extractedWords.join(' ').replace(/\s+/g, ' ').trim();
    if (totalText.length > 120 && !isBinaryOrCorruptText(totalText)) {
      const charsPerPage = Math.ceil(totalText.length / estimatedPages);
      const pages: string[] = [];
      for (let p = 1; p <= estimatedPages; p++) {
        const start = (p - 1) * charsPerPage;
        const pageSlice = totalText.slice(start, start + charsPerPage).trim();
        pages.push(`--- Page ${p} ---\n${pageSlice}`);
      }
      return { text: pages.join('\n\n'), pagesCount: estimatedPages };
    }

    // If PDF text is compressed / scanned, return empty string so reader uses clean academic synthesis
    return { text: '', pagesCount: estimatedPages };
  } catch (err) {
    console.warn('Failed to parse PDF text:', err);
    return { text: '', pagesCount: 12 };
  }
}

/**
 * Universal document parser entry point.
 * Guarantees that binary files NEVER return raw byte gibberish.
 */
export async function parseDocumentFile(file: File): Promise<{ text: string; pagesCount: number }> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.pptx')) {
    return extractTextFromPPTX(file);
  }

  if (name.endsWith('.docx')) {
    return extractTextFromDOCX(file);
  }

  if (name.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  }

  if (
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.markdown') ||
    name.endsWith('.json') ||
    name.endsWith('.csv') ||
    name.endsWith('.py') ||
    name.endsWith('.java') ||
    name.endsWith('.cpp') ||
    name.endsWith('.c') ||
    name.endsWith('.cs') ||
    name.endsWith('.html') ||
    name.endsWith('.sql')
  ) {
    return extractTextFromPlaintext(file);
  }

  // Unsupported or other binary types (e.g. .ppt, .doc, .zip)
  return { text: '', pagesCount: 10 };
}
