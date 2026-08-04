# Issue Record — FEAT-005 School Comparison Tool (Phase 3 Strategic Expansion)

**Record**: docs/issues/2026-08-04/19-phase3-FEAT-005-comparison-tool.md
**Run**: 42nd (2026-08-04), Phase 3 (Strategic Expansion / Product Mode)
**Category**: feature | **Priority**: P2
**GitHub issue**: NOT created — blocked by F002 (403 `createIssue`, 40th consecutive);
shipped as labeled docs record per established pattern (runs 1–39).

---

## User Story

As a parent evaluating multiple school options,
I want to compare up to 3 schools side-by-side,
So that I can make an informed enrollment decision without juggling multiple tabs.

---

## Acceptance Criteria

- [ ] A "Bandingkan" (Compare) action is available on each school page, adding the school to a comparison tray (max 3)
- [ ] A comparison view renders selected schools side-by-side in a table
- [ ] Compared metrics: NPSN, status (Negeri/Swasta), bentuk (SD/SMP/SMA/SMK), kecamatan, kab_kota, provinsi, coordinates
- [ ] Tray is persisted in `localStorage` so selections survive navigation between static pages
- [ ] Duplicate selection is rejected; a 4th selection is blocked with a clear message
- [ ] Users can remove a school from the comparison
- [ ] Works on mobile (horizontal scroll or stacked responsive layout)
- [ ] No external dependencies — reuses embedded `#school-data` JSON and existing data schema
- [ ] Accessible: comparison table marked up with proper headers, keyboard operable tray

---

## Value Justification

1. **Decision support**: side-by-side comparison is the natural next step after
   search/filter (FEAT-002/FEAT-004), directly serving the roadmap Phase 1 goal
   "improve user ability to find relevant schools".
2. **No new dependencies or pipeline work**: school data is already embedded in every
   page (`#school-data` JSON); the comparison is pure front-end composition of
   existing fields — low blast radius, fully static-site compatible.
3. **Engagement**: comparison flow increases pages-per-session (3-4 school pages per
   comparison), supporting roadmap engagement metrics.
4. **Deferred, not blocked**: roadmap.md:50-53 marks FEAT-005 as deferred for scope
   reasons; no technical blocker exists.

---

## Linked documentation

- Gap: docs/roadmap.md:50-53 (FEAT-005, deferred)
- Proposal: .sisyphus/phase3-feature-proposal.md (updated 2026-08-04)
- Superseded: 2026-05-30 autocomplete proposal (delivered as FEAT-002, commit 46e2b0b)

---

## Execution prerequisites

Per the scoring ledger's Phase 2 prioritization, this feature should be implemented
**after** the F037/F038 (CRITICAL) and F039–F044 security-hardening debt is applied.
Front-end only — no CI workflow changes required (unaffected by F050).
