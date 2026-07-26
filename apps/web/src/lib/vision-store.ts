"use client";

/**
 * Local-only store for the vision-to-action thread.
 *
 *   Vision  →  Milestone  →  Action  →  Priority (Top 3)
 *
 * All state lives in localStorage. When a Priority is completed we look up
 * its link back to the source Action and fire a custom completion flash
 * that references the vision by name ("This moved you toward X").
 *
 * Not cloud-synced by design — matches how the vision boards themselves
 * currently work in the app.
 */

import { useCallback } from "react";
import { useLocalStorage } from "./use-local-storage";

export type Milestone = {
  id: string;
  visionId: string;
  title: string;
  createdAt: string; // ISO
};

export type VisionAction = {
  id: string;
  milestoneId: string;
  visionId: string; // denormalized so we can look up the vision title quickly
  title: string;
  done: boolean;
  createdAt: string; // ISO
};

/**
 * When an action is pushed to Top 3, we store this link so completing the
 * priority can walk back to the source action + vision.
 * Keyed by priorityId → {actionId, visionTitle}.
 */
export type PriorityLink = {
  priorityId: string;
  actionId: string;
  visionId: string;
  visionTitle: string;
};

const MILESTONES_KEY = "thrive:vision:milestones";
const ACTIONS_KEY = "thrive:vision:actions";
const LINKS_KEY = "thrive:vision:priority-links";

/**
 * Slugify a vision title into a stable id.
 * "The Founder Era" → "the-founder-era"
 */
export function visionIdFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function useVisionStore() {
  const [milestones, setMilestones] = useLocalStorage<Milestone[]>(MILESTONES_KEY, []);
  const [actions, setActions] = useLocalStorage<VisionAction[]>(ACTIONS_KEY, []);
  const [links, setLinks] = useLocalStorage<PriorityLink[]>(LINKS_KEY, []);

  const addMilestone = useCallback(
    (visionId: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return null;
      const m: Milestone = {
        id: crypto.randomUUID(),
        visionId,
        title: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMilestones((prev) => [...prev, m]);
      return m;
    },
    [setMilestones],
  );

  const removeMilestone = useCallback(
    (id: string) => {
      setMilestones((prev) => prev.filter((m) => m.id !== id));
      // Cascade: remove actions belonging to this milestone
      setActions((prev) => prev.filter((a) => a.milestoneId !== id));
    },
    [setMilestones, setActions],
  );

  const addAction = useCallback(
    (milestoneId: string, visionId: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return null;
      const a: VisionAction = {
        id: crypto.randomUUID(),
        milestoneId,
        visionId,
        title: trimmed,
        done: false,
        createdAt: new Date().toISOString(),
      };
      setActions((prev) => [...prev, a]);
      return a;
    },
    [setActions],
  );

  const removeAction = useCallback(
    (id: string) => {
      setActions((prev) => prev.filter((a) => a.id !== id));
      // Also drop any priority link pointing at this action
      setLinks((prev) => prev.filter((l) => l.actionId !== id));
    },
    [setActions, setLinks],
  );

  const setActionDone = useCallback(
    (id: string, done: boolean) => {
      setActions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, done } : a)),
      );
    },
    [setActions],
  );

  /**
   * Record that a priority row came from a vision action.
   * Caller is responsible for actually creating the priority itself
   * (via the existing priority-list flow); this only stores the link.
   */
  const linkPriorityToAction = useCallback(
    (priorityId: string, actionId: string, visionId: string, visionTitle: string) => {
      setLinks((prev) => {
        // Replace any existing link for this priority (shouldn't happen, but safe)
        const filtered = prev.filter((l) => l.priorityId !== priorityId);
        return [...filtered, { priorityId, actionId, visionId, visionTitle }];
      });
    },
    [setLinks],
  );

  const getLinkForPriority = useCallback(
    (priorityId: string): PriorityLink | null => {
      return links.find((l) => l.priorityId === priorityId) ?? null;
    },
    [links],
  );

  const milestonesForVision = useCallback(
    (visionId: string) => milestones.filter((m) => m.visionId === visionId),
    [milestones],
  );

  const actionsForMilestone = useCallback(
    (milestoneId: string) => actions.filter((a) => a.milestoneId === milestoneId),
    [actions],
  );

  return {
    milestones,
    actions,
    links,
    addMilestone,
    removeMilestone,
    addAction,
    removeAction,
    setActionDone,
    linkPriorityToAction,
    getLinkForPriority,
    milestonesForVision,
    actionsForMilestone,
  };
}
