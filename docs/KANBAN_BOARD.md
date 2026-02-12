# Kanban Board — PRs #20–#27

> **User Story: US20** – Student Course Grade on Course Card
> *As a student, I want to see my total grade on each course card so that I know how I am performing.*

---

## Backlog

| Task | PR | Assignee | Notes |
|------|----|----------|-------|
| *(empty)* | — | — | All tasks for US20 have been completed |

---

## In Progress

| Task | PR | Assignee | Notes |
|------|----|----------|-------|
| *(empty)* | — | — | No tasks currently in progress |

---

## In Review

| Task | PR | Assignee | Notes |
|------|----|----------|-------|
| *(empty)* | — | — | No tasks currently in review |

---

## Done

| Task | PR | Assignee | Branch | Key Files Changed |
|------|-----|----------|--------|-------------------|
| Add grade schemas and aggregation service | [#20](../../pull/20) | **Simon Velez** | `feature/us20-student-grades-dev2` | Grade schemas, aggregation service |
| Add student grades endpoint tests for US20 | [#21](../../pull/21) | **Ayman (aymanBH04)** | `feature-us20` | Student grades endpoint tests |
| Add student grades REST endpoint (`GET /student/grades`) | [#22](../../pull/22) | **Shondiiee (mkpoojitha)** | `feature/student-grades-endpoint` | `student_controller.py` — returns per-course aggregated peer review scores |
| Update endpoint docs and user stories | [#23](../../pull/23) | **mkpoojitha-dotcom** | `Testing/Review` | `ENDPOINT_SUMMARY.md`, `user_stories.md` |
| *(PR #24 does not exist)* | — | — | — | — |
| Add GradeBadge frontend component | [#25](../../pull/25) | **Daniel Cuevas** | `ahmed-feat` | `GradeBadge` component with color-coded grades |
| Integrate GradeBadge into student dashboard | [#26](../../pull/26) | **Daniel Cuevas** | `daniel-feat` | Dashboard integration, removed `api_addition.ts` |
| *(PR #27 does not exist)* | — | — | — | — |

---

## Summary by Team Member

| Team Member | PRs | Contribution |
|-------------|-----|--------------|
| **Simon Velez** | #20 | Backend — grade schemas and aggregation service |
| **Ayman (aymanBH04)** | #21 | Testing — student grades endpoint tests |
| **Shondiiee / mkpoojitha** | #22, #23 | Backend endpoint (`GET /student/grades`) + documentation updates |
| **Daniel Cuevas** | #25, #26 | Frontend — `GradeBadge` component + dashboard integration |

---

## Visual Kanban

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────────────┐
│   BACKLOG   │  │ IN PROGRESS │  │  IN REVIEW  │  │              DONE                │
│             │  │             │  │             │  │                                  │
│  (empty)    │  │  (empty)    │  │  (empty)    │  │  #20 Grade schemas (Simon)       │
│             │  │             │  │             │  │  #21 Endpoint tests (Ayman)       │
│             │  │             │  │             │  │  #22 GET /student/grades (Shondii)│
│             │  │             │  │             │  │  #23 Docs update (mkpoojitha)     │
│             │  │             │  │             │  │  #25 GradeBadge component (Daniel)│
│             │  │             │  │             │  │  #26 Dashboard integration (Daniel)│
└─────────────┘  └─────────────┘  └─────────────┘  └──────────────────────────────────┘
```
