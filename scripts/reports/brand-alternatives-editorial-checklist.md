# Brand Alternatives Editorial Checklist

Use this after running:

- `bun run alternatives:import:brands`
- `bun run alternatives:validate:brands`

## Review Order

1. Phase 1: top 10 fashion targets
2. Phase 2: remaining fashion targets
3. Phase 3: beverage and food targets
4. Phase 4: personal-care and household targets

## Per-Target QA (Admin)

- Open `/admin/companies/[id]`
- Confirm `alternativeRole` is `Target` or `Both`
- Confirm `status` is `draft` before edits
- Fill or refine:
  - logo URL
  - website
  - tagline
  - description
  - alternatives summary
- Check ranked alternatives in `Alternatives (ordered)`
- Publish only after content quality is acceptable

## Per-Target QA (Web)

- Confirm target appears on `/alternatives`
- Confirm `/alternatives/[slug]` renders
- Confirm alternatives list order is correct
- Confirm links to `/companies/[slug]` are valid

## Report Files

- Import report: `scripts/reports/brand-alternatives-import-report.json`
- Validation report: `scripts/reports/brand-alternatives-validation-report.json`
