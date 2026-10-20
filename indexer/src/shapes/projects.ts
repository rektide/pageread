/**
 * The projects index: ChatGPT projects as groups of conversations, from
 * pageread.project.id attributes on trace resources.
 */
import { SEMCONV } from "@pageread/schema";
import { TextIndex } from "../text-index.ts";
import type { IndexerConfig } from "../types.ts";
import { lastActivityMs, parseTraces, resourceAttrs } from "./shared.ts";
import type { TranscriptSummary } from "./transcripts.ts";

export interface ProjectSummary {
  projectId: string;
  conversations: TranscriptSummary[];
  updatedAt?: number;
}

export interface ProjectsSnapshot {
  projects: ProjectSummary[];
}

export function projectsIndex(): IndexerConfig<ProjectsSnapshot> {
  return {
    name: "projects",
    filter: { mimeType: "application/vnd.pageread.trace+json" },
    build(entries) {
      const projects = new Map<string, Map<string, TranscriptSummary>>();
      for (const { entry, trace } of parseTraces(entries)) {
        const attrs = resourceAttrs(trace);
        const projectId = attrs[SEMCONV.pageread.projectId];
        if (typeof projectId !== "string" || projectId === "") continue;
        let convs = projects.get(projectId);
        if (!convs) {
          convs = new Map();
          projects.set(projectId, convs);
        }
        const conversationId = String(attrs[SEMCONV.pageread.conversationId] ?? entry.uri);
        const models = new Set<string>();
        let messageCount = 0;
        for (const s of trace.spans ?? []) {
          const model = s.attributes?.[SEMCONV.genAi.requestModel];
          if (typeof model === "string") models.add(model);
          if (s.attributes?.[SEMCONV.pageread.messageId] !== undefined) messageCount++;
        }
        const summary: TranscriptSummary = {
          conversationId,
          traceUri: entry.uri,
          title: String(
            attrs[SEMCONV.pageread.title] ?? attrs[SEMCONV.pageread.conversationId] ?? entry.uri,
          ),
          updatedAt: lastActivityMs(trace),
          models: [...models].sort(),
          messageCount,
        };
        convs.set(conversationId, summary);
      }
      const out: ProjectSummary[] = [...projects.entries()].map(([projectId, convs]) => ({
        projectId,
        conversations: [...convs.values()].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
        updatedAt: Math.max(...[...convs.values()].map((c) => c.updatedAt ?? 0)),
      }));
      return { projects: out.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)) };
    },
    makeFinder(_entries, snapshot) {
      const index = new TextIndex();
      for (const project of snapshot.projects) {
        for (const conv of project.conversations) {
          index.addField(conv.traceUri, "title", conv.title);
        }
      }
      return (query) => index.find(query);
    },
  };
}
