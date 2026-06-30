"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Link,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { toast } from "sonner";
import { parseSteamId64FromUserInput, normalizeSteamTradeLink } from "@/lib/steam-id";
import { cn } from "@/lib/utils";
import { Fragment } from "react";

interface InlineTradeLinkEditorProps {
  onSuccess?: (tradeLink: string) => void;
  compact?: boolean;
  embedded?: boolean;
}

const EMBEDDED_MODIFY_BUTTON_CLASS =
  "h-7 px-2.5 text-[11px] shrink-0 border-[rgba(159,196,255,0.22)] bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm";

const GLASS_SURFACE =
  "rounded-md border border-[rgba(159,196,255,0.14)] bg-white/[0.03] backdrop-blur-sm divide-y divide-[rgba(159,196,255,0.12)]";

const EXPAND_ANIMATION =
  "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

function truncateTradeUrl(url: string): string {
  if (url.length <= 52) return url;
  return `${url.slice(0, 32)}…${url.slice(-14)}`;
}

function renderHighlightedInstruction(text: string, highlights: string[]) {
  if (highlights.length === 0) return text;

  const sortedHighlights = [...highlights].sort((a, b) => b.length - a.length);
  const pattern = sortedHighlights
    .map((highlight) => highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const regex = new RegExp(`(${pattern})`, "g");
  const parts = text.split(regex).filter((part) => part.length > 0);

  return parts.map((part, index) =>
    sortedHighlights.includes(part) ? (
      <span key={index} className="text-theme-accent font-medium">
        {part}
      </span>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

function TradeLinkValidBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border border-[rgba(159,196,255,0.22)] bg-theme-accent/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-theme-accent shrink-0">
      <CheckCircle className="w-2.5 h-2.5" aria-hidden />
      {label}
    </span>
  );
}

export default function InlineTradeLinkEditor({
  onSuccess,
  compact = false,
  embedded = false,
}: InlineTradeLinkEditorProps) {
  const { user, updateUser } = useAuth();
  const { messages } = useLocale();
  const [isExpanded, setIsExpanded] = useState(!user?.tradeLink);
  const [tradeUrl, setTradeUrl] = useState(user?.tradeLink || "");
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(
    user?.tradeLink ? validateTradeUrl(user.tradeLink) : null,
  );
  const [loading, setLoading] = useState(false);
  const [extractedSteamId, setExtractedSteamId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.tradeLink) {
      setTradeUrl(user.tradeLink);
      const isValid = validateTradeUrl(user.tradeLink);
      setIsValidUrl(isValid);
      if (isValid) {
        const steamId = parseSteamId64FromUserInput(user.tradeLink);
        setExtractedSteamId(steamId);
      }
    }
  }, [user?.tradeLink]);

  function validateTradeUrl(url: string): boolean {
    const steamTradeUrlRegex =
      /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/?\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
    return steamTradeUrlRegex.test(url);
  }

  const handleUrlChange = (url: string) => {
    setTradeUrl(url);
    const isValid = url ? validateTradeUrl(url) : null;
    setIsValidUrl(isValid);
    if (isValid && url) {
      const steamId = parseSteamId64FromUserInput(url);
      setExtractedSteamId(steamId);
    } else {
      setExtractedSteamId(null);
    }
  };

  const handleSave = async () => {
    const normalized = normalizeSteamTradeLink(tradeUrl);
    if (!normalized) {
      toast.error(messages.settings.tradeLink.invalidFormat);
      return;
    }

    setLoading(true);
    try {
      await updateUser({ tradeLink: normalized });
      toast.success(messages.settings.tradeLink.savedSuccess);
      setTradeUrl(normalized);
      setIsExpanded(false);
      onSuccess?.(normalized);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du Trade Link:", error);
      toast.error(messages.settings.tradeLink.saveError);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTradeUrl("");
    setIsValidUrl(null);
    setExtractedSteamId(null);
  };

  const openSteamTradeUrl = () => {
    window.open(
      "https://steamcommunity.com/id/me/tradeoffers/privacy#trade_offer_access_url",
      "_blank",
    );
  };

  const sellTradeLink = messages.sellPage.tradeLinkSection;
  const tradeLinkMessages = messages.settings.tradeLink;

  const title = user?.tradeLink
    ? tradeLinkMessages.title
    : tradeLinkMessages.configureTradeLinkTitle;

  const modifyLabel = user?.tradeLink ? tradeLinkMessages.modify : tradeLinkMessages.configure;

  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  const renderExpandedForm = (formEmbedded = false) => (
    <div className={GLASS_SURFACE}>
      <Accordion type="single" collapsible defaultValue="help" className="px-3">
        <AccordionItem value="help" className="border-0">
          <AccordionTrigger
            className={cn(
              "py-2.5 text-left hover:no-underline [&>svg]:size-3 [&>svg]:text-muted-foreground/60",
              formEmbedded
                ? "text-[10px] text-muted-foreground/75 hover:text-muted-foreground"
                : "text-xs text-muted-foreground/80 hover:text-muted-foreground",
            )}
          >
            {tradeLinkMessages.howToGetTitle}
          </AccordionTrigger>
          <AccordionContent className="pb-2.5">
            <ol
              className={cn(
                "list-decimal list-inside space-y-0.5 text-muted-foreground/75 ml-1",
                formEmbedded ? "text-[10px]" : "text-xs",
              )}
            >
              {tradeLinkMessages.instructions.map((instruction, index) => (
                <li key={index}>
                  {renderHighlightedInstruction(
                    instruction,
                    tradeLinkMessages.instructionHighlights,
                  )}
                </li>
              ))}
            </ol>
            <Button
              variant="outline"
              size="sm"
              onClick={openSteamTradeUrl}
              className={cn(
                "mt-2 border-[rgba(159,196,255,0.22)] bg-white/[0.03] hover:bg-white/[0.06]",
                formEmbedded ? "h-7 text-[10px]" : "h-8 text-xs",
              )}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              {tradeLinkMessages.openSteam}
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className={cn("px-3 space-y-2", formEmbedded ? "py-2.5" : "py-3")}>
        <Label
          htmlFor="trade-url-inline"
          className={formEmbedded ? "text-[10px] text-muted-foreground/80" : "text-sm"}
        >
          {tradeLinkMessages.urlLabel}
        </Label>
        <div className="relative">
          <Input
            id="trade-url-inline"
            placeholder={tradeLinkMessages.placeholder}
            value={tradeUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className={cn(
              "bg-white/[0.02] border-[rgba(159,196,255,0.18)] transition-colors duration-200",
              formEmbedded && "h-8 text-xs",
              isValidUrl === false && "border-destructive/60 focus-visible:ring-destructive/20",
              isValidUrl === true &&
                "border-theme-accent/45 focus-visible:ring-theme-accent/25 pr-8",
            )}
          />
          {isValidUrl === true && (
            <CheckCircle
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-accent pointer-events-none"
              aria-hidden
            />
          )}
        </div>

        {isValidUrl === false && (
          <Alert variant="destructive" className="py-2 bg-destructive/5 border-destructive/30">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {tradeLinkMessages.invalidFormatDesc}
            </AlertDescription>
          </Alert>
        )}

        {isValidUrl === true && (
          <p
            className={cn(
              "flex items-center gap-1 text-muted-foreground/75",
              formEmbedded ? "text-[10px]" : "text-xs",
            )}
          >
            <CheckCircle className="w-3 h-3 text-theme-accent shrink-0" />
            {tradeLinkMessages.validFormat}
          </p>
        )}

        {extractedSteamId && isValidUrl && (
          <p
            className={cn(
              "text-muted-foreground/70 leading-snug",
              formEmbedded ? "text-[10px]" : "text-xs",
            )}
          >
            {sellTradeLink.inventoryFromTradeLink}{" "}
            <span className="font-mono text-muted-foreground/90">{extractedSteamId}</span>
            {" · "}
            {tradeLinkMessages.extractedSteamIdDesc}
          </p>
        )}
      </div>

      <div className={cn("px-3 flex gap-2", formEmbedded ? "py-2.5" : "py-3")}>
        <Button
          onClick={handleSave}
          disabled={loading || !isValidUrl || !tradeUrl || tradeUrl === user?.tradeLink}
          size="sm"
          className={cn("flex-1", formEmbedded && "h-8 text-xs")}
        >
          {loading && <RefreshCw className="w-3 h-3 animate-spin mr-2" />}
          <span>{loading ? tradeLinkMessages.saving : tradeLinkMessages.save}</span>
        </Button>

        {tradeUrl && !user?.tradeLink && (
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={loading}
            size="sm"
            className={cn(
              "border-[rgba(159,196,255,0.22)] bg-white/[0.03] hover:bg-white/[0.06]",
              formEmbedded && "h-8 text-xs",
            )}
          >
            {tradeLinkMessages.clear}
          </Button>
        )}
      </div>
    </div>
  );

  const modifyButtonChevron = (
    <ChevronDown
      className={cn(
        "w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
        isExpanded && "rotate-180",
      )}
      aria-hidden
    />
  );

  const embeddedView = embedded ? (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link className="w-3.5 h-3.5 text-theme-accent shrink-0" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 truncate">
            {title}
          </span>
          {user?.tradeLink && isValidUrl && (
            <TradeLinkValidBadge label={tradeLinkMessages.validBadge} />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleExpanded}
          className={cn(EMBEDDED_MODIFY_BUTTON_CLASS, "gap-1")}
        >
          {isExpanded ? tradeLinkMessages.hide : modifyLabel}
          {modifyButtonChevron}
        </Button>
      </div>

      <div
        className={cn(
          EXPAND_ANIMATION,
          !isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden min-h-0 space-y-1">
          <p className="text-[10px] text-muted-foreground/70 leading-snug line-clamp-2">
            {sellTradeLink.description}
          </p>
          {user?.tradeLink && (
            <p
              className="text-[10px] text-muted-foreground/55 font-mono truncate"
              title={user.tradeLink}
            >
              {truncateTradeUrl(user.tradeLink)}
            </p>
          )}
        </div>
      </div>

      <div
        className={cn(
          EXPAND_ANIMATION,
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden min-h-0 pt-1">{renderExpandedForm(true)}</div>
      </div>
    </div>
  ) : null;

  const collapsedCompactView =
    !embedded && compact && !isExpanded ? (
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link className="w-4 h-4 text-theme-accent shrink-0" />
          <h3 className="font-semibold text-sm truncate">{title}</h3>
          {user?.tradeLink && isValidUrl && (
            <TradeLinkValidBadge label={tradeLinkMessages.validBadge} />
          )}
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {modifyLabel}
        </Button>

        <p className="text-[11px] text-muted-foreground leading-snug">{sellTradeLink.description}</p>

        {user?.tradeLink && (
          <p
            className="text-[10px] text-muted-foreground/70 font-mono truncate"
            title={user.tradeLink}
          >
            {truncateTradeUrl(user.tradeLink)}
          </p>
        )}
      </div>
    ) : null;

  const headerView =
    !embedded && !(compact && !isExpanded) ? (
      <>
        <div
          className={`flex ${compact ? "flex-col" : "flex-col sm:flex-row sm:items-start"} justify-between gap-2 mb-2`}
        >
          <div className={`flex items-start min-w-0 ${compact ? "gap-1.5" : "gap-2.5"}`}>
            <div className={`rounded-lg bg-theme-accent/15 shrink-0 ${compact ? "p-1" : "p-2"}`}>
              <Link className="w-5 h-5 text-theme-accent" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-base">{title}</h3>
              </div>
              {!compact && (
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  {sellTradeLink.description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleExpanded}
            className={`shrink-0 flex items-center gap-1 w-full ${compact ? "h-8" : "sm:w-auto"}`}
          >
            {isExpanded ? tradeLinkMessages.hide : modifyLabel}
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                isExpanded && "rotate-180",
              )}
            />
          </Button>
        </div>

        {!isExpanded && !compact && user?.tradeLink && (
          <div className="mt-3 px-3 py-2 space-y-1 rounded-md border border-[rgba(159,196,255,0.14)] bg-white/[0.03]">
            <p className="text-xs font-medium text-muted-foreground">
              {tradeLinkMessages.currentTradeLink}
            </p>
            <p className="text-xs font-mono truncate text-foreground/80" title={user.tradeLink}>
              {user.tradeLink}
            </p>
            {extractedSteamId && (
              <p className="text-xs text-muted-foreground">
                {sellTradeLink.inventoryFromTradeLink}{" "}
                <code className="font-mono text-muted-foreground/90">{extractedSteamId}</code>
              </p>
            )}
          </div>
        )}
      </>
    ) : null;

  const expandedContent = !embedded && isExpanded ? (
    <div className={`${compact ? "space-y-3 mt-3" : "space-y-4 mt-4"}`}>{renderExpandedForm()}</div>
  ) : null;

  const body = (
    <>
      {embeddedView}
      {collapsedCompactView}
      {headerView}
      {expandedContent}
    </>
  );

  if (embedded) {
    return body;
  }

  return (
    <Card className="border-theme-accent/40 bg-theme-accent/5 shadow-sm">
      <CardContent className={compact ? "p-3" : "p-4 sm:p-5"}>{body}</CardContent>
    </Card>
  );
}
