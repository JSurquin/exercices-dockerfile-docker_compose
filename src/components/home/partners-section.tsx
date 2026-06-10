'use client';

import { useQuery } from '@tanstack/react-query';
import { Heart, Play, Youtube } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';
import { getYoutubeThumbnailUrl, getYoutubeWatchUrl } from '@/lib/youtube';
import { cn } from '@/lib/utils';
import {
  homeReveal,
  homeStagger,
} from '@/lib/home-animation-classes';
import { SectionBottomFade } from '@/components/home/section-bottom-fade';

interface PartnerVideo {
  id: string;
  youtubeVideoId: string;
  youtubeVideoUrl: string;
  creatorName: string;
  subscriberCount: string | null;
  avatarUrl: string | null;
  youtubeChannelUrl: string | null;
  twitterUrl: string | null;
}

interface PartnerLogo {
  id: string;
  name: string;
  logoUrl: string;
  profileUrl: string | null;
}

interface PartnersResponse {
  videos: PartnerVideo[];
  logos: PartnerLogo[];
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function PartnerAvatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-9 w-9 rounded-full object-cover ring-2 ring-border"
      />
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-theme-accent ring-2 ring-border">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function VideoCard({ video }: { video: PartnerVideo }) {
  const watchUrl = getYoutubeWatchUrl(video.youtubeVideoId);
  const thumbUrl = getYoutubeThumbnailUrl(video.youtubeVideoId);

  return (
    <article className="group flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition-all duration-300 hover:border-theme-accent/30 hover:shadow-md sm:w-auto">
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-video overflow-hidden bg-muted"
        aria-label={`${video.creatorName}, YouTube`}
      >
        <img
          src={thumbUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('hqdefault')) {
              target.src = getYoutubeThumbnailUrl(video.youtubeVideoId, 'hq');
            }
          }}
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#606070]/90 shadow-lg">
            <Play className="ml-1 h-7 w-7 fill-white text-white" />
          </span>
        </div>
      </a>

      <div className="flex items-center gap-3 border-t border-border bg-muted/40 px-3 py-3 dark:bg-muted/20">
        {video.youtubeChannelUrl ? (
          <a href={video.youtubeChannelUrl} target="_blank" rel="noopener noreferrer">
            <PartnerAvatar src={video.avatarUrl} name={video.creatorName} />
          </a>
        ) : (
          <PartnerAvatar src={video.avatarUrl} name={video.creatorName} />
        )}

        <div className="min-w-0 flex-1">
          {video.youtubeChannelUrl ? (
            <a
              href={video.youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-sm font-semibold text-foreground hover:text-foreground/80"
            >
              {video.creatorName}
            </a>
          ) : (
            <p className="truncate text-sm font-semibold text-foreground">{video.creatorName}</p>
          )}
          {video.subscriberCount && (
            <p className="text-xs text-muted-foreground">{video.subscriberCount}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="YouTube"
          >
            <Youtube className="h-4 w-4" />
          </a>
          {video.twitterUrl && (
            <a
              href={video.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="X"
            >
              <XIcon className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function LogoItem({ logo }: { logo: PartnerLogo }) {
  const inner = (
    <>
      <div className="relative h-14 w-14 overflow-hidden rounded-full border border-border bg-card transition-all duration-300 group-hover:border-theme-accent/30 group-hover:ring-2 group-hover:ring-theme-accent/15">
        <img src={logo.logoUrl} alt={logo.name} className="h-full w-full object-cover" />
      </div>
      <span className="max-w-[72px] truncate text-center text-[10px] text-muted-foreground transition-colors group-hover:text-foreground">
        {logo.name}
      </span>
    </>
  );

  if (logo.profileUrl) {
    return (
      <a
        href={logo.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col items-center gap-2"
      >
        {inner}
      </a>
    );
  }

  return <div className="group flex flex-col items-center gap-2">{inner}</div>;
}

export function PartnersSection() {
  const { messages } = useLocale();
  const t = messages.partners;

  const { data, isLoading } = useQuery<PartnersResponse>({
    queryKey: ['partners', 'public'],
    queryFn: async () => {
      const res = await fetch('/api/partners');
      if (!res.ok) throw new Error('Failed to load partners');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const videos = data?.videos ?? [];
  const logos = data?.logos ?? [];

  if (!isLoading && videos.length === 0 && logos.length === 0) {
    return null;
  }

  return (
    <section
      id="partners"
      className="relative overflow-hidden bg-muted/30 py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-theme-accent/5 via-transparent to-transparent" />
      <SectionBottomFade to="background" />

      <div className="container relative z-10 mx-auto px-4">
        <div className={`mb-12 text-center ${homeReveal.upSm}`}>
          <div className="mb-4 flex justify-center">
            <Heart className="h-8 w-8 text-theme-accent" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-wide md:text-3xl">
            {t.title}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            {t.contactPrefix}{' '}
            <a
              href={`mailto:${t.contactEmail}`}
              className="font-medium text-theme-accent hover:text-theme-accent/80"
            >
              {t.contactEmail}
            </a>
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-theme-accent border-t-transparent" />
          </div>
        ) : (
          <>
            {videos.length > 0 && (
              <div className={`mb-14 ${homeReveal.fade}`}>
                <div
                  className={cn(
                    'flex gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border',
                    'md:grid md:overflow-visible md:pb-0',
                    videos.length >= 3
                      ? 'md:grid-cols-3'
                      : videos.length === 2
                        ? 'md:grid-cols-2'
                        : 'md:grid-cols-1 md:max-w-md md:mx-auto'
                  )}
                >
                  {videos.map((video, index) => (
                    <div
                      key={video.id}
                      className={`md:w-auto ${homeReveal.upMd} ${homeStagger(index)}`}
                    >
                      <VideoCard video={video} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {logos.length > 0 && (
              <div className={`flex flex-wrap items-start justify-center gap-6 md:gap-8 ${homeReveal.upSm}`}>
                {logos.map((logo) => (
                  <LogoItem key={logo.id} logo={logo} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
