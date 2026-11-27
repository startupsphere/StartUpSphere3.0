import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, History, MessageSquare, ArrowRight } from "lucide-react";

/**
 * Parses raw audit log text into individual chronological stage updates and notes.
 */
export function parseStageHistory(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const text = rawText.trim();

  // Match timestamp headers like [Nov 26, 2026 01:58] or [2026-11-26 01:58]
  const regex = /\[([A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}(?::\d{2})?|\d{4}-\d{2}-\d{2}[^\]]*)\]/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({ index: match.index, dateStr: match[1] });
  }

  const items = [];

  // Case 1: No bracketed timestamps found (simple note or legacy message)
  if (matches.length === 0) {
    // If multiple paragraphs or lines, treat each as a bullet
    const paragraphs = text
      .split(/\n{2,}|\n(?=[•\-\*])/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (paragraphs.length > 1) {
      return paragraphs.map((p, idx) => ({
        id: `note-${idx}`,
        title: p.replace(/^[•\-\*]\s*/, ""),
        date: null,
        note: null,
        type: "note",
      }));
    }

    return [
      {
        id: "note-0",
        title: text.replace(/^"|"$/g, ""),
        date: null,
        note: null,
        type: "note",
      },
    ];
  }

  // Case 2: Preamble text before the first timestamp
  if (matches[0].index > 0) {
    const preamble = text.slice(0, matches[0].index).trim();
    if (preamble && preamble.length > 3) {
      // Clean up leading/trailing quotes and redundant tags
      const cleanPreamble = preamble.replace(/^"|"$/g, "").trim();
      items.push({
        id: "preamble",
        title: "Initial Proposal / Inbound Inquiry",
        date: null,
        note: cleanPreamble,
        type: "initial",
      });
    }
  }

  // Case 3: Timestamped stage updates
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const segment = text.slice(start, end).trim();
    const timestamp = matches[i].dateStr;

    // Remove the bracketed timestamp from the beginning of segment
    const withoutDate = segment.replace(/^\[[^\]]+\]\s*/, "").trim();

    // Split out any appended "Note:" or "Notes:"
    const noteParts = withoutDate.split(/\nNote:\s*|\nNotes:\s*/i);
    const actionPart = noteParts[0].trim();
    let attachedNote = noteParts.length > 1 ? noteParts.slice(1).join("\nNote: ").trim() : null;

    // Discard attachedNote if it merely duplicates the preamble or contains duplicated logs
    if (attachedNote && attachedNote.includes("[") && attachedNote.includes("moved stage from")) {
      attachedNote = null;
    }

    // Format action arrow: replace '->' with unicode arrow '➔'
    const formattedAction = actionPart.replace(/->/g, "➔");

    const dedupeKey = `${timestamp}::${formattedAction}`;
    if (!items.some((it) => `${it.date}::${it.title}` === dedupeKey)) {
      items.push({
        id: `update-${i}`,
        title: formattedAction,
        date: timestamp,
        note: attachedNote,
        type: "stage_update",
      });
    }
  }

  return items;
}

/**
 * Clean stage badge helper
 */
