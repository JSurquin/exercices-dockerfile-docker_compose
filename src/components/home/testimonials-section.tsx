'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

const testimonials = [
  {
    id: 1,
    name: 'ProGamer2024',
    username: '@progamer2024',
    avatar: 'https://avatars.steamstatic.com/c5d56249ee5d28a07db4ac9f7f60af961fab5426_full.jpg',
    rating: 5,
    comment: 'Super rapide ! J\'ai vendu mes skins et reçu mon paiement en seulement 2 jours après le trade hold Steam. Interface très claire et support réactif.',
    amount: '1,234€',
    items: 'AK-47 Redline + AWP Asiimov',
    date: 'Il y a 2 jours',
    verified: true,
  },
  {
    id: 2,
    name: 'SkinMaster',
    username: '@skinmaster',
    avatar: 'https://avatars.steamstatic.com/185f21c3f1e8e55b1ff2f5dc1e8d3d2f5c6e7f8a_full.jpg',
    rating: 5,
    comment: 'Meilleur site pour vendre ses skins ! Processus simple, estimation précise, et paiement SEPA ultra rapide. Je recommande à 100%.',
    amount: '987€',
    items: 'Glock Fade StatTrak™',
    date: 'Il y a 5 jours',
    verified: true,
  },
  {
    id: 3,
    name: 'CSGOKing',
    username: '@csgoking',
    avatar: 'https://avatars.steamstatic.com/8f3d5c1e9a2b4f6d8e7c9a1b2f4e6d8c7a9b1e2f_full.jpg',
    rating: 5,
    comment: 'Interface magnifique et très professionnelle. J\'ai pu suivre mon trade en temps réel et les notifications m\'ont tenu informé. Top !',
    amount: '2,156€',
    items: 'Karambit Fade + M4A4 Howl',
    date: 'Il y a 1 semaine',
    verified: true,
  },
  {
    id: 4,
    name: 'FrenchTrader',
    username: '@frenchtrader',
    avatar: 'https://avatars.steamstatic.com/2f4e6d8c7a9b1e2f4e6d8c7a9b1e2f4e6d8c7a9b_full.jpg',
    rating: 5,
    comment: 'Parfait pour les français ! Support en français, paiement SEPA, et conformité européenne. Enfin une plateforme sérieuse.',
    amount: '675€',
    items: 'USP-S Kill Confirmed',
    date: 'Il y a 1 semaine',
    verified: true,
  },
  {
    id: 5,
    name: 'TechSavvy',
    username: '@techsavvy',
    avatar: 'https://avatars.steamstatic.com/4e6d8c7a9b1e2f4e6d8c7a9b1e2f4e6d8c7a9b1e_full.jpg',
    rating: 5,
    comment: 'J\'adore le système de gamification ! Gagner de l\'XP et des tickets à chaque trade, c\'est génial. En plus les giveaways sont top.',
    amount: '445€',
    items: 'AK-47 Vulcan',
    date: 'Il y a 2 semaines',
    verified: true,
  },
  {
    id: 6,
    name: 'CryptoFan',
    username: '@cryptofan',
    avatar: 'https://avatars.steamstatic.com/6d8c7a9b1e2f4e6d8c7a9b1e2f4e6d8c7a9b1e2f4_full.jpg',
    rating: 5,
    comment: 'Support crypto excellent ! Bitcoin, Ethereum, USDT... tout y est. Frais transparents et pas de mauvaises surprises.',
    amount: '1,789€',
    items: 'Dragon Lore Factory New',
    date: 'Il y a 2 semaines',
    verified: true,
  },
];

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
            Ce que disent nos utilisateurs
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plus de 15,000 utilisateurs nous font confiance pour vendre leurs skins
          </p>
          
          {/* Rating Summary */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <div className="flex items-center space-x-2">
              <RatingStars rating={5} />
              <span className="text-2xl font-bold">4.9</span>
              <span className="text-muted-foreground">/5</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="text-muted-foreground">
              Basé sur <strong>3,247</strong> avis
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
                <CardContent className="p-6">
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
            <div className="text-sm text-muted-foreground">Taux de satisfaction</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">15,420+</div>
            <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">€2.4M+</div>
            <div className="text-sm text-muted-foreground">Volume traité</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Support disponible</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
