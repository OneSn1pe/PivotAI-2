/**
 * Resume Preprocessing Utility
 * Cleans, sanitizes, and structures resume text before AI analysis
 */

interface PreprocessingOptions {
  removePII?: boolean;
  normalizeWhitespace?: boolean;
  removeNoise?: boolean;
  standardizeSections?: boolean;
  parseStructure?: boolean;
  maxLength?: number;
}

interface ResumeSection {
  type: string;
  title: string;
  content: string;
  order: number;
}

interface PreprocessingResult {
  processedText: string;
  sections?: ResumeSection[];
  removedPII: {
    emails: number;
    phones: number;
    ssns: number;
    addresses: number;
    urls: number;
  };
  metadata: {
    originalLength: number;
    processedLength: number;
    processingSteps: string[];
    sectionsFound?: string[];
  };
}

export class ResumePreprocessor {
  private static readonly PII_PATTERNS = {
    // Email addresses
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    
    // Phone numbers (various formats)
    phone: /(\+?1?\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/gi,
    
    // Social Security Numbers
    ssn: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/gi,
    
    // URLs (to remove personal websites/social media)
    url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
    
    // LinkedIn profiles
    linkedin: /linkedin\.com\/in\/[\w-]+/gi,
    
    // GitHub profiles
    github: /github\.com\/[\w-]+/gi,
    
    // Street addresses (enhanced pattern)
    streetAddress: /\d+\s+[\w\s]{1,50}(street|st|avenue|ave|road|rd|highway|hwy|square|sq|trail|trl|drive|dr|court|ct|parkway|pkwy|circle|cir|boulevard|blvd)\b/gi,
    
    // Zip codes
    zipCode: /\b\d{5}(?:[-\s]\d{4})?\b/g,
    
    // Date of birth patterns
    dob: /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g,
  };

  private static readonly NOISE_PATTERNS = {
    // Page numbers (enhanced patterns)
    pageNumber: /\bpage\s+\d+\s*(of\s*\d+)?\b/gi,
    pageNumberBottom: /^\s*\d+\s*$/gm,
    pageNumberWithDash: /^[-–—]\s*\d+\s*[-–—]$/gm,
    
    // Headers/footers (expanded)
    confidential: /\bconfidential\b/gi,
    resume: /^resume\s*$/gim,
    curriculum: /^curriculum\s+vitae\s*$/gim,
    
    // Document metadata
    createdDate: /created\s+on\s+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi,
    modifiedDate: /last\s+modified\s*:?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi,
    printedDate: /printed\s*:?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi,
    
    // Multiple spaces, tabs, etc.
    multipleSpaces: /\s{2,}/g,
    multipleNewlines: /\n{3,}/g,
    leadingTrailingSpaces: /^\s+|\s+$/gm,
    
    // Special characters and formatting (expanded)
    bulletPoints: /[•·■□▪▫◆◇○●►▸▹‣⁃]/g,
    fancyQuotes: /[""''„"«»‹›]/g,
    dashes: /[–—―]/g,
    specialChars: /[^\w\s\-.,;:!?'"()\[\]{}\/\\@#$%&*+=<>|]/g,
    
    // Common artifacts from PDF extraction
    brokenEncoding: /â€™|â€"|â€œ|â€|Ã¢|Â|ï¿½/g,
    nullChars: /\u0000/g,
    formFeeds: /\f/g,
  };

  private static readonly SECTION_HEADERS = {
    // Contact/Personal Info
    contact: /^(contact|personal\s+info|personal\s+details|contact\s+information|contact\s+details)/i,
    
    // Summary/Objective
    summary: /^(professional\s+summary|executive\s+summary|summary|objective|career\s+objective|profile|about\s+me|about|overview|synopsis|personal\s+statement|career\s+summary)/i,
    
    // Experience
    experience: /^(professional\s+experience|work\s+experience|experience|employment\s+history|employment|work\s+history|career\s+history|professional\s+background|relevant\s+experience)/i,
    
    // Education
    education: /^(education|academic\s+background|academic\s+history|educational\s+background|qualifications|academic\s+qualifications|degrees|academic\s+credentials)/i,
    
    // Skills
    skills: /^(technical\s+skills|skills|core\s+competencies|competencies|key\s+skills|expertise|proficiencies|technical\s+proficiencies|areas\s+of\s+expertise|skill\s+set|capabilities)/i,
    
    // Projects
    projects: /^(projects|key\s+projects|notable\s+projects|project\s+experience|portfolio|selected\s+projects|professional\s+projects|academic\s+projects)/i,
    
    // Certifications
    certifications: /^(certifications|professional\s+certifications|licenses|credentials|professional\s+licenses|certificates|professional\s+development|training)/i,
    
    // Awards/Achievements
    awards: /^(awards|achievements|honors|accomplishments|recognition|awards\s+and\s+honors|achievements\s+and\s+awards|notable\s+achievements)/i,
    
    // Publications
    publications: /^(publications|research|papers|published\s+work|research\s+publications|articles|academic\s+publications)/i,
    
    // Languages
    languages: /^(languages|language\s+skills|language\s+proficiency|linguistic\s+skills)/i,
    
    // Interests/Hobbies
    interests: /^(interests|hobbies|personal\s+interests|activities|extracurricular|hobbies\s+and\s+interests)/i,
    
    // References
    references: /^(references|professional\s+references|referees)/i,
    
    // Additional sections
    volunteer: /^(volunteer|volunteering|volunteer\s+experience|volunteer\s+work|community\s+service|community\s+involvement)/i,
    leadership: /^(leadership|leadership\s+experience|leadership\s+roles|positions\s+of\s+responsibility)/i,
  };

  /**
   * Main preprocessing function
   */
  static preprocess(
    text: string, 
    options: PreprocessingOptions = {}
  ): PreprocessingResult {
    const defaultOptions: PreprocessingOptions = {
      removePII: true,
      normalizeWhitespace: true,
      removeNoise: true,
      standardizeSections: true,
      parseStructure: true,
      maxLength: 4000,
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    let processedText = text;
    const processingSteps: string[] = [];
    const removedPII = {
      emails: 0,
      phones: 0,
      ssns: 0,
      addresses: 0,
      urls: 0,
    };

    const originalLength = text.length;
    let sections: ResumeSection[] | undefined;

    // Step 1: Basic cleaning first
    if (finalOptions.normalizeWhitespace) {
      processedText = this.normalizeWhitespace(processedText);
      processingSteps.push('whitespace_normalization');
    }

    // Step 2: Remove noise
    if (finalOptions.removeNoise) {
      processedText = this.removeNoise(processedText);
      processingSteps.push('noise_removal');
    }

    // Step 3: Standardize sections
    if (finalOptions.standardizeSections) {
      processedText = this.standardizeSections(processedText);
      processingSteps.push('section_standardization');
    }

    // Step 4: Parse structure
    if (finalOptions.parseStructure) {
      const structureResult = this.parseStructure(processedText);
      sections = structureResult.sections;
      processedText = structureResult.formattedText;
      processingSteps.push('structure_parsing');
    }

    // Step 5: Remove PII (do this after parsing to preserve structure)
    if (finalOptions.removePII) {
      const piiResult = this.removePII(processedText);
      processedText = piiResult.text;
      Object.assign(removedPII, piiResult.counts);
      processingSteps.push('PII_removal');
    }

    // Step 6: Final formatting
    processedText = this.finalFormatting(processedText);

    // Step 7: Truncate if needed
    if (finalOptions.maxLength && processedText.length > finalOptions.maxLength) {
      processedText = this.intelligentTruncate(processedText, finalOptions.maxLength);
      processingSteps.push('truncation');
    }

    return {
      processedText,
      sections,
      removedPII,
      metadata: {
        originalLength,
        processedLength: processedText.length,
        processingSteps,
        sectionsFound: sections?.map(s => s.type),
      },
    };
  }

  /**
   * Remove personally identifiable information
   */
  private static removePII(text: string): { text: string; counts: any } {
    let processed = text;
    const counts = {
      emails: 0,
      phones: 0,
      ssns: 0,
      addresses: 0,
      urls: 0,
    };

    // Remove emails but keep domain for context
    processed = processed.replace(this.PII_PATTERNS.email, (match) => {
      counts.emails++;
      const domain = match.split('@')[1];
      // Keep company domains as they might be relevant
      if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('hotmail') && !domain.includes('outlook')) {
        return `[EMAIL@${domain}]`;
      }
      return '[EMAIL]';
    });

    // Remove phone numbers
    processed = processed.replace(this.PII_PATTERNS.phone, () => {
      counts.phones++;
      return '[PHONE]';
    });

    // Remove SSNs
    processed = processed.replace(this.PII_PATTERNS.ssn, () => {
      counts.ssns++;
      return '[SSN]';
    });

    // Remove personal URLs but keep company ones
    processed = processed.replace(this.PII_PATTERNS.url, (match) => {
      // Keep certain professional URLs
      if (match.includes('linkedin.com/company') || 
          match.includes('.edu') ||
          match.includes('coursera.org') ||
          match.includes('udemy.com')) {
        return match;
      }
      counts.urls++;
      return '[URL]';
    });

    // Remove LinkedIn personal profiles
    processed = processed.replace(this.PII_PATTERNS.linkedin, () => {
      return '[LINKEDIN]';
    });

    // Remove GitHub profiles but keep repo references
    processed = processed.replace(this.PII_PATTERNS.github, (match) => {
      if (match.split('/').length > 2) {
        return '[GITHUB]';
      }
      return match;
    });

    // Remove street addresses
    processed = processed.replace(this.PII_PATTERNS.streetAddress, () => {
      counts.addresses++;
      return '[ADDRESS]';
    });

    // Remove standalone zip codes
    processed = processed.replace(this.PII_PATTERNS.zipCode, '[ZIP]');

    // Remove dates of birth
    processed = processed.replace(this.PII_PATTERNS.dob, '[DOB]');

    return { text: processed, counts };
  }

  /**
   * Normalize whitespace and formatting
   */
  private static normalizeWhitespace(text: string): string {
    let processed = text;

    // Fix broken encoding from PDFs
    processed = processed
      .replace(/â€™/g, "'")
      .replace(/â€"/g, "-")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/Â/g, '')
      .replace(/ï¿½/g, '');

    // Normalize quotes
    processed = processed.replace(this.NOISE_PATTERNS.fancyQuotes, '"');

    // Normalize dashes
    processed = processed.replace(this.NOISE_PATTERNS.dashes, '-');

    // Remove null characters and form feeds
    processed = processed.replace(this.NOISE_PATTERNS.nullChars, '');
    processed = processed.replace(this.NOISE_PATTERNS.formFeeds, '\n');

    // Normalize bullet points to standard dash with proper spacing
    processed = processed.replace(/^[\s]*[•·■□▪▫◆◇○●►▸▹‣⁃]\s*/gm, '- ');

    // Replace tabs with spaces
    processed = processed.replace(/\t/g, ' ');

    // Replace multiple spaces with single space
    processed = processed.replace(this.NOISE_PATTERNS.multipleSpaces, ' ');

    // Trim lines
    processed = processed
      .split('\n')
      .map(line => line.trim())
      .join('\n');

    // Replace multiple newlines with double newline
    processed = processed.replace(this.NOISE_PATTERNS.multipleNewlines, '\n\n');

    return processed;
  }

  /**
   * Remove common noise from resumes
   */
  private static removeNoise(text: string): string {
    let processed = text;

    // Remove various page number formats
    processed = processed.replace(this.NOISE_PATTERNS.pageNumber, '');
    processed = processed.replace(this.NOISE_PATTERNS.pageNumberBottom, '');
    processed = processed.replace(this.NOISE_PATTERNS.pageNumberWithDash, '');

    // Remove document metadata
    processed = processed.replace(this.NOISE_PATTERNS.createdDate, '');
    processed = processed.replace(this.NOISE_PATTERNS.modifiedDate, '');
    processed = processed.replace(this.NOISE_PATTERNS.printedDate, '');

    // Remove common headers/footers
    processed = processed.replace(this.NOISE_PATTERNS.confidential, '');
    processed = processed.replace(this.NOISE_PATTERNS.resume, '');
    processed = processed.replace(this.NOISE_PATTERNS.curriculum, '');

    // Remove references section (usually not needed for analysis)
    processed = processed.replace(/references\s+available\s+upon\s+request/gi, '');
    processed = processed.replace(/references\s+furnished\s+upon\s+request/gi, '');

    // Remove common filler phrases
    processed = processed.replace(/end\s+of\s+resume/gi, '');
    processed = processed.replace(/continued\s+on\s+next\s+page/gi, '');
    processed = processed.replace(/see\s+next\s+page/gi, '');

    // Remove repeated headers (common in multi-page resumes)
    const lines = processed.split('\n');
    const cleanedLines: string[] = [];
    let lastHeader = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Check if this line is a header
      const isHeader = Object.values(this.SECTION_HEADERS).some(pattern => 
        pattern.test(trimmedLine)
      );
      
      if (isHeader) {
        // Skip if it's the same header as the last one
        if (trimmedLine.toLowerCase() !== lastHeader.toLowerCase()) {
          cleanedLines.push(line);
          lastHeader = trimmedLine;
        }
      } else {
        cleanedLines.push(line);
      }
    }
    
    processed = cleanedLines.join('\n');

    return processed;
  }

  /**
   * Standardize section headers for better parsing
   */
  private static standardizeSections(text: string): string {
    let processed = text;

    // First, identify and mark section headers
    const lines = processed.split('\n');
    const standardizedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        standardizedLines.push(line);
        continue;
      }

      // Check if this line is a section header
      let foundHeader = false;
      for (const [sectionType, pattern] of Object.entries(this.SECTION_HEADERS)) {
        if (pattern.test(trimmedLine)) {
          // Standardize the header format
          const standardHeader = this.getStandardHeaderName(sectionType);
          
          // Check if the next line is a separator (like ---, ===, etc.)
          const nextLine = lines[i + 1]?.trim() || '';
          if (nextLine && /^[-=_*]{3,}$/.test(nextLine)) {
            // Skip the separator line
            i++;
          }
          
          // Add the standardized header with consistent formatting
          standardizedLines.push('');  // Add blank line before header
          standardizedLines.push(`=== ${standardHeader} ===`);
          standardizedLines.push('');  // Add blank line after header
          
          foundHeader = true;
          break;
        }
      }
      
      if (!foundHeader) {
        // Check if this line might be a header based on formatting
        // (ALL CAPS, short line, followed by content)
        if (trimmedLine.length < 30 && 
            trimmedLine === trimmedLine.toUpperCase() &&
            /^[A-Z\s&]+$/.test(trimmedLine) &&
            i < lines.length - 1 &&
            lines[i + 1].trim()) {
          
          // This might be a header, standardize it
          const headerType = this.guessHeaderType(trimmedLine);
          if (headerType) {
            standardizedLines.push('');
            standardizedLines.push(`=== ${this.getStandardHeaderName(headerType)} ===`);
            standardizedLines.push('');
          } else {
            standardizedLines.push(line);
          }
        } else {
          standardizedLines.push(line);
        }
      }
    }

    processed = standardizedLines.join('\n');

    // Clean up multiple blank lines that may have been created
    processed = processed.replace(/\n{4,}/g, '\n\n\n');

    return processed;
  }

  /**
   * Parse the resume structure into sections
   */
  private static parseStructure(text: string): { sections: ResumeSection[]; formattedText: string } {
    const sections: ResumeSection[] = [];
    const lines = text.split('\n');
    
    let currentSection: ResumeSection | null = null;
    let currentContent: string[] = [];
    let sectionOrder = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if this is a standardized header
      const headerMatch = trimmedLine.match(/^===\s+(.+?)\s+===$/);
      if (headerMatch) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          if (currentSection.content) {
            sections.push(currentSection);
          }
        }
        
        // Start new section
        const headerTitle = headerMatch[1];
        const sectionType = this.getSectionType(headerTitle);
        
        currentSection = {
          type: sectionType,
          title: headerTitle,
          content: '',
          order: sectionOrder++,
        };
        currentContent = [];
      } else if (currentSection) {
        // Add content to current section
        currentContent.push(line);
      } else {
        // Content before first header (usually contact info or summary)
        if (trimmedLine && !currentSection) {
          currentSection = {
            type: 'header',
            title: 'CONTACT',
            content: '',
            order: sectionOrder++,
          };
          currentContent = [line];
        }
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      if (currentSection.content) {
        sections.push(currentSection);
      }
    }

