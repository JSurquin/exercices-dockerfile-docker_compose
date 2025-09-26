'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { useLocale } from '@/components/providers/locale-provider';

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

export function TestimonialsSection() {
  const { messages } = useLocale();
  
  const testimonials = [
    {
      id: 1,
      name: messages.testimonials.items.name[0],
      username: `@${messages.testimonials.items.name[0].toLowerCase()}`,
      avatar: 'https://avatars.steamstatic.com/c5d56249ee5d28a07db4ac9f7f60af961fab5426_full.jpg',
      rating: 5,
      comment: messages.testimonials.items.comment[0],
      amount: messages.testimonials.items.amount[0],
      items: messages.testimonials.items.items[0],
      date: messages.testimonials.items.date[0],
      verified: true,
    },
    {
      id: 2,
      name: messages.testimonials.items.name[1],
      username: `@${messages.testimonials.items.name[1].toLowerCase()}`,
      avatar: 'https://avatars.steamstatic.com/185f21c3f1e8e55b1ff2f5dc1e8d3d2f5c6e7f8a_full.jpg',
      rating: 5,
      comment: messages.testimonials.items.comment[1],
      amount: messages.testimonials.items.amount[1],
      items: messages.testimonials.items.items[1],
      date: messages.testimonials.items.date[1],
      verified: true,
    },
    {
      id: 3,
      name: messages.testimonials.items.name[2],
      username: `@${messages.testimonials.items.name[2].toLowerCase()}`,
      avatar: 'https://avatars.steamstatic.com/8f3d5c1e9a2b4f6d8e7c9a1b2f4e6d8c7a9b1e2f_full.jpg',
      rating: 5,
      comment: messages.testimonials.items.comment[2],
      amount: messages.testimonials.items.amount[2],
      items: messages.testimonials.items.items[2],
      date: messages.testimonials.items.date[2],
      verified: true,
    },
    {
      id: 4,
      name: messages.testimonials.items.name[3],
      username: `@${messages.testimonials.items.name[3].toLowerCase()}`,
      avatar: 'https://avatars.steamstatic.com/2f4e6d8c7a9b1e2f4e6d8c7a9b1e2f4e6d8c7a9b_full.jpg',
      rating: 5,
      comment: messages.testimonials.items.comment[3],
      amount: messages.testimonials.items.amount[3],
      items: messages.testimonials.items.items[3],
      date: messages.testimonials.items.date[3],
      verified: true,
    },
    {
      id: 5,
      name: messages.testimonials.items.name[4],
      username: `@${messages.testimonials.items.name[4].toLowerCase()}`,
      avatar: 'https://avatars.steamstatic.com/4e6d8c7a9b1e2f4e6d8c7a9b1e2f4e6d8c7a9b1e_full.jpg',
      rating: 5,
      comment: messages.testimonials.items.comment[4],
      amount: messages.testimonials.items.amount[4],
      items: messages.testimonials.items.items[4],
      date: messages.testimonials.items.date[4],
      verified: true,
    },
    {
      id: 6,
      name: messages.testimonials.items.name[5],
      username: `@${messages.testimonials.items.name[5].toLowerCase()}`,
      avatar: 'https://avatars.steamstatic.com/6d8c7a9b1e2f4e6d8c7a9b1e2f4e6d8c7a9b1e2f4_full.jpg',
      rating: 5,
      comment: messages.testimonials.items.comment[5],
      amount: messages.testimonials.items.amount[5],
      items: messages.testimonials.items.items[5],
      date: messages.testimonials.items.date[5],
      verified: true,
    },
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {messages.testimonials.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {messages.testimonials.subtitle}
          </p>
          
          {/* Rating Summary */}
          <div className="flex items-center justify-center space-x-3 sm:space-x-4 mt-8">
            <div className="flex items-center space-x-2">
              <RatingStars rating={5} />
              <span className="text-2xl font-bold">{messages.testimonials.rating}</span>
              <span className="text-muted-foreground">/5</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="text-muted-foreground">
              {messages.testimonials.basedOn} <strong>3,247</strong> {messages.testimonials.reviews}
            </div>
          </div>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>
                          {testimonial.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-sm">{testimonial.name}</h4>
                          {testimonial.verified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{testimonial.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{testimonial.amount}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.date}</div>
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

                  {/* Items */}
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                    <span className="font-medium">Items vendus:</span> {testimonial.items}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">99.8%</div>
            <div className="text-sm text-muted-foreground">{messages.testimonials.trustStats.satisfaction}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">15,420+</div>
            <div className="text-sm text-muted-foreground">{messages.testimonials.trustStats.users}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">€2.4M+</div>
            <div className="text-sm text-muted-foreground">{messages.testimonials.trustStats.volume}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">{messages.testimonials.trustStats.support}</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
