# CovenantCare Tools

Brand-compliant letter and document generation for CovenantCare Practices staff.
Consistent letterhead, correct location data, and on-brand PDFs across all three clinics.

**Requirements:** [bun](https://bun.sh) and Google Chrome — both already on staff machines.

---

## Using with Claude

### Claude Code (CLI)

Clone the repo, then add the bin directory to your PATH:

```bash
git clone https://github.com/rwilson131/covenantcare-tools.git
cd covenantcare-tools
export PATH="$PWD/bin:$PATH"   # add this line to ~/.zshrc to make it permanent
```

Claude Code automatically reads `CLAUDE.md` when you work in this directory — brand guidelines, location data, and tool instructions are all loaded.

### Claude.ai (web/app/Cowork)

In your Claude project settings, add to **Project instructions**:

```
Reference the CovenantCare tools repo at:
https://github.com/rwilson131/covenantcare-tools

Read CLAUDE.md for brand guidelines, location data, letter templates, and document generation instructions.
```

Claude will draft letter content using the correct brand voice, locations, and templates. Run the generator locally to produce the final PDF.

---

## Tools

### `generate-letter` — Professional letterhead PDF

For outgoing correspondence: referral letters, vendor outreach, patient communications, announcements.

Uses the **Family Medicine lockup** (brand guidelines §8) with location-specific address block and footer.

```bash
# Basic — location from frontmatter
generate-letter templates/referral-letter.md

# Override location at generation time
generate-letter --location hilldale templates/referral-letter.md
generate-letter --location dover --output ~/Desktop/letter.pdf input.md

# Or run directly with bun
bun generate-letter.ts --location sango input.md
```

**Frontmatter fields:**

```yaml
---
date: "June 12, 2026"                      # required
from-name: "Alisha Harvey"                 # appears in signature block
from-title: "President, CovenantCare Practices"
from-location: hilldale                    # sango | hilldale | dover | none
to: |                                      # addressee block — multiline
  Dr. Jane Smith
  Community Health Clinic
  123 Main Street
  Clarksville, TN 37040
re: "Referral — Robinson O'Hara Rodriguez, PA-C"   # optional subject line
closing: "Respectfully,"                   # default: "Sincerely,"
---

Dear Dr. Smith,

Body text here in plain markdown.
```

The `--location` flag overrides `from-location` in the frontmatter — one template file works for all three clinics.

---

### `generate-pdf` — Branded document PDF

For policies, memos, reports, and formal documents. Centered title block with the primary wordmark, document type header, optional CONFIDENTIAL marking.

```bash
# Basic
generate-pdf input.md

# With document type and confidential marking
generate-pdf --doctype "Policy" --confidential input.md
generate-pdf --doctype "Memo" --output ~/Desktop/memo.pdf input.md

# Or run directly with bun
bun generate-pdf.ts --doctype "Staff Policy" input.md
```

**Frontmatter fields:**

```yaml
---
title: "Document Title"
subtitle: "Optional Subtitle"
effective-date: "June 1, 2026"
version: "1.0"
---

## Section Heading

Body content in markdown.
```

---

## Locations

| Slug | Clinic | Address | Phone | Fax |
|------|--------|---------|-------|-----|
| `sango` | CovenantCare Sango | 1000 Highway 76W, Clarksville, TN 37043 | (931) 245-1150 | (931) 245-1153 |
| `hilldale` | CovenantCare Hilldale | 236 Uffelman Drive, Clarksville, TN 37043 | (931) 647-6305 | (931) 245-0605 |
| `dover` | CovenantCare Dover | 1511 Donelson Pkwy, Dover, TN 37058 | (931) 232-5555 | (931) 232-9851 |

Website: CovenantCarePractices.com

---

## Templates

| File | Use |
|------|-----|
| `templates/referral-letter.md` | Introduce a provider and request referrals from nearby specialists |
| `templates/blank-letter.md` | General-purpose starting point |

Copy a template, fill in the frontmatter and body, run `generate-letter`.

---

## Brand quick reference

| Element | Spec |
|---------|------|
| Covenant Blue | `#003F87` — headings, rules, primary elements |
| Covenant Red | `#C8102E` — logo accent only, never large blocks |
| Charcoal | `#2A2A2A` — body text |
| Heading font | EB Garamond |
| Body font (print) | Source Sans 3 (bundled in `assets/fonts/`) |
| Letterhead logo | Family Medicine lockup (`assets/logos/cc-lockup-familymedicine.png`) |
| Document logo | Primary wordmark (`assets/logos/cc-wordmark.png`) |

**Retired marks** — do not use: hands-and-heart icon, italic-script underline version.

---

## Who signs what

| Name | Title | Typical letters |
|------|-------|-----------------|
| Robert Wilson, MD | Chairman, CovenantCare Practices | Legal, board-level, external partners |
| Alisha Harvey | President, CovenantCare Practices | Operations, vendors, staff |
| Robinson O'Hara Rodriguez, PA-C | Physician Assistant, Hilldale | Clinical outreach, referral network |

---

## Practice at a glance

- **Legal name:** Covenant Family Practice PC · **DBA:** CovenantCare Practices
- **Mission:** "Be the best place to work and the best place to be seen"
- **Website:** CovenantCarePractices.com
