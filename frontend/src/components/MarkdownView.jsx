import React from 'react';
import { Lightbulb } from 'lucide-react';

function renderInline(text) {
  if (!text) return null;

  // Tokenize inline markdown patterns:
  // 1. `inline code`
  // 2. **bold** or __bold__
  // 3. *italic* or _italic_
  // 4. [link text](url)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline code
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.88em',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            color: 'var(--color-cobalt)',
            fontWeight: 600
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold (** or __)
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <strong key={index} style={{ fontWeight: 700, color: 'var(--fg)' }}>
          {renderInline(part.slice(2, -2))}
        </strong>
      );
    }

    // Italic (* or _)
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={index} style={{ fontStyle: 'italic' }}>
          {renderInline(part.slice(1, -1))}
        </em>
      );
    }

    // Link [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--color-cobalt)', textDecoration: 'underline' }}
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}

function parseBlocks(markdown) {
  if (!markdown || typeof markdown !== 'string') return [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let currentList = null;

  const flushList = () => {
    if (currentList) {
      blocks.push({ ...currentList });
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Horizontal rule
    if (line === '---' || line === '***' || line === '___') {
      flushList();
      blocks.push({ type: 'hr' });
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList();
      blocks.push({ type: 'h1', text: line.slice(2).trim() });
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      blocks.push({ type: 'h3', text: line.slice(4).trim() });
      continue;
    }
    if (line.startsWith('#### ')) {
      flushList();
      blocks.push({ type: 'h4', text: line.slice(5).trim() });
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      blocks.push({ type: 'blockquote', text: line.slice(2).trim() });
      continue;
    }

    // Unordered list (- item, * item)
    const ulMatch = line.match(/^[-*+]\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered list (1. item)
    const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // Paragraph
    flushList();
    blocks.push({ type: 'p', text: line });
  }

  flushList();
  return blocks;
}

export default function MarkdownView({ content, style = {} }) {
  if (!content) {
    return <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>Chưa có nội dung lý thuyết.</p>;
  }

  const blocks = parseBlocks(content);

  return (
    <div className="markdown-view" style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--fg)', ...style }}>
      {blocks.map((block, idx) => {
        if (block.type === 'hr') {
          return (
            <hr
              key={idx}
              style={{
                border: 'none',
                borderTop: '1px solid var(--border)',
                margin: '22px 0'
              }}
            />
          );
        }

        if (block.type === 'h1') {
          return (
            <h1
              key={idx}
              style={{
                fontSize: 22,
                fontWeight: 800,
                marginTop: idx === 0 ? 0 : 24,
                marginBottom: 16,
                color: 'var(--fg)',
                letterSpacing: '-0.01em',
                lineHeight: 1.35
              }}
            >
              {renderInline(block.text)}
            </h1>
          );
        }

        if (block.type === 'h2') {
          const lower = block.text.toLowerCase();
          const isTip = lower.includes('mẹo') || lower.includes('tip') || lower.includes('lưu ý');

          if (isTip) {
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 22,
                  marginBottom: 10,
                  padding: '8px 14px',
                  background: 'var(--color-amber-surface)',
                  border: '1px solid var(--color-amber-border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--color-amber)'
                }}
              >
                <Lightbulb size={18} style={{ flexShrink: 0 }} />
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'inherit' }}>
                  {renderInline(block.text)}
                </h2>
              </div>
            );
          }

          return (
            <h2
              key={idx}
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginTop: idx === 0 ? 0 : 22,
                marginBottom: 10,
                color: 'var(--color-cobalt)',
                borderBottom: '1px solid var(--border)',
                paddingBottom: 6,
                lineHeight: 1.4
              }}
            >
              {renderInline(block.text)}
            </h2>
          );
        }

        if (block.type === 'h3') {
          return (
            <h3
              key={idx}
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginTop: 18,
                marginBottom: 8,
                color: 'var(--fg)',
                lineHeight: 1.4
              }}
            >
              {renderInline(block.text)}
            </h3>
          );
        }

        if (block.type === 'h4') {
          return (
            <h4
              key={idx}
              style={{
                fontSize: 14.5,
                fontWeight: 700,
                marginTop: 14,
                marginBottom: 6,
                color: 'var(--fg-muted)'
              }}
            >
              {renderInline(block.text)}
            </h4>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul
              key={idx}
              style={{
                paddingLeft: 22,
                marginTop: 6,
                marginBottom: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} style={{ lineHeight: 1.7 }}>
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol
              key={idx}
              style={{
                paddingLeft: 22,
                marginTop: 6,
                marginBottom: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} style={{ lineHeight: 1.7 }}>
                  {renderInline(item)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={idx}
              style={{
                borderLeft: '4px solid var(--color-cobalt)',
                margin: '14px 0',
                padding: '8px 16px',
                background: 'var(--color-cobalt-surface)',
                borderRadius: '0 var(--radius) var(--radius) 0',
                color: 'var(--fg)',
                fontStyle: 'italic'
              }}
            >
              {renderInline(block.text)}
            </blockquote>
          );
        }

        return (
          <p key={idx} style={{ margin: '0 0 12px', lineHeight: 1.75 }}>
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
