'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  parseChatMessageAttachment,
  shouldShowChatMessageText,
} from '@/lib/chat-attachment';
import { preserveChatLineBreaks } from '@/lib/chat-widget-styles';

export const CHAT_REMARK_PLUGINS = [remarkGfm];

/** Liens dans les bulles chat — alignés sur l’identité MoonSkin (accent + survol highlight). */
export const CHAT_MARKDOWN_LINK_CLASS =
  'chat-markdown-link font-medium underline decoration-theme-accent/45 underline-offset-[3px] transition-colors duration-150 hover:text-theme-highlight hover:decoration-theme-highlight/70';

export const CHAT_MARKDOWN_COMPONENTS = {
  p: ({ children }: { children?: ReactNode }) => <p className="mb-1 last:mb-0">{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className="text-sm">{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
  code: ({ children }: { children?: ReactNode }) => (
    <code className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
  ),
  h1: ({ children }: { children?: ReactNode }) => <p className="font-semibold text-sm mb-1">{children}</p>,
  h2: ({ children }: { children?: ReactNode }) => <p className="font-semibold text-sm mb-1">{children}</p>,
  h3: ({ children }: { children?: ReactNode }) => <p className="font-medium text-sm mb-0.5">{children}</p>,
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    const isInternal = href?.startsWith('/');
    return (
      <a
        href={href}
        target={isInternal ? undefined : '_blank'}
        rel={isInternal ? undefined : 'noopener noreferrer'}
        className={CHAT_MARKDOWN_LINK_CLASS}
      >
        {children}
      </a>
    );
  },
  br: () => <br />,
};

export function shouldRenderChatMarkdown(senderType: string): boolean {
  return senderType !== 'USER';
}

export function ChatMessageImage({
  url,
  alt,
  className = 'max-w-full rounded-md border border-border/40',
}: {
  url: string;
  alt: string;
  className?: string;
}) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1 first:mt-0">
      <Image
        src={url}
        alt={alt}
        width={320}
        height={240}
        unoptimized
        className={`${className} h-auto w-auto max-h-52 object-contain cursor-zoom-in`}
      />
    </a>
  );
}

export function ChatMessageContent({
  content,
  senderType,
  metadata,
  resolveContent,
  imageAlt,
}: {
  content: string;
  senderType: string;
  metadata?: unknown;
  resolveContent: (content: string) => string;
  imageAlt: string;
}) {
  const attachment = parseChatMessageAttachment(metadata);
  const resolvedContent = resolveContent(content);
  const showText = shouldShowChatMessageText(content, Boolean(attachment));

  return (
    <>
      {attachment ? (
        <ChatMessageImage url={attachment.url} alt={imageAlt} />
      ) : null}
      {showText ? (
        senderType === 'USER' ? (
          <p className={`whitespace-pre-wrap ${attachment ? 'mt-2' : ''}`}>{resolvedContent}</p>
        ) : (
          <div className={attachment ? 'mt-2' : undefined}>
            <ChatMarkdownContent content={resolvedContent} />
          </div>
        )
      ) : null}
    </>
  );
}

export function ChatMarkdownContent({
  content,
  className = 'text-sm leading-relaxed',
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={CHAT_REMARK_PLUGINS} components={CHAT_MARKDOWN_COMPONENTS}>
        {preserveChatLineBreaks(content)}
      </ReactMarkdown>
    </div>
  );
}