    // Format the structured text
    const formattedText = this.formatStructuredText(sections);

    return { sections, formattedText };
  }

  /**
   * Format structured text from parsed sections
   */
  private static formatStructuredText(sections: ResumeSection[]): string {
    const formattedParts: string[] = [];

    for (const section of sections) {
      // Add section header
      formattedParts.push(`=== ${section.title} ===`);
      formattedParts.push('');
      
      // Process section content based on type
      const processedContent = this.processSectionContent(section);
      formattedParts.push(processedContent);
      formattedParts.push('');
    }

    return formattedParts.join('\n').trim();
  }

  /**
   * Process section content based on its type
   */
  private static processSectionContent(section: ResumeSection): string {
    const lines = section.content.split('\n');
    const processedLines: string[] = [];

    switch (section.type) {
      case 'experience':
        // Format experience entries
        let inEntry = false;
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            if (inEntry) {
              processedLines.push('');
              inEntry = false;
            }
            continue;
          }
          
          // Check if this looks like a job title/company line
          if (this.looksLikeJobTitle(trimmed)) {
            if (inEntry) processedLines.push('');
            processedLines.push(`** ${trimmed} **`);
            inEntry = true;
          } else if (this.looksLikeDate(trimmed)) {
            processedLines.push(`[${trimmed}]`);
          } else {
            // Regular content, ensure it's properly bulleted if needed
            if (trimmed.startsWith('-')) {
              processedLines.push(trimmed);
            } else if (inEntry && !this.looksLikeLocation(trimmed)) {
              processedLines.push(`- ${trimmed}`);
            } else {
              processedLines.push(trimmed);
            }
          }
        }
        break;

      case 'education':
        // Format education entries
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            processedLines.push('');
            continue;
          }
          
          if (this.looksLikeDegree(trimmed)) {
            processedLines.push(`** ${trimmed} **`);
          } else if (this.looksLikeDate(trimmed)) {
            processedLines.push(`[${trimmed}]`);
          } else {
            processedLines.push(trimmed);
          }
        }
        break;

      case 'skills':
        // Format skills as a clean list
        const skills = this.extractSkills(section.content);
        if (skills.length > 0) {
          processedLines.push(skills.join(', '));
        } else {
          processedLines.push(section.content);
        }
        break;

      default:
        // Default processing
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) {
            processedLines.push(trimmed);
          } else if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
            processedLines.push('');
          }
        }
    }

    return processedLines.join('\n');
  }

  /**
   * Final formatting pass
   */
  private static finalFormatting(text: string): string {
    let processed = text;

    // Ensure consistent spacing around headers
    processed = processed.replace(/\n*===\s+(.+?)\s+===\n*/g, '\n\n=== $1 ===\n\n');

    // Remove excessive blank lines
    processed = processed.replace(/\n{4,}/g, '\n\n\n');

    // Ensure proper spacing after bullet points
    processed = processed.replace(/^-\s*/gm, '- ');

    // Remove trailing whitespace
    processed = processed.replace(/[ \t]+$/gm, '');

    // Ensure document doesn't start or end with excessive whitespace
    processed = processed.trim();

    return processed;
  }

  /**
   * Intelligent truncation that tries to keep complete sections
   */
  private static intelligentTruncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    // Try to truncate at a section boundary
    const sectionPattern = /\n\n===\s+.+?\s+===\n\n/g;
    const sections: { start: number; end: number; text: string }[] = [];
    let match;
    let lastEnd = 0;

    while ((match = sectionPattern.exec(text)) !== null) {
      if (lastEnd < match.index) {
        sections.push({
          start: lastEnd,
          end: match.index,
          text: text.substring(lastEnd, match.index),
        });
      }
      sections.push({
        start: match.index,
        end: sectionPattern.lastIndex,
        text: match[0],
      });
      lastEnd = sectionPattern.lastIndex;
    }

    if (lastEnd < text.length) {
      sections.push({
        start: lastEnd,
        end: text.length,
        text: text.substring(lastEnd),
      });
    }

    // Build truncated text by including complete sections
    let result = '';
    const prioritySections = ['contact', 'summary', 'experience', 'education', 'skills'];
    
    // First pass: include priority sections
    for (const priority of prioritySections) {
      for (const section of sections) {
        if (section.text.toLowerCase().includes(priority) && 
            result.length + section.text.length <= maxLength - 100) {
          result += section.text;
        }
      }
    }

    // Second pass: include other sections if space allows
    for (const section of sections) {
      if (!result.includes(section.text) && 
          result.length + section.text.length <= maxLength - 100) {
        result += section.text;
      }
    }

    // If still empty or too short, just truncate normally
    if (result.length < 500) {
      result = text.substring(0, maxLength - 20);
    }

    return result + '\n\n[CONTENT TRUNCATED]';
  }

  /**
   * Helper functions for section detection
   */
  private static getStandardHeaderName(sectionType: string): string {
    const standardNames: { [key: string]: string } = {
      contact: 'CONTACT',
      summary: 'SUMMARY',
      experience: 'EXPERIENCE',
      education: 'EDUCATION',
      skills: 'SKILLS',
      projects: 'PROJECTS',
      certifications: 'CERTIFICATIONS',
      awards: 'AWARDS',
      publications: 'PUBLICATIONS',
      languages: 'LANGUAGES',
      interests: 'INTERESTS',
      references: 'REFERENCES',
      volunteer: 'VOLUNTEER',
      leadership: 'LEADERSHIP',
    };
    
    return standardNames[sectionType] || sectionType.toUpperCase();
  }

  private static getSectionType(headerTitle: string): string {
    const normalized = headerTitle.toLowerCase();
    
    for (const [type, pattern] of Object.entries(this.SECTION_HEADERS)) {
      if (pattern.test(normalized)) {
        return type;
      }
    }
    
    return 'other';
  }

  private static guessHeaderType(text: string): string | null {
    const normalized = text.toLowerCase();
    
    if (normalized.includes('experience') || normalized.includes('employment')) return 'experience';
    if (normalized.includes('education') || normalized.includes('academic')) return 'education';
    if (normalized.includes('skill')) return 'skills';
    if (normalized.includes('project')) return 'projects';
    if (normalized.includes('certif') || normalized.includes('license')) return 'certifications';
    if (normalized.includes('award') || normalized.includes('achiev')) return 'awards';
    if (normalized.includes('summary') || normalized.includes('objective')) return 'summary';
    
    return null;
  }

  private static looksLikeJobTitle(text: string): boolean {
    // Common patterns for job titles
    const patterns = [
      /^.+\s+(at|@|-)\s+.+$/i,  // "Role at Company"
      /^(senior|junior|lead|principal|staff|manager|director|vp|engineer|developer|analyst|designer)/i,
      /\b(inc|llc|ltd|corp|corporation|company|group|partners)\b/i,
    ];
    
    return patterns.some(pattern => pattern.test(text));
  }

  private static looksLikeDate(text: string): boolean {
    const patterns = [
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
      /\b(19|20)\d{2}\b/,
      /\b(present|current|ongoing|today)\b/i,
      /\d{1,2}\/\d{1,2}\/\d{2,4}/,
      /\d{4}\s*-\s*\d{4}/,
    ];
    
    return patterns.some(pattern => pattern.test(text));
  }

  private static looksLikeLocation(text: string): boolean {
    const patterns = [
      /\b(remote|hybrid|onsite|on-site)\b/i,
      /,\s*[A-Z]{2}\b/,  // State abbreviations
      /\b(usa|united states|canada|uk|india)\b/i,
    ];
    
    return text.length < 50 && patterns.some(pattern => pattern.test(text));
  }

  private static looksLikeDegree(text: string): boolean {
    const patterns = [
      /\b(bachelor|master|phd|doctorate|associate|diploma)\b/i,
      /\b(b\.?s\.?|m\.?s\.?|m\.?b\.?a\.?|b\.?a\.?|ph\.?d\.?)\b/i,
      /\b(degree|university|college|institute|school)\b/i,
    ];
    
    return patterns.some(pattern => pattern.test(text));
  }

  private static extractSkills(text: string): string[] {
    const skills: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Remove bullet points and split by common delimiters
      const cleaned = trimmed.replace(/^[-•·*]\s*/, '');
      const items = cleaned.split(/[,;|]/);
      
      for (const item of items) {
        const skill = item.trim();
        if (skill && skill.length > 2 && skill.length < 50) {
          skills.push(skill);
        }
      }
    }
    
    // Remove duplicates and return
    return Array.from(new Set(skills));
  }

  /**
   * Extract and preserve important information before heavy processing
   */
  static extractMetadata(text: string): {
    name?: string;
    currentTitle?: string;
    totalExperience?: string;
    topSkills?: string[];
  } {
    const metadata: any = {};

    // Try to extract name (usually at the top)
    const nameMatch = text.substring(0, 300).match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m);
    if (nameMatch) {
      metadata.name = nameMatch[1];
    }

    // Extract current title (often near the name)
    const titlePatterns = [
      /(?:^|\n)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:at|@|-)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /(?:Current Position|Title|Role):\s*([^\n]+)/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\n[-=]+$/m,
    ];

    for (const pattern of titlePatterns) {
      const match = text.substring(0, 1000).match(pattern);
      if (match) {
        metadata.currentTitle = match[1].trim();
        break;
      }
    }

    // Extract years of experience
    const expMatch = text.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i);
    if (expMatch) {
      metadata.totalExperience = expMatch[1] + ' years';
    }

    return metadata;
  }
}

export default ResumePreprocessor;