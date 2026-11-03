## What this changes

<!-- one or two sentences, plain language -->

## Why

<!-- the student problem or the bug it fixes -->

## Data changes

- [ ] This PR adds or edits public catalogue records
- [ ] Every new or changed public fact has an official source URL in the record
- [ ] Verification status is set honestly (not everything is VERIFIED on the day it is added)
- [ ] No institution, programme, scholarship, deadline or visa rule was invented to fill a gap

If you ticked the first box, list the sources:

| Record | Field | Source | Checked |
| --- | --- | --- | --- |
|  |  |  |  |

## Checks

- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm --filter @openedu/web build`
- [ ] `pnpm db:seed` run twice with no duplicates (if schema or seed changed)
- [ ] New private records are ownership-checked on the server
- [ ] Empty states still make sense with zero records

## Screenshots

<!-- for UI changes, before and after; redact any real student data -->
