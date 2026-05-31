'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { useLocale } from '@/components/providers/locale-provider';
import { usePublicStats, formatPlatformVolume, formatCompactCount } from '@/hooks/use-public-stats';
import {
  homeHover,
  homeReveal,
  homeStagger,
} from '@/lib/home-animation-classes';
import { SectionBottomFade } from '@/components/home/section-bottom-fade';

const RatingStars = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, index) => (
        index < rating ? (
          <StarIcon key={index} className="w-4 h-4 text-yellow-400" />
        ) : (
          <StarOutlineIcon key={index} className="w-4 h-4 text-gray-300" />
        )
      ))}
    </div>
  );
};

function CsgoRepLink({ size = 'default' }: { size?: 'default' | 'large' }) {
  const { messages } = useLocale();
  const innerPadding = size === 'large' ? 'px-6 py-3' : 'px-5 py-2.5';

  return (
    <a
      href="https://csgo-rep.com/profile/76561199040420116"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex relative group ${homeHover.lift}`}
    >
      <span className="absolute -inset-[2px] rounded-full opacity-80 blur-[2px] group-hover:opacity-100 group-hover:blur-[3px] transition-all duration-300 home-neon-border" />
      <span className={`relative inline-flex items-center space-x-2 lunar-card ${innerPadding} rounded-full bg-background/90 text-sm font-semibold`}>
        <svg className="w-4 h-4 text-orange-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        <span>
          {messages.testimonials.basedOn} <strong className="text-orange-500">806+</strong> {messages.testimonials.reviews} CSGO-Rep
        </span>
        <svg className="w-3.5 h-3.5 opacity-60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </span>
    </a>
  );
}

export function TestimonialsSection() {
  const { messages } = useLocale();
  const { data: publicStats } = usePublicStats();
  const volumeDisplay = formatPlatformVolume(publicStats?.totalVolumeCents ?? 0);
  const skinsDisplay = formatCompactCount(publicStats?.totalSkinsSold ?? 0);
  const usersDisplay = formatCompactCount(publicStats?.totalUsers ?? 0);
  
  const avatars = [
    'https://avatars.steamstatic.com/8707319fd87ef78f9c3166d44d5a928d72230415_full.jpg',
    'https://avatars.steamstatic.com/ddce018ed952993af326e8724b47384fcae6a10f_full.jpg',
    'https://avatars.steamstatic.com/19e7c4f5d57f662bc37925422efa31aeaebbd9e2_full.jpg',
    'https://avatars.steamstatic.com/cefaaaad35c70dd51850d509c6916b42743e8d98_full.jpg',
    'https://avatars.steamstatic.com/d13c71aa50fa3bc9a4ef543138e362fffbdebf93_full.jpg',
    'https://avatars.steamstatic.com/f77faaef3023f24ec09a5398c650f552bd4a7b6a_full.jpg',
  ];

  const steamIds = [
    '76561198354097387',
    '76561198980987936',
    '76561199496067896',
    '76561198061376237',
    '76561198067621699',
    '76561198001122376',
  ];

  const testimonials = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: messages.testimonials.items.name[i],
    steamId: steamIds[i],
    avatar: avatars[i],
    rating: 5,
    comment: messages.testimonials.items.comment[i],
    amount: messages.testimonials.items.amount[i],
    date: messages.testimonials.items.date?.[i] ?? '',
    verified: true,
  }));

  return (
    <section className="relative py-24 bg-muted/30">
      <SectionBottomFade to="muted" />
      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <div className={`text-center mb-16 ${homeReveal.upSm}`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {messages.testimonials.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {messages.testimonials.subtitle}
          </p>
          
          {/* Rating Summary */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <div className="flex items-center space-x-2">
              <RatingStars rating={5} />
              <span className="text-2xl font-bold">{messages.testimonials.rating}</span>
              <span className="text-muted-foreground">/5</span>
            </div>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <CsgoRepLink />
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`${homeReveal.up} ${homeStagger(index)}`}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <a href={`https://csgo-rep.com/profile/${testimonial.steamId}`} target="_blank" rel="noopener noreferrer">
                        <Avatar className="w-10 h-10 ring-2 ring-transparent hover:ring-theme-accent transition-all">
                          <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                          <AvatarFallback>
                            {testimonial.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </a>
                      <div>
                        <div className="flex items-center space-x-2">
                          <a href={`https://csgo-rep.com/profile/${testimonial.steamId}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                            <h4 className="font-semibold text-sm">{testimonial.name}</h4>
                          </a>
                          {testimonial.verified && (
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center" title="CSGO-Rep verified">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{testimonial.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{testimonial.amount}</div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mb-3">
                    <RatingStars rating={testimonial.rating} />
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    &quot;{testimonial.comment}&quot;
                  </p>

                  {testimonial.date && (
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                    <span className="font-medium">{testimonial.date}</span>
                  </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* CSGO-Rep Link */}
        <div className={`text-center mt-10 ${homeReveal.upSm}`}>
          <CsgoRepLink size="large" />
        </div>

        {/* Trust Indicators */}
        <div className={`mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center ${homeReveal.upSm}`}>
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {skinsDisplay.prefix}
              {skinsDisplay.value.toLocaleString(undefined, {
                minimumFractionDigits: skinsDisplay.decimals,
                maximumFractionDigits: skinsDisplay.decimals,
              })}
              {skinsDisplay.suffix}
            </div>
            <div className="text-sm text-muted-foreground">{messages.testimonials.trustStats.skinsSold}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {usersDisplay.prefix}
              {usersDisplay.value.toLocaleString(undefined, {
                minimumFractionDigits: usersDisplay.decimals,
                maximumFractionDigits: usersDisplay.decimals,
              })}
              {usersDisplay.suffix}
            </div>
            <div className="text-sm text-muted-foreground">{messages.testimonials.trustStats.users}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {volumeDisplay.prefix}
              {volumeDisplay.value.toLocaleString(undefined, {
                minimumFractionDigits: volumeDisplay.decimals,
                maximumFractionDigits: volumeDisplay.decimals,
              })}
              {volumeDisplay.suffix}
            </div>
            <div className="text-sm text-muted-foreground">{messages.testimonials.trustStats.volume}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">{messages.testimonials.trustStats.support}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
