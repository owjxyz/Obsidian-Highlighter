import { describe, it, expect, vi } from "vitest";
import { setup } from "./WritePath.test.js";
import { FloatingManager } from "../src/ui/FloatingManager";
import { Platform } from "./obsidian-stub.js";
import { renderHtml } from "./dom-helpers.js";

const raw = "Same footnote text.[^first][^second]\n\n[^first]: Same footnote text.\n\n[^second]: Same footnote text.";

async function popoverSetup(source = raw, html = "<p>Same footnote text.</p>") {
    const ctx = await setup(source, '<p>Same footnote text.<sup class="footnote-ref">1</sup></p>');
    const hoverEl = ctx.doc.body.createDiv({ cls: "popover hover-popover" });
    const containerEl = hoverEl.createDiv({ cls: "markdown-embed" });
    renderHtml(containerEl, html);
    const embed = { file: ctx.view.file, subpath: "#[^second]", containerEl, getMode: () => "preview" };
    ctx.view.previewMode = { hoverPopover: { hoverEl, embed } };
    ctx.plugin.app.metadataCache.getFileCache = () => ({
        embeds: [],
        footnotes: [
            {
                id: "second",
                position: {
                    start: { offset: ctx.out().indexOf("[^second]:") },
                    end: { offset: ctx.out().length },
                },
            },
        ],
    });
    ctx.plugin.handleSelectionFailure = vi.fn();
    ctx.plugin.floatingManager = new FloatingManager(ctx.plugin);
    ctx.plugin.floatingManager.load();
    const select = (selector = "p", word = "footnote") => {
        const element = containerEl.querySelector(selector);
        const node = element.firstChild;
        const start = node.nodeValue.indexOf(word);
        const range = ctx.doc.createRange();
        range.setStart(node, start);
        range.setEnd(node, start + word.length);
        const selection = ctx.window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        ctx.plugin.floatingManager.handleSelection();
        return { text: word, range };
    };
    return { ...ctx, hoverEl, containerEl, embed, select };
}

describe("footnote hover selection", () => {
    it("shows the toolbar and highlights only the hovered footnote through its button", async () => {
        const ctx = await popoverSetup();
        ctx.select();
        const manager = ctx.plugin.floatingManager;
        expect(manager.containerEl.style.display).toBe("flex");
        manager.highlightBtn.dispatchEvent(new ctx.window.MouseEvent("mousedown", { bubbles: true }));
        await vi.waitFor(() =>
            expect(ctx.out()).toBe(raw.replace("[^second]: Same footnote", "[^second]: Same ==footnote=="))
        );
        expect(ctx.plugin.handleSelectionFailure).not.toHaveBeenCalled();
    });

    it("applies and removes a colour through the existing keyboard command", async () => {
        const ctx = await popoverSetup();
        const commands = [];
        ctx.plugin.addCommand = (command) => commands.push(command);
        ctx.plugin.registerCommands();
        const command = commands.find((entry) => entry.id === "apply-color-3");
        ctx.select();
        expect(command.checkCallback(false)).toBe(true);
        await vi.waitFor(() =>
            expect(ctx.out()).toBe(raw.replace("[^second]: Same footnote", "[^second]: Same ==🟡footnote=="))
        );
        renderHtml(ctx.containerEl, "<p>Same <mark>footnote</mark> text.</p>");
        ctx.select("mark");
        command.checkCallback(false);
        await vi.waitFor(() => expect(ctx.out()).toBe(raw));
    });

    it("supports a later paragraph in the footnote", async () => {
        const source = "Text[^second].\n\n[^second]: First paragraph.\n\n    Later footnote paragraph.";
        const ctx = await popoverSetup(source, "<p>First paragraph.</p><p>Later footnote paragraph.</p>");
        await ctx.plugin.applyColorHighlight(ctx.view, "green", ctx.select("p:last-child"));
        expect(ctx.out()).toBe(source.replace("Later footnote", "Later ==🟢footnote=="));
    });

    it("preserves references to other named footnotes inside the popup", async () => {
        const source = raw + "[^first]";
        const ctx = await popoverSetup(source, '<p>Same footnote text.<sup class="footnote-ref">1</sup></p>');
        await ctx.plugin.applyColorHighlight(ctx.view, "red", ctx.select());
        expect(ctx.out()).toBe(source.replace("[^second]: Same footnote", "[^second]: Same ==🔴footnote=="));
    });

    it.each(["other file", "ordinary preview", "editing preview", "missing cache", "stale cache"])(
        "rejects %s without changing the note",
        async (reason) => {
            const ctx = await popoverSetup();
            if (reason === "other file") ctx.embed.file = { path: "other.md" };
            if (reason === "ordinary preview") ctx.embed.subpath = "#Heading";
            if (reason === "editing preview") ctx.embed.getMode = () => "source";
            if (reason === "missing cache") ctx.plugin.app.metadataCache.getFileCache = () => ({ footnotes: [] });
            if (reason === "stale cache")
                ctx.plugin.app.metadataCache.getFileCache = () => ({
                    footnotes: [
                        {
                            id: "second",
                            position: {
                                start: { offset: raw.indexOf("[^first]:") },
                                end: { offset: raw.indexOf("[^second]:") },
                            },
                        },
                    ],
                });
            const snapshot = ctx.select();
            if (reason !== "stale cache" && reason !== "missing cache")
                expect(ctx.plugin.floatingManager.containerEl.style.display).toBe("none");
            await ctx.plugin.applyColorHighlight(ctx.view, "red", snapshot);
            expect(ctx.out()).toBe(raw);
        }
    );
});

