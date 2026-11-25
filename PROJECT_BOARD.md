# DIMEAT — Project Checkpoint Board

**Snapshot:** 24 November 2026 (latest reported evidence; not a live repository audit)  
**M3 status:** Amber — at risk (20 November)  
**Checkpoint:** 26 November 2026, 14:50

## Kanban overview

| Backlog | To Do | In Progress | Review / Testing | Blocked | Done (deliverables only) |
|---|---|---|---|---|---|
| Social feed | WI-04 AI integration | WI-05 QA | WI-01 Database | Live DM acceptance | M1 report |
| BMI scope review | Architecture decision record | DM implementation validation | WI-02 Auth & profile | GitHub issue reconciliation | M2 report |
| | Publish local changes | WI-06 Documentation | WI-03 Meal logging & dashboard | | M3 report |
| | | Checkpoint preparation | Habits, preferences, friendship & privacy | | Weekly reports 01–09 |

## Baseline work items

| ID | Work item | Baseline SP | Original target | Proposed revision | Status / evidence |
|---|---|---:|---|---|---|
| WI-01 | Database | 3 | 15 Nov | 29 Nov | Review; Supabase migration code reported; acceptance pending |
| WI-02 | Auth & profile | 5 | 15 Nov | 29 Nov | Review; core Auth in reported commit `2fbd425`; full acceptance pending |
| WI-03 | Meal logging & dashboard | 5 | 15 Nov | 29 Nov | Review; code in reported commit `2fbd425`; live regression pending |
| WI-04 | AI integration | 8 | 29 Nov | TBD | To Do; no completed integration evidence |
| WI-05 | QA | 3 | Confirm baseline | 6 Dec (proposed) | In progress; local checks reported; live acceptance pending |
| WI-06 | Documentation | 2 | Confirm baseline | 15 Dec (proposed) | In progress; milestone and weekly reports available |
| | **Total baseline** | **26** | | | Accepted SP not established |

## Additional work and acceptance criteria

All owners and dates below are proposed, not confirmed commitments. Additional work is unestimated.

| Work | Proposed owner role | Target | Acceptance evidence required |
|---|---|---|---|
| Habits and preferences | Technical lead / QA | 30 Nov | Linked commit and functional tests |
| Friendship, blocking and privacy | Technical lead / QA | 30 Nov | Two authorized test accounts; positive and negative access tests |
| DM | Technical lead / QA | 4 Dec | Migration verified; messaging, access, read and deletion tests |
| Architecture change record | PM / Technical lead | 26 Nov | Team-approved rationale and schedule/scope impact |
| GitHub traceability | PM / Documentation lead | 26 Nov | Actual issue, implementation and verification links |
| AI scope decision | PM / Technical lead | 8 Dec | Feasibility, scope and revised schedule decision |

## Evidence and deviations

- Reported commit: `2fbd425` (22 November), core authentication and nutrition code. Verify the remote link before presentation.
- Reported local checks: habits 5, preferences 4, social 3, DM 3; 15 passed in total. TypeScript check passed. Lint and live acceptance remain unverified.
- Sprint 1 acceptance was not demonstrated by 15 November. Preserve the baseline and track proposed revised targets separately.
- SQLite/application JWT assumptions changed to Supabase PostgreSQL/Auth. Team rationale and approval remain to be documented.
- Local habit, preference, friendship and DM changes were reported as uncommitted on 24 November. Recheck before marking Done.

## Checkpoint walkthrough

1. Show this backlog and identify completed, ongoing, delayed and blocked work.
2. Trace WI-03 to its actual issue, implementation commit and test evidence. Issue and acceptance evidence still need verification.
3. Explain the architecture deviation and corrective action.
4. Present the proposed next two weeks: core acceptance, social access tests, DM validation, AI scope decision and reforecast.

This is a repository-based Markdown backlog, not a native GitHub Projects board. No live GitHub issues, permissions or remote state were verified in preparing this snapshot.