function formatActionText(title, theme = "blue") {
  if (!title) return null;
  // If text contains "moved stage from X ➔ Y"
  if (title.includes("moved stage from")) {
    const parts = title.split("moved stage from");
    const actor = parts[0].trim();
    const stages = parts[1] ? parts[1].split("➔") : [];
    const fromStage = stages[0] ? stages[0].trim().replace(/_/g, " ") : "";
    const toStage = stages[1] ? stages[1].trim().replace(/_/g, " ") : "";

    const arrowColor =
      theme === "blue" ? "text-blue-600" : theme === "emerald" ? "text-emerald-600" : "text-amber-600";
    const badgeColor =
      theme === "blue"
        ? "text-blue-900 bg-blue-100/80"
        : theme === "emerald"
        ? "text-emerald-900 bg-emerald-100/80"
        : "text-amber-900 bg-amber-100/80";

    return (
      <span>
        <strong className="text-gray-900 font-semibold">{actor}</strong> moved stage:{" "}
        <span className="font-semibold text-gray-600 line-through text-[10px]">{fromStage}</span>{" "}
        <ArrowRight className={`inline w-3 h-3 mx-0.5 ${arrowColor}`} />{" "}
        <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${badgeColor}`}>
          {toStage}
        </span>
      </span>
    );
  }
  return <span className="text-gray-800">{title}</span>;
}

export default function StageHistoryBullets({
  rawNotes,
  defaultExpanded = false,
  theme = "blue",
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const bullets = useMemo(() => {
    return parseStageHistory(rawNotes);
  }, [rawNotes]);

  if (!rawNotes || !rawNotes.trim() || bullets.length === 0) {
    return null;
  }

  const hasMultiple = bullets.length > 1;
  const isSingleLong = bullets.length === 1 && (bullets[0].title?.length > 100 || bullets[0].note);
  const canExpand = hasMultiple || isSingleLong;

  // In collapsed mode, display the most recent stage update (or last bullet)
  const displayedBullets = isExpanded ? bullets : hasMultiple ? [bullets[bullets.length - 1]] : bullets;

  const themeClasses =
    theme === "blue" || (!theme && true)
      ? {
          boxBg: "bg-blue-50/50 border-blue-100/90",
          headerText: "text-blue-950",
          iconColor: "text-blue-600",
          buttonBg: "bg-blue-100/80 hover:bg-blue-200 text-blue-900",
          bulletDot: "bg-blue-600",
          dateTag: "bg-blue-100/70 text-blue-800 border-blue-200/60",
          noteBorder: "border-blue-300 text-blue-900",
        }
      : theme === "emerald"
      ? {
          boxBg: "bg-emerald-50/50 border-emerald-100/90",
          headerText: "text-emerald-950",
          iconColor: "text-emerald-600",
          buttonBg: "bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900",
          bulletDot: "bg-emerald-600",
          dateTag: "bg-emerald-100/70 text-emerald-800 border-emerald-200/60",
          noteBorder: "border-emerald-300 text-emerald-900",
        }
      : {
          boxBg: "bg-amber-50/40 border-amber-100/90",
          headerText: "text-amber-950",
          iconColor: "text-amber-600",
          buttonBg: "bg-amber-100/80 hover:bg-amber-200 text-amber-900",
          bulletDot: "bg-amber-600",
          dateTag: "bg-amber-100/70 text-amber-800 border-amber-200/60",
          noteBorder: "border-amber-300 text-amber-900",
        };

  return (
    <div className={`mt-2.5 p-2.5 rounded-xl border text-[11px] transition-all duration-200 ${themeClasses.boxBg}`}>
      {/* Header bar with Expand / Collapse Icon */}
      <div className="flex items-center justify-between gap-1.5 pb-1.5 mb-1.5 border-b border-gray-200/60">
        <div className="flex items-center gap-1.5">
          <History className={`w-3.5 h-3.5 ${themeClasses.iconColor} shrink-0`} />
          <span className={`font-bold tracking-tight ${themeClasses.headerText}`}>
            Stage Updates & History ({bullets.length})
          </span>
        </div>

        {canExpand && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs ${themeClasses.buttonBg}`}
            title={isExpanded ? "Collapse updates" : "Expand all updates in bullet form"}
          >
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            )}
          </button>
        )}
      </div>

      {/* Bulleted List of Updates */}
      <ul className="space-y-2">
        {displayedBullets.map((item, idx) => (
          <li key={item.id || idx} className="flex items-start gap-2">
            {/* Bullet Icon */}
            <span
              className={`w-1.5 h-1.5 rounded-full ${themeClasses.bulletDot} shrink-0 mt-1.5 ring-2 ring-white shadow-2xs`}
            />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-1.5">
                {item.date && (
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[9.5px] font-bold border tracking-tight shrink-0 ${themeClasses.dateTag}`}
                  >
                    {item.date}
                  </span>
                )}
                <div className="text-[11px] text-gray-800 leading-snug">
                  {formatActionText(item.title, theme)}
                </div>
              </div>

              {/* Attached specific note (if present) */}
              {item.note && (
                <div
                  className={`mt-1 pl-2 border-l-2 text-[10.5px] text-gray-600 bg-white/70 p-1.5 rounded-r-md ${themeClasses.noteBorder}`}
                >
                  <div className="flex items-start gap-1">
                    <MessageSquare className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                    <span className="italic break-words">{item.note}</span>
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Collapsed view indicator if multiple updates exist and is collapsed */}
      {!isExpanded && hasMultiple && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(true);
          }}
          className={`mt-2 pt-1 border-t border-gray-200/50 flex items-center justify-between text-[10px] text-gray-500 hover:${themeClasses.headerText} cursor-pointer font-medium`}
        >
          <span>
            + {bullets.length - 1} earlier stage update{bullets.length - 1 > 1 ? "s" : ""}
          </span>
          <span className="underline font-bold flex items-center gap-0.5">
            View full history
            <ChevronDown className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  );
}
