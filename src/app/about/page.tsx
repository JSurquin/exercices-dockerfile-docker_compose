"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { usePublicStats } from "@/hooks/use-public-stats";
import { MOONSKIN_DISCORD_URL, MOONSKIN_X_URL } from "@/lib/moonskin-social";
import { Messages } from "~/utils/types";
import { cn } from "@/lib/utils";
import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  GlobeEuropeAfricaIcon,
  ChartBarIcon,
  BoltIcon,
  EyeIcon,
  RocketLaunchIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";

const TEAM_ORDER = [
  "founder",
  "operations",
  "moderator1",
  "moderator2",
  "moderator3",
  "contractor",
] as const;

const getStats = (
  messages: Messages,
  totalUsers: number,
  volumeMillions: number,
  completedTrades: number
) => [
  { label: messages.about.stats.users, value: `${totalUsers.toLocaleString()}+`, icon: UserGroupIcon },
  { label: messages.about.stats.volume, value: `€${volumeMillions}M+`, icon: CurrencyDollarIcon },
  { label: messages.about.stats.trades, value: `${completedTrades.toLocaleString()}+`, icon: ChartBarIcon },
  { label: messages.about.stats.countries, value: "25+", icon: GlobeEuropeAfricaIcon },
];

const getTeam = (messages: Messages) =>
  TEAM_ORDER.map((key) => {
    const m = messages.about.team.members[key];
    return {
      ...m,
      key,
      avatar: `/team/${key}.jpg`,
    };
  });

const getValues = (messages: Messages) => [
  {
    icon: BoltIcon,
    title: messages.about.values.performance.title,
    description: messages.about.values.performance.description,
  },
  {
    icon: EyeIcon,
    title: messages.about.values.transparency.title,
    description: messages.about.values.transparency.description,
  },
  {
    icon: ShieldCheckIcon,
    title: messages.about.values.security.title,
    description: messages.about.values.security.description,
  },
  {
    icon: RocketLaunchIcon,
    title: messages.about.values.longTerm.title,
    description: messages.about.values.longTerm.description,
  },
];

function GlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("lunar-card p-6 sm:p-8", className)}>
      {children}
    </div>
  );
}

