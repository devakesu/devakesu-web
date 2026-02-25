'use client';

import { useState, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import {
  PRIVACY_POLICY,
  getTermsOfUse,
  COOKIE_NOTICE,
  EFFECTIVE_DATE,
  CONTACT_EMAIL,
} from '@/lib/legal';

interface ProcessedLine {
  type: 'h3' | 'h4' | 'li' | 'p';
  content: string;
  index: number;
}

// Proper markdown to React component renderer
function MarkdownContent({ content }: { content: string }) {
  const processLine = (line: string, index: number): ProcessedLine | null => {
    // Skip empty lines
    if (!line.trim()) return null;

    // Headers
    if (line.startsWith('### ')) {
      return {
        type: 'h3',
        content: line.slice(4),
        index,
      };
    }

    if (line.startsWith('**') && line.endsWith('**') && !line.includes('[')) {
      return {
        type: 'h4',
        content: line.slice(2, -2),
        index,
      };
    }

    // Bullet points
    if (line.trim().startsWith('* ')) {
      return {
        type: 'li',
        content: line.trim().slice(2),
        index,
      };
    }

    // Regular paragraph
    return {
      type: 'p',
      content: line,
      index,
    };
  };

  const processed = content.split('\n').map(processLine).filter((item): item is ProcessedLine => item !== null);

  // Group consecutive list items into <ul> blocks
  const elements: ReactNode[] = [];
  let currentList: ProcessedLine[] = [];

  processed.forEach((item) => {
    if (item.type === 'li') {
      currentList.push(item);
    } else {
      // If we have accumulated list items, wrap them in <ul>
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${currentList[0].index}`} className="mb-3">
            {currentList.map((li) => (
              <li key={li.index} className="ml-6 mb-2 text-neutral-300">
                <InlineMarkdown text={li.content} />
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }

      // Add the non-list element
      if (item.type === 'h3') {
        elements.push(
          <h3 key={item.index} className="text-xl font-bold text-cyan-400 first:mt-0 mt-8 mb-3">
            {item.content}
          </h3>
        );
      } else if (item.type === 'h4') {
        elements.push(
          <h4
            key={item.index}
            className="text-base font-semibold text-neutral-200 first:mt-0 mt-5 mb-2"
          >
            {item.content}
          </h4>
        );
      } else if (item.type === 'p') {
        elements.push(
          <p key={item.index} className="mb-3 text-neutral-300 leading-relaxed">
            <InlineMarkdown text={item.content} />
          </p>
        );
      }
    }
  });

  // Handle any remaining list items at the end
  if (currentList.length > 0) {
    elements.push(
      <ul key={`ul-${currentList[0].index}`} className="mb-3">
        {currentList.map((li) => (
          <li key={li.index} className="ml-6 mb-2 text-neutral-300">
            <InlineMarkdown text={li.content} />
          </li>
        ))}
      </ul>
    );
  }

  return <>{elements}</>;
}

// Process inline markdown (bold, links, emails)
function InlineMarkdown({ text }: { content?: never; text: string }) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  // Combined regex to match bold, links, and emails.
  // Note: Email matching is intentionally simplified and not a full RFC-compliant validator.
  const regex =
    /(\*\*(.+?)\*\*)|(\[(.+?)\]\((.+?)\))|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63})|(✅)|(❌)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Bold **text**
      parts.push(
        <strong key={match.index} className="text-neutral-100 font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Link [text](url)
      parts.push(
        <a
          key={match.index}
          href={match[5]}
          className="text-cyan-400 hover:text-cyan-300 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {match[4]}
        </a>
      );
    } else if (match[6]) {
      // Email
      parts.push(
        <a
          key={match.index}
          href={`mailto:${match[6]}`}
          className="text-cyan-400 hover:text-cyan-300 underline"
        >
          {match[6]}
        </a>
      );
    } else if (match[7]) {
      // ✅
      parts.push(
        <span key={match.index} className="text-green-400">
          ✅
        </span>
      );
    } else if (match[8]) {
      // ❌
      parts.push(
        <span key={match.index} className="text-red-400">
          ❌
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

export default function PrivacyPage() {
  const [activeTab, setActiveTab] = useState('privacy');

  // Memoize Terms of Use to avoid regenerating markdown on every re-render.
  // Year is evaluated once on mount and stays cached for the component lifetime.
  const termsOfUse = useMemo(() => getTermsOfUse(new Date().getFullYear()), []);

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', content: PRIVACY_POLICY },
    { id: 'terms', label: 'Terms of Use', content: termsOfUse },
    { id: 'cookies', label: 'Cookie Notice', content: COOKIE_NOTICE },
  ];

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-neutral-100">
      {/* Header */}
      <div className="border-b border-neutral-800">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link
            href="/"
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-cyan-400 uppercase tracking-wide">
            Privacy & Legal
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">Effective Date: {EFFECTIVE_DATE}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-800">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 sm:px-6 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-cyan-400 border-cyan-400'
                    : 'text-neutral-400 border-transparent hover:text-neutral-200'
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.id === 'privacy' ? 'Privacy' : tab.id === 'terms' ? 'Terms' : 'Cookies'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-8 pb-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`prose prose-invert prose-cyan max-w-none ${activeTab === tab.id ? 'block' : 'hidden'}`}
          >
            <MarkdownContent content={tab.content} />
          </div>
        ))}

        {/* Footer Note */}
        <div className="mt-12 pt-8 border-t border-neutral-800">
          <p className="text-sm text-neutral-500 text-center mb-3">
            Questions or concerns? Email me at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-cyan-400 hover:text-cyan-300">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-xs text-neutral-600 text-center mt-2 mb-12 sm:mb-2">
            This site is open source. View the{' '}
            <a
              href="https://github.com/devakesu/devakesu-web"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300"
            >
              source code on GitHub
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
