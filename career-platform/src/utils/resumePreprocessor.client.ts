/**
 * Client-side Resume Preprocessing Utility
 * Handles basic cleaning and formatting before sending to server
 * Does NOT remove PII to preserve data for server-side processing
 */

interface ClientPreprocessingOptions {
  normalizeWhitespace?: boolean;
  fixEncoding?: boolean;
  removeNullChars?: boolean;
  standardizeBullets?: boolean;
  trimContent?: boolean;
}

interface ClientPreprocessingResult {
  processedText: string;
  metadata: {
    originalLength: number;
    processedLength: number;
    processingSteps: string[];
    hasNonAscii: boolean;
    lineCount: number;
  };
}

export class ClientResumePreprocessor {
  /**
   * Encoding fixes for common PDF extraction issues
   */
  private static readonly ENCODING_FIXES = {
    // Common PDF encoding issues
    brokenQuotes: [
      { pattern: /â€™/g, replacement: "'" },
      { pattern: /â€"/g, replacement: "-" },
      { pattern: /â€œ/g, replacement: '"' },
      { pattern: /â€/g, replacement: '"' },
      { pattern: /Ã¢/g, replacement: '' },
      { pattern: /Â/g, replacement: '' },
      { pattern: /ï¿½/g, replacement: '' },
    ],
    // Fancy quotes to standard
    fancyQuotes: [
      { pattern: /[""]/g, replacement: '"' },
      { pattern: /['']/g, replacement: "'" },
      { pattern: /[„"]/g, replacement: '"' },
      { pattern: /[«»]/g, replacement: '"' },
      { pattern: /[‹›]/g, replacement: "'" },
    ],
    // Various dashes to standard hyphen
    dashes: [
      { pattern: /[–—―]/g, replacement: '-' },
      { pattern: /­/g, replacement: '-' }, // Soft hyphen
    ],
  };

  /**
   * Special characters that need cleaning
   */
  private static readonly SPECIAL_CHARS = {
    nullChar: /\u0000/g,
    formFeed: /\f/g,
    verticalTab: /\v/g,
    nonBreakingSpace: /\u00A0/g,
    zeroWidthSpace: /\u200B/g,
    byteOrderMark: /^\uFEFF/,
  };

  /**
   * Bullet point variations
   */
  private static readonly BULLET_PATTERNS = {
    // Various bullet characters
    bullets: /^[\s]*[•·■□▪▫◆◇○●►▸▹‣⁃]/gm,
    // Numbered lists (1. 2. etc)
    numberedList: /^[\s]*\d+\.\s*/gm,
    // Letter lists (a. b. etc)
    letterList: /^[\s]*[a-z]\.\s*/gmi,
    // Roman numerals (i. ii. etc)
    romanList: /^[\s]*[ivxlcdm]+\.\s*/gmi,
  };

  /**
   * Main preprocessing function for client-side
   */
  static preprocess(
    text: string,
    options: ClientPreprocessingOptions = {}
  ): ClientPreprocessingResult {
    const defaultOptions: ClientPreprocessingOptions = {
      normalizeWhitespace: true,
      fixEncoding: true,
      removeNullChars: true,
      standardizeBullets: true,
      trimContent: true,
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    let processedText = text;
    const processingSteps: string[] = [];
    const originalLength = text.length;

    // Check for non-ASCII characters
    const hasNonAscii = /[^\x00-\x7F]/.test(text);

    // Step 1: Fix encoding issues (important for PDF extraction)
    if (finalOptions.fixEncoding) {
      processedText = this.fixEncoding(processedText);
      processingSteps.push('encoding_fix');
    }

    // Step 2: Remove null and special characters
    if (finalOptions.removeNullChars) {
      processedText = this.removeSpecialCharacters(processedText);
      processingSteps.push('special_char_removal');
    }

    // Step 3: Standardize bullets (but keep list structure)
    if (finalOptions.standardizeBullets) {
      processedText = this.standardizeBullets(processedText);
      processingSteps.push('bullet_standardization');
    }

    // Step 4: Normalize whitespace (but preserve structure)
    if (finalOptions.normalizeWhitespace) {
      processedText = this.normalizeWhitespace(processedText);
      processingSteps.push('whitespace_normalization');
    }

    // Step 5: Trim content
    if (finalOptions.trimContent) {
      processedText = this.trimContent(processedText);
      processingSteps.push('content_trim');
    }

    // Count lines for metadata
    const lineCount = processedText.split('\n').length;

    return {
      processedText,
      metadata: {
        originalLength,
        processedLength: processedText.length,
        processingSteps,
        hasNonAscii,
        lineCount,
      },
    };
  }

  /**
   * Fix common encoding issues from PDF/DOCX extraction
   */
  private static fixEncoding(text: string): string {
    let processed = text;

    // Fix broken quotes and special characters
    for (const fixes of Object.values(this.ENCODING_FIXES)) {
      for (const { pattern, replacement } of fixes) {
        processed = processed.replace(pattern, replacement);
      }
    }

    return processed;
  }

  /**
   * Remove null characters and other special characters
   */
  private static removeSpecialCharacters(text: string): string {
    let processed = text;

    // Remove various special characters
    processed = processed.replace(this.SPECIAL_CHARS.nullChar, '');
    processed = processed.replace(this.SPECIAL_CHARS.formFeed, '\n');
    processed = processed.replace(this.SPECIAL_CHARS.verticalTab, '\n');
    processed = processed.replace(this.SPECIAL_CHARS.nonBreakingSpace, ' ');
    processed = processed.replace(this.SPECIAL_CHARS.zeroWidthSpace, '');
    processed = processed.replace(this.SPECIAL_CHARS.byteOrderMark, '');

    return processed;
  }

  /**
   * Standardize bullet points but preserve list structure
   */
  private static standardizeBullets(text: string): string {
    let processed = text;

    // Convert all bullet variations to standard dash
    processed = processed.replace(this.BULLET_PATTERNS.bullets, '- ');
    
    // Optionally convert numbered lists to bullets (preserve numbers for now)
    // processed = processed.replace(this.BULLET_PATTERNS.numberedList, '- ');

    return processed;
  }

  /**
   * Normalize whitespace while preserving document structure
   */
  private static normalizeWhitespace(text: string): string {
    let processed = text;

    // Replace tabs with spaces
    processed = processed.replace(/\t/g, '  ');

    // Replace multiple spaces with single space (but not at line start)
    processed = processed.replace(/([^\n]) {2,}/g, '$1 ');

    // Normalize line endings
    processed = processed.replace(/\r\n/g, '\n');
    processed = processed.replace(/\r/g, '\n');

    // Remove excessive blank lines (more than 2)
    processed = processed.replace(/\n{4,}/g, '\n\n\n');

    // Trim each line but preserve indentation structure
    const lines = processed.split('\n');
    const trimmedLines = lines.map(line => {
      // Only trim trailing spaces, preserve leading for structure
      return line.replace(/\s+$/, '');
    });
    processed = trimmedLines.join('\n');

    return processed;
  }

  /**
   * Trim content without removing important structure
   */
  private static trimContent(text: string): string {
    let processed = text;

    // Remove leading and trailing whitespace
    processed = processed.trim();

    // Ensure document starts and ends cleanly
    processed = processed.replace(/^\n+/, '');
    processed = processed.replace(/\n+$/, '');

    return processed;
  }

  /**
   * Validate that text is ready for sending to server
   */
  static validate(text: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check if text is too short
    if (text.length < 50) {
      issues.push('Resume text is too short (less than 50 characters)');
    }

    // Check if text is too long
    if (text.length > 50000) {
      issues.push('Resume text is too long (more than 50,000 characters)');
    }

    // Check if text is mostly whitespace
    const nonWhitespace = text.replace(/\s/g, '').length;
    if (nonWhitespace < 30) {
      issues.push('Resume contains too little content');
    }

    // Check for binary data indicators
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text)) {
      issues.push('Resume contains binary or control characters');
    }

    // Check if extraction likely failed (repeated characters)
    const repeatedChars = /(.)\1{20,}/;
    if (repeatedChars.test(text)) {
      issues.push('Resume extraction may have failed (repeated characters detected)');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get a preview of the processed text for user confirmation
   */
  static getPreview(text: string, maxLength: number = 500): string {
    if (text.length <= maxLength) {
      return text;
    }

    // Try to cut at a sentence or line break
    let preview = text.substring(0, maxLength);
    
    // Look for last sentence ending
    const sentenceEnd = preview.lastIndexOf('.');
    const lineBreak = preview.lastIndexOf('\নn');
    
    const cutPoint = Math.max(sentenceEnd, lineBreak);
    if (cutPoint > maxLength * 0.7) {
      preview = preview.substring(0, cutPoint + 1);
    }

    return preview + '\n\n[... Preview truncated ...]';
  }
}

export default ClientResumePreprocessor;