describe("moving from a footnote to its toolbar", () => {
    it.each(["highlight", "color", "remove"])("keeps the popup alive until %s is applied", async (action) => {
        vi.useFakeTimers();
        try {
            const source =
                action === "remove" ? raw.replace("[^second]: Same footnote", "[^second]: Same ==footnote==") : raw;
            const ctx = await popoverSetup(
                source,
                action === "remove" ? "<p>Same <mark>footnote</mark> text.</p>" : "<p>Same footnote text.</p>"
            );
            // Native HoverPopover schedules dismissal when relatedTarget is outside hoverEl.
            ctx.hoverEl.addEventListener("mouseout", (event) => {
                if (!ctx.hoverEl.contains(event.relatedTarget))
                    ctx.window.setTimeout(() => {
                        ctx.hoverEl.remove();
                        ctx.view.previewMode.hoverPopover = null;
                    }, 300);
            });
            ctx.select(action === "remove" ? "mark" : "p");
            const manager = ctx.plugin.floatingManager;
            const button =
                action === "highlight"
                    ? manager.highlightBtn
                    : action === "remove"
                      ? manager.removeBtn
                      : manager.colorButtons[0];
            ctx.hoverEl.dispatchEvent(new ctx.window.MouseEvent("mouseout", { bubbles: true, relatedTarget: button }));
            button.dispatchEvent(new ctx.window.MouseEvent("mouseover", { bubbles: true, relatedTarget: ctx.hoverEl }));
            await vi.advanceTimersByTimeAsync(500);
            button.dispatchEvent(new ctx.window.MouseEvent("mousedown", { bubbles: true }));
            await vi.waitFor(() =>
                expect(ctx.out()).toBe(
                    action === "remove"
                        ? raw
                        : raw.replace(
                              "[^second]: Same footnote",
                              action === "color" ? "[^second]: Same ==🔴footnote==" : "[^second]: Same ==footnote=="
                          )
                )
            );
            expect(ctx.hoverEl.isConnected).toBe(true);
            expect(manager.containerEl.parentElement).toBe(ctx.doc.body);
            ctx.plugin.floatingManager.unload();
        } finally {
            vi.useRealTimers();
        }
    });

    it("moves the toolbar back to the note after the popup is closed", async () => {
        const ctx = await popoverSetup();
        ctx.select();
        expect(ctx.hoverEl.contains(ctx.plugin.floatingManager.containerEl)).toBe(true);
        ctx.hoverEl.remove();
        ctx.view.previewMode.hoverPopover = null;
        const node = ctx.content.querySelector("p").firstChild;
        const range = ctx.doc.createRange();
        range.setStart(node, 0);
        range.setEnd(node, 4);
        const selection = ctx.window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        ctx.plugin.floatingManager.handleSelection();
        expect(ctx.plugin.floatingManager.containerEl.parentElement).toBe(ctx.doc.body);
        expect(ctx.plugin.floatingManager.containerEl.style.display).toBe("flex");
        ctx.plugin.floatingManager.unload();
    });
});

it("keeps the toolbar content-sized without changing the footnote embed width", async () => {
    const ctx = await popoverSetup();
    let pluginStyles = "";
    if (Platform.isDesktop) {
        const { readFileSync } = await import("node:fs");
        pluginStyles = readFileSync("styles.css", "utf8");
    }
    const style = ctx.doc.createElement("style");
    style.textContent = ".popover.hover-popover > * { width: 480px; }\n" + pluginStyles;
    ctx.doc.head.appendChild(style);
    ctx.select();
    const toolbar = ctx.plugin.floatingManager.containerEl;
    expect(ctx.hoverEl.contains(toolbar)).toBe(true);
    expect(ctx.window.getComputedStyle(ctx.containerEl).width).toBe("480px");
    expect(ctx.window.getComputedStyle(toolbar).width).not.toBe("480px");
    ctx.plugin.floatingManager.unload();
});
