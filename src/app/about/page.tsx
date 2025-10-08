"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocale } from "@/components/providers/locale-provider";
import { Messages } from "~/utils/types";
import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  GlobeEuropeAfricaIcon,
  ChartBarIcon,
  HeartIcon,
  LightBulbIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

const getStats = (messages: Messages) => [
  { label: messages.about.stats.users, value: "15,420+", icon: UserGroupIcon },
  { label: messages.about.stats.volume, value: "€2.4M+", icon: CurrencyDollarIcon },
  { label: messages.about.stats.trades, value: "8,967+", icon: ChartBarIcon },
  { label: messages.about.stats.countries, value: "25+", icon: GlobeEuropeAfricaIcon },
];

const getTeam = (messages: Messages) => [
  {
    name: messages.about.team.members.ceo.name,
    role: messages.about.team.members.ceo.role,
    bio: messages.about.team.members.ceo.bio,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    skills: ["Leadership", "Trading", "Blockchain"],
  },
  {
    name: messages.about.team.members.cto.name,
    role: messages.about.team.members.cto.role,
    bio: messages.about.team.members.cto.bio,
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612d451?w=150&h=150&fit=crop&crop=face",
    skills: ["Blockchain", "Security", "Architecture"],
  },
  {
    name: messages.about.team.members.product.name,
    role: messages.about.team.members.product.role,
    bio: messages.about.team.members.product.bio,
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    skills: ["UX/UI", "Product", "Gaming"],
  },
  {
    name: messages.about.team.members.compliance.name,
    role: messages.about.team.members.compliance.role,
    bio: messages.about.team.members.compliance.bio,
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    skills: ["Compliance", "Legal", "GDPR"],
  },
];

const getValues = (messages: Messages) => [
  {
    icon: ShieldCheckIcon,
    title: messages.about.values.security.title,
    description: messages.about.values.security.description,
  },
  {
    icon: HeartIcon,
    title: messages.about.values.community.title,
    description: messages.about.values.community.description,
  },
  {
    icon: LightBulbIcon,
    title: messages.about.values.innovation.title,
    description: messages.about.values.innovation.description,
  },
  {
    icon: RocketLaunchIcon,
    title: messages.about.values.simplicity.title,
    description: messages.about.values.simplicity.description,
  },
];

const getTimeline = (messages: Messages) => [
  {
    year: messages.about.timeline.events.founding.year,
    title: messages.about.timeline.events.founding.title,
    description: messages.about.timeline.events.founding.description,
  },
  {
    year: messages.about.timeline.events.mvp.year,
    title: messages.about.timeline.events.mvp.title,
    description: messages.about.timeline.events.mvp.description,
  },
  {
    year: messages.about.timeline.events.crypto.year,
    title: messages.about.timeline.events.crypto.title,
    description: messages.about.timeline.events.crypto.description,
  },
  {
    year: messages.about.timeline.events.gamification.year,
    title: messages.about.timeline.events.gamification.title,
    description: messages.about.timeline.events.gamification.description,
  },
  {
    year: messages.about.timeline.events.international.year,
    title: messages.about.timeline.events.international.title,
    description: messages.about.timeline.events.international.description,
  },
  {
    year: messages.about.timeline.events.future.year,
    title: messages.about.timeline.events.future.title,
    description: messages.about.timeline.events.future.description,
  },
];

export default function AboutPage() {
  const { messages } = useLocale();
  const stats = getStats(messages);
  const team = getTeam(messages);
  const values = getValues(messages);
  const timeline = getTimeline(messages);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {messages.about.title}{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                CashTrade
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-6 sm:mb-8">
              {messages.about.subtitle}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Notre Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-6 sm:mb-8">
              {messages.about.mission.title}
            </h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-lg text-muted-foreground mb-6">
                  {messages.about.mission.description1}
                </p>
                <p className="text-lg text-muted-foreground mb-6">
                  {messages.about.mission.description2}
                </p>
                <p className="text-lg text-muted-foreground">
                  {messages.about.mission.description3}
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-2xl" />
                <div className="rounded-2xl relative z-10 bg-muted/50 h-64 flex items-center justify-center">
                  <span className="text-muted-foreground">Team Photo</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Nos Valeurs */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{messages.about.values.title}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {messages.about.values.subtitle}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <value.icon className="w-12 h-12 mx-auto mb-4 text-orange-600" />
                    <h3 className="font-semibold mb-3">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Notre Équipe */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{messages.about.team.title}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {messages.about.team.subtitle}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold mb-1">{member.name}</h3>
                    <p className="text-sm text-orange-600 mb-3">
                      {member.role}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {member.bio}
                    </p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {member.skills.map((skill, skillIndex) => (
                        <Badge
                          key={skillIndex}
                          variant="secondary"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{messages.about.timeline.title}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {messages.about.timeline.subtitle}
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 md:left-1/2 md:transform md:-translate-x-px h-full w-0.5 bg-gradient-to-b from-orange-500 to-red-600" />

              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center mb-6 sm:mb-8 ${
                    index % 2 === 0 ? "md:justify-start" : "md:justify-end"
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-4 md:left-1/2 md:transform md:-translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full border-4 border-background" />

                  {/* Content */}
                  <div
                    className={`ml-12 md:ml-0 md:w-5/12 ${
                      index % 2 === 0
                        ? "md:mr-auto md:pr-8"
                        : "md:ml-auto md:pl-8"
                    }`}
                  >
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <Badge variant="secondary" className="mb-2">
                          {item.year}
                        </Badge>
                        <h3 className="font-semibold mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-orange-500/10 to-red-600/10 rounded-2xl p-12 border">
              <h2 className="text-2xl sm:text-3xl lg:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                {messages.about.cta.title}
              </h2>
              <p className="text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
                {messages.about.cta.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-700 transition-all">
                  {messages.about.cta.start}
                </button>
                <button className="px-8 py-3 border border-muted-foreground rounded-lg font-medium hover:bg-muted transition-colors">
                  {messages.about.cta.discord}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
