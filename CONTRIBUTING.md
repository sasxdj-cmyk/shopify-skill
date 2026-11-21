# Contributing

Thanks for helping. This project has one hard rule: **nothing is claimed that cannot be verified.**

## Before you open a pull request

```bash
node scripts/validate.mjs
```

It must print `Skill package is valid.` and exit 0. CI runs the same command plus markdownlint and a link check.

## What a change must include

- **A source for every factual claim.** Add the URL and the date you checked it to the `## Sources` section of the file you edited. Do not invent documentation URLs; open the page and confirm it resolves.
- **A reason in the changelog** under `## [Unreleased]`.
- **A re-test** if you changed `SKILL.md` or a reference. The five scenarios are in `assets/rubric.md`; record the before and after score.
- **A verification step** for any new rule. "Do X" is not a rule; "Do X, then run Y and expect Z" is.

## Rules that will get a pull request rejected

- Adding a workflow summary to the `description` in the frontmatter. The description is a trigger, not a table of contents.
- Renaming the skill without renaming the directory. The two must match.
- Adding harness-specific tool names to `SKILL.md` ("use the Read tool", "dispatch a subagent"). Describe the action, not the tool.
- Absolute paths, backslashes in links, or Windows-only instructions.
- Duplicating content between `SKILL.md` and `references/`. The body links, the reference explains.
- Changing a security check id, severity or meaning without a matching update to the source list in `scripts/validate.mjs`.
- Adding a dependency. The validator is intentionally zero-dependency.

## Adding a reference file

1. Create it under `skills/shopify-custom-skill/references/`.
2. Add a `## Sources` section with at least one `https://` URL and `(verified on YYYY-MM-DD)`.
3. Link it from the reference map in `SKILL.md`.
4. Add the filename to `REFERENCES` in `scripts/validate.mjs`.

## Reporting a problem

Open an issue with the scenario, the agent and model you used, the answer you got, and the rule you expected it to follow. Verbatim output beats a summary.

## Code of conduct

Be precise and be kind. Critique the output, not the person.
