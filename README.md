# CovenantCare Tools

Brand-compliant letter and document generation for CovenantCare Practices staff.

## Quick start

```bash
# Clone
git clone https://github.com/[org]/covenantcare-tools.git
cd covenantcare-tools

# Add bin to PATH (add to ~/.zshrc)
export PATH="$PWD/bin:$PATH"

# Generate a letter from a template
generate-letter templates/referral-letter.md

# Override location
generate-letter --location dover templates/referral-letter.md
```

**Requirements:** [bun](https://bun.sh) + Google Chrome.

## Using with Claude

Paste this into your Claude project instructions or conversation:

```
Use the CovenantCare tools repo at https://github.com/[org]/covenantcare-tools
Read CLAUDE.md for brand guidelines, location data, and how to generate letters.
```

Claude will handle drafting letter content; run `generate-letter` locally to produce the PDF.

## Locations

| Clinic | Address | Phone |
|--------|---------|-------|
| Sango | 1000 Highway 76W, Clarksville TN 37043 | (931) 245-1150 |
| Hilldale | 236 Uffelman Drive, Clarksville TN 37043 | (931) 647-6305 |
| Dover | 1511 Donelson Pkwy, Dover TN 37058 | (931) 232-5555 |

## Templates

- `templates/referral-letter.md` — provider referral outreach
- `templates/blank-letter.md` — general purpose

Copy a template, fill in the frontmatter fields, run `generate-letter`.