export default function AboutPage() {
  const { messages } = useLocale();
  const { user, loginWithSteam } = useAuth();
  const router = useRouter();
  const { data: publicStats } = usePublicStats();

  const handleSteamCta = () => {
    if (user) {
      router.push("/sell");
      return;
    }
    void loginWithSteam();
  };
  const stats = getStats(
    messages,
    publicStats?.totalUsers ?? 0,
    publicStats?.volumeMillions ?? 0,
    publicStats?.completedTrades ?? 0
  );
  const team = getTeam(messages);
  const values = getValues(messages);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto space-y-10 sm:space-y-14">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassPanel className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <button
                type="button"
                onClick={handleSteamCta}
                className="w-full max-w-full text-center bg-transparent border-0 p-0 font-bold text-inherit cursor-pointer hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded-sm"
              >
                {messages.about.title}{" "}
                <span className="text-chrome-gradient">MoonSkin</span>
              </button>
            </h1>
            <p className="text-xl font-medium text-foreground/90 mb-6">{messages.about.tagline}</p>
            <div className="text-muted-foreground space-y-4 text-left md:text-center max-w-3xl mx-auto">
              <p className="text-lg">{messages.about.intro.p1}</p>
              <p className="text-lg">{messages.about.intro.p2}</p>
              <p className="text-lg">{messages.about.intro.p3}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center"
                >
                  <stat.icon className="w-7 h-7 mx-auto mb-2 text-theme-accent" />
                  <p className="text-2xl font-bold text-chrome-gradient">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </GlassPanel>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <GlassPanel className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8">
              {messages.about.mission.title}
            </h2>
            <p className="text-lg text-muted-foreground mb-6">{messages.about.mission.p1}</p>
            <p className="font-medium mb-3">{messages.about.mission.frictionTitle}</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
              {messages.about.mission.frictionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-lg text-muted-foreground">{messages.about.mission.closing}</p>
          </GlassPanel>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <GlassPanel className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8">
              {messages.about.story.title}
            </h2>
            <div className="space-y-5 text-muted-foreground text-lg">
              {messages.about.story.paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </GlassPanel>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{messages.about.values.title}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{messages.about.values.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassPanel className="h-full text-center">
                  <value.icon className="w-12 h-12 mx-auto mb-4 text-theme-accent" />
                  <h3 className="font-semibold mb-3">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{messages.about.team.title}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{messages.about.team.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={member.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <GlassPanel className="text-center h-full flex flex-col">
                  <Avatar className="w-20 h-20 mx-auto mb-4 ring-2 ring-white/10">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold mb-1">{member.name}</h3>
                  <p className="text-sm text-theme-accent mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{member.bio}</p>
                  {"linkUrl" in member && member.linkUrl ? (
                    <p className="text-xs mb-3">
                      <a
                        href={member.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-theme-accent hover:underline cursor-pointer"
                      >
                        {member.linkLabel ?? member.linkUrl}
                      </a>
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-1 justify-center">
                    {member.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs bg-white/[0.06] border-white/10">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mt-10 text-sm sm:text-base">
            {messages.about.team.footer}
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <GlassPanel className="border-theme-accent/30 bg-gradient-to-br from-theme-accent/5 to-theme-accent/10 overflow-hidden chrome-shimmer">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-theme-accent/20 bg-gradient-to-br from-theme-accent/15 to-theme-accent/20 mx-auto sm:mx-0">
                <BuildingOffice2Icon className="h-8 w-8 text-theme-accent" aria-hidden />
              </div>
              <div className="flex-1 text-center sm:text-left space-y-3">
                <h2 className="text-2xl sm:text-3xl font-bold">
                  {messages.about.technicalPartner.title}
                </h2>
                <p className="text-sm font-medium text-theme-accent">
                  {messages.about.technicalPartner.role}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {messages.about.technicalPartner.description}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {messages.about.technicalPartner.location}
                </p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                  {messages.about.technicalPartner.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-white/[0.06] border-white/10">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="pt-2">
                  <a
                    href={messages.about.technicalPartner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-theme-accent hover:underline cursor-pointer"
                  >
                    {messages.about.technicalPartner.websiteLabel}
                  </a>
                </p>
              </div>
            </div>
          </GlassPanel>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <GlassPanel className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">{messages.about.now.title}</h2>
            <p className="text-lg text-muted-foreground mb-4">{messages.about.now.p1}</p>
            <p className="text-lg text-muted-foreground">{messages.about.now.p2}</p>
          </GlassPanel>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{messages.about.roadmap.title}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {messages.about.roadmap.phases.map((phase) => (
              <GlassPanel key={phase.title}>
                <h3 className="font-semibold text-lg mb-4">{phase.title}</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  {phase.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </GlassPanel>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mt-8"
          >
            <GlassPanel className="brand-panel">
              <h3 className="text-xl font-bold mb-3">{messages.about.roadmap.visionTitle}</h3>
              <p className="text-muted-foreground mb-4">{messages.about.roadmap.visionLead}</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                {messages.about.roadmap.visionItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </GlassPanel>
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <GlassPanel className="text-center chrome-shimmer">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{messages.about.cta.title}</h2>
            <p className="text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              {messages.about.cta.description}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
              <Button asChild variant="cta">
                <Link href="/sell">{messages.about.cta.start}</Link>
              </Button>
              <Button variant="outline" asChild className="border-white/15 bg-white/[0.04] hover:bg-white/[0.08]">
                <a href={MOONSKIN_DISCORD_URL} target="_blank" rel="noopener noreferrer">
                  {messages.about.cta.discord}
                </a>
              </Button>
              <Button variant="outline" asChild className="border-white/15 bg-white/[0.04] hover:bg-white/[0.08]">
                <a href={MOONSKIN_X_URL} target="_blank" rel="noopener noreferrer">
                  {messages.about.cta.x}
                </a>
              </Button>
            </div>
          </GlassPanel>
        </motion.section>
      </div>
    </div>
  );
}
