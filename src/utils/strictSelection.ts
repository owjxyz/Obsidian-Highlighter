import { splitSourceBlocks, type BlockKind } from "./sourceBlocks";
import type { SelectionHint } from "./blockOccurrence";

/** A whitespace-normalized, visible string with UTF-16 source boundaries. */
function projectInline(raw: string, offset: number, kind: BlockKind) {
    const starts: number[] = [];
    const ends: number[] = [];
    let text = "";
    // ponytail: pair prose delimiters; use renderer token offsets for complex Markdown nesting.
    // Leave unmatched delimiters visible, just as Reading View does.
    const decorations = new Set<number>();
    const collectDecorations = (from: number, to: number): void => {
        const pairs =
            /\\[\s\S]|(?:\$\$[\s\S]*?\$\$|\$(?!\s)(?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s\\$])\$(?!\d))|(`+)[\s\S]*?\1|(\*{1,3}|_{1,3}|~~)([\s\S]*?)\2/g;
        for (const match of raw.slice(from, to).matchAll(pairs)) {
            if (!match[2]) continue;
            const start = from + match.index;
            const width = match[2].length;
            const end = start + match[0].length - width;
            for (let i = 0; i < width; i++) {
                decorations.add(start + i);
                decorations.add(end + i);
            }
            collectDecorations(start + width, end);
        }
    };
    collectDecorations(0, raw.length);
    const tokens =
        /(^[ \t]*(?:>[ \t]*)*(?:#{1,6}\s+|[-*+]\s+(?:\[[ xX]\]\s*)?|\d+[.)]\s+|\[\^[^\]]+\]:\s*)|^[ \t]*(?:>[ \t]*)+)|(`+)([\s\S]*?)\2|(?:\$\$[\s\S]*?\$\$|\$(?!\s)(?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s\\$])\$(?!\d))|(?:\*{1,3}|_{1,3}|~~)|(?:\\[\\`*{}[\]()#+\-.!_|>~=$])|(?:&(?:#\d+|#x[\da-f]+|[a-z]+);)|[\s\S]/gim;
    for (const match of raw.matchAll(tokens)) {
        const token = match[0];
        const intraword =
            /^_+$/.test(token) &&
            /[\p{L}\p{N}]/u.test(raw[match.index - 1] ?? "") &&
            /[\p{L}\p{N}]/u.test(raw[match.index + token.length] ?? "");
        if (match[1] !== undefined || (token.startsWith("$") && token.length > 1 && token.endsWith("$"))) continue;
        // Code is literal: preserve its contents and per-character offsets.
        const code = match[2] !== undefined;
        const decoration = /^[*_~]+$/.test(token);
        let value = code ? match[3] : token;
        if (token.startsWith("\\") && token.length === 2) value = token[1];
        else if (token.startsWith("&") && token.endsWith(";")) {
            value = new DOMParser().parseFromString(token, "text/html").body.textContent ?? token;
        }
        let valueIndex = 0;
        for (const char of value) {
            const localStart = match.index + (code ? match[2].length + valueIndex : decoration ? valueIndex : 0);
            const sourceStart = offset + localStart;
            const sourceEnd = code || decoration ? sourceStart + char.length : offset + match.index + token.length;
            valueIndex += char.length;
            if (decoration && !intraword && decorations.has(localStart)) continue;
            // Table parsing consumes escaped pipes even inside code spans.
            if (code && kind === "table" && char === "\\" && value[valueIndex] === "|") continue;
            const normalized = /\s/.test(char) ? " " : char;
            if (normalized === " " && (!text || text.endsWith(" "))) {
                if (text) ends[ends.length - 1] = sourceEnd;
                continue;
            }
            text += normalized;
            for (let i = 0; i < normalized.length; i++) {
                starts.push(sourceStart);
                ends.push(sourceEnd);
            }
        }
    }
    if (text.endsWith(" ")) {
        text = text.slice(0, -1);
        starts.pop();
        ends.pop();
    }
    return { text, starts, ends };
}

/** Require the selected text AND its rendered neighbours; never guess by distance. */
export function locateAnchoredSelection(raw: string, hint: SelectionHint, occurrence: number, kind: BlockKind | null) {
    if (!hint.selected || hint.blockText === undefined) return null;
    const blocks = splitSourceBlocks(raw).filter(
        (block) =>
            block.kind !== "code" &&
            (!kind || block.kind === kind || (block.kind === "footnote" && kind === "paragraph"))
    );
    const matching = blocks
        .map((block) => projectInline(raw.slice(block.start, block.end), block.start, block.kind))
        .filter((block) => block.text === hint.blockText);
    if (hint.blockTotal !== undefined && matching.length !== hint.blockTotal) return null;
    const block = matching[occurrence];
    if (!block) return null;
    const candidates: number[] = [];
    let from = 0;
    while (from <= block.text.length) {
        const at = block.text.indexOf(hint.selected, from);
        if (at === -1) break;
        if (
            block.text
                .slice(0, at)
                .trimEnd()
                .endsWith(hint.before ?? "") &&
            block.text
                .slice(at + hint.selected.length)
                .trimStart()
                .startsWith(hint.after ?? "")
        )
            candidates.push(at);
        from = at + hint.selected.length;
    }
    if (candidates.length !== 1) return null;
    const at = candidates[0];
    return { start: block.starts[at], end: block.ends[at + hint.selected.length - 1] };
}
