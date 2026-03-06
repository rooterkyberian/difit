import type { Comment } from '../types/diff';

import { hasSuggestionBlock, parseSuggestionBlocks } from './suggestionUtils.js';

export function formatCommentPrompt(
  file: string,
  line: number | number[],
  body: string,
  codeContent?: string,
): string {
  const lineInfo =
    typeof line === 'number' ? `L${line}` : Array.isArray(line) ? `L${line[0]}-L${line[1]}` : '';

  // Handle undefined or null file paths
  const filePath = file || '<unknown file>';

  // Check if body contains suggestion blocks
  if (hasSuggestionBlock(body)) {
    const suggestions = parseSuggestionBlocks(body);
    if (suggestions.length > 0) {
      let result = `${filePath}:${lineInfo}`;

      // Walk through body preserving text between suggestion blocks
      let lastIndex = 0;
      for (const suggestion of suggestions) {
        // Add text before this suggestion block
        const textBefore = body.slice(lastIndex, suggestion.startIndex).trim();
        if (textBefore) {
          result += `\n${textBefore}`;
        }

        // Add structured ORIGINAL/SUGGESTED format
        if (codeContent) {
          result += `\nORIGINAL:\n\`\`\`\n${codeContent}\n\`\`\``;
        }
        result += `\nSUGGESTED:\n\`\`\`\n${suggestion.suggestedCode}\n\`\`\``;

        lastIndex = suggestion.endIndex;
      }

      // Add remaining text after the last suggestion block
      const textAfter = body.slice(lastIndex).trim();
      if (textAfter) {
        result += `\n${textAfter}`;
      }

      return result;
    }
  }

  // Regular comment without suggestion
  return `${filePath}:${lineInfo}\n${body}`;
}

export function formatAllCommentsPrompt(comments: Comment[]): string {
  if (comments.length === 0) return '';

  const prompts = comments.map((comment) =>
    formatCommentPrompt(comment.file, comment.line, comment.body, comment.codeContent),
  );

  return prompts.join('\n=====\n');
}

export function formatCommentsOutput(comments: Comment[]): string {
  const allPrompts = formatAllCommentsPrompt(comments);

  return [
    '\n📝 Comments from review session:',
    '='.repeat(50),
    allPrompts,
    '='.repeat(50),
    `Total comments: ${comments.length}\n`,
  ].join('\n');
}

/**
 * Format comments for AI-optimized stdout output (used by --review mode).
 * Produces a simple, parseable format without decorative elements.
 */
export function formatReviewOutput(comments: Comment[], incomplete: boolean): string {
  if (incomplete && comments.length === 0) {
    return '# INCOMPLETE REVIEW - Browser disconnected during review\n';
  }

  const lines: string[] = [];

  if (incomplete) {
    lines.push('# INCOMPLETE REVIEW - Browser disconnected during review');
  }

  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    const filePath = comment.file || '<unknown file>';
    const lineInfo = formatReviewLineInfo(comment.line);
    lines.push(`${filePath}:${lineInfo}`);
    lines.push(comment.body);

    if (i < comments.length - 1) {
      lines.push('');
    }
  }

  return lines.join('\n') + '\n';
}

function formatReviewLineInfo(line: number | number[]): string {
  if (typeof line === 'number') {
    return String(line);
  }
  if (Array.isArray(line) && line.length === 2) {
    return `${line[0]}-${line[1]}`;
  }
  return '';
}
