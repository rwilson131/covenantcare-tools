# CovenantCare Brand & Letter Tools

Shared toolkit for generating on-brand CovenantCare letters and documents. Point any Claude session at this repo for consistent letterhead, correct location data, and brand-compliant output.

**Runtime requirement:** [bun](https://bun.sh) and Google Chrome (already on staff machines).

---

## Generate a Letter

```bash
# From frontmatter location
bun generate-letter.ts input.md

# Override location at generation time
bun generate-letter.ts --location hilldale input.md
bun generate-letter.ts --location dover --output ~/Desktop/my-letter.pdf input.md
```

### Frontmatter reference

```yaml
---
date: "June 12, 2026"           # required
from-name: "Alisha Harvey"      # appears in signature block
from-title: "President, CovenantCare Practices"
from-location: hilldale         # sango | hilldale | dover | none (default: sango)
to: |                           # addressee block — multiline OK
  Dr. Jane Smith
  Community Health Clinic
  123 Main Street
  Clarksville, TN 37040
re: "Referral — Robinson O'Hara Rodriguez, PA-C"   # optional subject line
closing: "Respectfully,"        # default: "Sincerely,"
---

Dear Dr. Smith,

Body text here. Plain markdown prose — no H1 needed.
```

The `--location` flag overrides `from-location` in the frontmatter, so one template file works for all three clinics.

---

## Locations

| Slug | Name | Address | Phone | Fax |
|------|------|---------|-------|-----|
| `sango` | CovenantCare Sango | 1000 Highway 76W, Clarksville, TN 37043 | (931) 245-1150 | (931) 245-1153 |
| `hilldale` | CovenantCare Hilldale | 236 Uffelman Drive, Clarksville, TN 37043 | (931) 647-6305 | (931) 245-0605 |
| `dover` | CovenantCare Dover | 1511 Donelson Pkwy, Dover, TN 37058 | (931) 232-5555 | (931) 232-9851 |

Website: CovenantCarePractices.com

---

## Brand Guidelines (summary)

### Logo
- **Letterhead:** Family Medicine lockup (`assets/logos/cc-lockup-familymedicine.png`) — the wordmark + rule + "FAMILY MEDICINE" — per brand guidelines §8
- **Never** use the old hands-and-heart icon or the italic-script underline version (both retired)
- **Never** stretch the wordmark into a square; use the monogram for small spaces

### Colors
| Name | Hex | Use |
|------|-----|-----|
| Covenant Blue | `#003F87` | Headings, rules, primary UI |
| Covenant Red | `#C8102E` | "Care" in logo, small accents only |
| Charcoal | `#2A2A2A` | Body text |
| Light Gray | `#F5F5F5` | Backgrounds, table shading |

Red is the accent, never the field. Large red blocks read as emergency in a medical setting.

### Fonts
| Use | Font |
|-----|------|
| Headings & logo | EB Garamond |
| Document/print body | Linux Libertine O (or Source Sans 3 as bundled fallback) |
| Website body | Source Sans 3 |

Fonts are bundled in `assets/fonts/` — generated PDFs render correctly on any machine.

### Voice & tone
Plain-spoken, calm, community-oriented. "Same provider, same chart, every visit." Not corporate, not hospital-system puffery.

---

## Templates

| File | Use |
|------|-----|
| `templates/referral-letter.md` | Outreach to specialty providers — introduce a CovenantCare provider and request referrals |
| `templates/blank-letter.md` | General-purpose starting point |

Copy a template, fill in the frontmatter and body, then run `generate-letter.ts`.

---

## Who signs what

| Sender | Title | Typical use |
|--------|-------|-------------|
| Robert Wilson, MD | Chairman, CovenantCare Practices | Board-level, legal, external partners |
| Alisha Harvey | President, CovenantCare Practices | Operations, vendor, staff communications |
| Robinson O'Hara Rodriguez, PA-C | Physician Assistant | Patient-facing, clinical outreach |

---

## Practice at a glance

- **Legal name:** Covenant Family Practice PC
- **DBA:** CovenantCare Practices
- **Three clinics:** Sango, Hilldale, Dover (Tennessee) — Erin location closed Q1 2026
- **Mission:** "Be the best place to work and the best place to be seen"
- **Website:** CovenantCarePractices.com
