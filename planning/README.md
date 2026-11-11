# Creator studio planning

Working draft · 11 November 2026 · branch `director-agents-phases`

## Start here

We are designing and testing the experience before implementing the full system. The product is a conversation-led video workspace: explain what you want to make, reuse your channel/series context, develop a production draft with specialists, and create an editable video in Classic.

The creator can perform an operation manually or ask the Director to perform the same operation. A quick conversation is the entry point; the internal production stages are not a mandatory setup wizard.

| Document | Question it answers |
| --- | --- |
| [01 · Product and creator workflow](01-product-and-workflow.md) | What are we making, and how does a creator use it? |
| [02 · Workspace and prototype](02-workspace-and-prototype.md) | What should we see and try in the HTML before implementation? |
| [03 · Director and specialists](03-director-and-specialists.md) | What do the agents do, and what do ordinary functions do? |
| [04 · Series, scenes and assets](04-series-scenes-and-assets.md) | How do story, narration, illustrations, timing and saved context stay connected? |
| [05 · Tools and connectors](05-tools-and-connectors.md) | What can we reuse locally, and what integrations are missing? |
| [06 · External repository review](06-repository-review.md) | What can the three suggested projects contribute? |
| [07 · Milestones and decisions](07-milestones-and-decisions.md) | What do we design/test next, and what remains unresolved? |
| [08 · Earlier implementation checklist](08-implementation-plan.md) | Which domain tasks can be retained after the runtime redesign? |
| [09 · Agent foundation](09-agent-foundation.md) | How does the conversational agent execute, delegate and use code tools? |

**Suggested reading:** 09 → 02 → 07. Document 09 owns the current runtime direction and overrides conflicting runtime assumptions in 08. The other documents provide implementation and research detail when needed.

## Status language

- **Requirement:** expressed by the creator in this conversation. It describes intended behavior, not completion.
- **Proposal:** a recommended design or implementation choice, still open to change.
- **Code inspected:** relevant implementation exists; it was read, not exercised end to end in this planning task.
- **Repository documentation:** an upstream author describes a capability; this is not our runtime verification.
- **Needs experiment:** an assumption that requires a focused trial before reliance.

No roadmap milestone is marked implemented merely because its constituent modules exist.

## Relationship to older plans

The [root README](../README.md), [Director plan](../apps/classic/DIRECTOR-PLAN.md), and [research plan](../apps/classic/AI-EDITOR-RESEARCH-PLAN.md) remain useful background. This folder is the current conversation-derived product proposal. It refines the experience; it does not silently approve every recommendation in those older documents.

Some older status tables are historical: Classic and several generator modules now exist on this branch, despite earlier statements that no editor is present. Use owning source and runtime evidence for implementation status. The earlier research plan records Vercel AI SDK and HyperFrames as directions; this review does not install or revalidate their current APIs.

The local `design-prototype/` folder is an interactive design experiment. Its latest happy path demonstrates conversation, simulated tool activity and the edit workflow; it is not a working agent or the final product specification. Document 09 describes the current intended experience and runtime. The folder is currently untracked and its ignore entry is commented out; this iteration does not change that Git choice.

## How we update the plan

1. Record a new idea in the owning document and mark its status.
2. If it changes the creator experience, try it with mock data in HTML.
3. Resolve the small set of relevant decisions in document 07.
4. Run the smallest feasibility experiment before committing to an integration.
5. Record the result and update only the affected milestone.

Keep detailed facts in one owning document and link to it elsewhere. No commits, dependency installs, provider calls, generation jobs, or implementation changes are part of this planning task.
