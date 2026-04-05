// ── SYNTAX HIGHLIGHTER ────────────────────────────────────────────────────────
// Replicates the highlight() function from the HTML file
// Returns an array of spans with color info (no dangerouslySetInnerHTML needed)

export interface TokenSpan {
  text: string;
  color: string;
}

const COLORS = {
  string: "#a5d6ff",
  number: "#ffa657",
  type: "#79c0ff",
  method: "#d2a8ff",
  keyword: "#e6edf3", // property keys (same as text in HTML)
  default: "#e6edf3",
  comment: "#6a737d",
};

type TokenType = "string" | "number" | "type" | "method" | "keyword" | "default";

interface RawToken {
  text: string;
  type: TokenType;
}

export function tokenizeLine(line: string): RawToken[] {
  // We'll do a simple state-machine pass matching the same patterns as the HTML
  const tokens: RawToken[] = [];
  let i = 0;

  while (i < line.length) {
    // String literal: '...'
    if (line[i] === "'") {
      let j = i + 1;
      while (j < line.length && line[j] !== "'") j++;
      j++; // include closing '
      tokens.push({ text: line.slice(i, j), type: "string" });
      i = j;
      continue;
    }

    // Number literal
    const numMatch = line.slice(i).match(/^\d+(\.\d+)?/);
    if (numMatch && (i === 0 || !/\w/.test(line[i - 1]))) {
      tokens.push({ text: numMatch[0], type: "number" });
      i += numMatch[0].length;
      continue;
    }

    // Word boundary — check for type/method/keyword
    const wordMatch = line.slice(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (wordMatch) {
      const word = wordMatch[0];
      const typeWords = ["Text", "TextStyle", "FontWeight", "Colors"];
      const methodWords = ["bold", "deepPurple"];

      // Check what follows the word
      const after = line.slice(i + word.length);

      if (typeWords.includes(word)) {
        tokens.push({ text: word, type: "type" });
      } else if (after.startsWith(":")) {
        // property key
        tokens.push({ text: word, type: "keyword" });
      } else {
        tokens.push({ text: word, type: "default" });
      }
      i += word.length;
      continue;
    }

    // Dot followed by method word
    if (line[i] === "." && i + 1 < line.length) {
      const afterDot = line.slice(i + 1).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
      if (afterDot) {
        const methodWords = ["bold", "deepPurple"];
        if (methodWords.includes(afterDot[0])) {
          tokens.push({ text: ".", type: "default" });
          tokens.push({ text: afterDot[0], type: "method" });
          i += 1 + afterDot[0].length;
          continue;
        }
      }
    }

    // Default: single char
    tokens.push({ text: line[i], type: "default" });
    i++;
  }

  return tokens;
}

export function colorForType(type: TokenType): string {
  return COLORS[type] ?? COLORS.default;
}
