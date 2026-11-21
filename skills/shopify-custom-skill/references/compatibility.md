# Compatibility and installation

One skill, five agents, no duplicated content. Install it once per agent, or once in the shared directory that most agents already read.

**Contents:** [Shared directory](#shared-directory) · [Per-agent installation](#per-agent-installation) · [Invocation](#invocation) · [Packaging files](#packaging-files) · [Troubleshooting](#troubleshooting) · [Sources](#sources)

## Shared directory

`~/.agents/skills/<skill-name>/SKILL.md` is the closest thing to a standard user-level location. Codex, OpenCode, Qwen Code and Hermes Agent all read it; Claude Code has its own directory but can be pointed at the same content.

```text
~/.agents/skills/shopify-custom-skill/
├── SKILL.md
├── agents/openai.yaml
├── references/
└── assets/
```

Project-level equivalents exist for every agent (`.agents/skills/`, `.claude/skills/`, `.opencode/skills/`, `.qwen/skills/`, `.hermes/skills/`). Use a project-level install when the skill should travel with the repository; use the user-level install when the same person works across many stores.

Rules that avoid 90% of the problems:

- The directory name must equal the `name` in the frontmatter.
- One skill per directory. Two `SKILL.md` files with the same name make Hermes Agent fail with an ambiguous-name error and make Codex list both.
- Keep the body under 500 lines and push detail into `references/`, because some agents load the whole `SKILL.md` into the session context.
- Use relative paths with forward slashes. `references/liquid-patterns.md`, never `references\liquid-patterns.md` and never an absolute path.
- Do not name harness-specific tools in the body. Write "read the file", "run the command", "ask the user", not "use the Read tool" or "dispatch a subagent".

## Per-agent installation

### Claude Code

```bash
# user level
mkdir -p ~/.claude/skills
cp -r skills/shopify-custom-skill ~/.claude/skills/

# project level
mkdir -p .claude/skills
cp -r skills/shopify-custom-skill .claude/skills/
```

Discovery: `~/.claude/skills/<name>/SKILL.md` and `.claude/skills/<name>/SKILL.md`. Invocation is automatic when the description matches, or explicit by naming the skill. As a plugin: `/plugin marketplace add <owner>/<repo>` then install from the marketplace entry.

### Codex

```bash
mkdir -p ~/.agents/skills
cp -r skills/shopify-custom-skill ~/.agents/skills/
```

Discovery: `~/.agents/skills/`, plus `.agents/skills/` from the working directory up to the repository root. Skills are listed with `/skills` and can be invoked explicitly by name. The optional `agents/openai.yaml` supplies the display name, a short description, a default prompt, and whether implicit invocation is allowed.

### OpenCode

```bash
mkdir -p ~/.config/opencode/skills
cp -r skills/shopify-custom-skill ~/.config/opencode/skills/
```

Discovery paths: `~/.config/opencode/skills/`, `.opencode/skills/`, and the compatibility directories `~/.claude/skills/` and `~/.agents/skills/`. The skill id is derived from the path and is case-sensitive; the frontmatter `name` is a display label. Skills are exposed through the `skill` tool and can be referenced as `@<id>` in a prompt.

### Qwen Code

```bash
mkdir -p ~/.qwen/skills
cp -r skills/shopify-custom-skill ~/.qwen/skills/
```

Discovery: `~/.qwen/skills/`, `.qwen/skills/`, and the shared `.agents/skills/`. Qwen accepts extra frontmatter (`allowedTools`, `paths`, `priority`) that other agents ignore; this skill deliberately uses none of them, so the same file works everywhere. Skills are invoked with `/<skill-name>` or through `/skills`.

### Hermes Agent

```bash
mkdir -p ~/.hermes/skills
cp -r skills/shopify-custom-skill ~/.hermes/skills/
```

Discovery: `~/.hermes/skills/`, `.hermes/skills/`, `.agents/skills/`, and installed plugin taps. Hermes loads a skill on demand through `skill_view("<name>")` and lists them with `skills_list`. As a plugin, `.hermes-plugin/plugin.yaml` declares `provides_skills`, so the skill can be installed from this repository as a tap.

### skills.sh

```bash
npx skills add <owner>/shopify-skill
```

Installs the skill for the agents it detects on the machine. The repository layout (`skills/<name>/SKILL.md`) is what the indexer expects.

## Invocation

| Agent | Automatic | Explicit |
|-------|-----------|----------|
| Claude Code | description match | name the skill in the prompt |
| Codex | description match | `/skills`, then the skill name |
| OpenCode | description match | `@shopify-custom-skill`, or the skill tool |
| Qwen Code | description match | `/shopify-custom-skill` |
| Hermes Agent | description match | `skill_view("shopify-custom-skill")`, `/shopify-custom-skill` |

If the skill is not picked up automatically, the description is the problem: it must contain the words the user actually types (Shopify, theme, Liquid, section, cart, checkout, Markets). The description in this package is written for that, and it intentionally does not summarise the workflow.

## Packaging files

| File | Consumer | Purpose |
|------|----------|---------|
| `plugin.json` | Agent Plugins v1 clients, Copilot | Declares the plugin and `skills: "./skills/"` |
| `gemini-extension.json` | Gemini CLI | Extension name and version |
| `.claude-plugin/plugin.json` | Claude Code | Plugin metadata |
| `.claude-plugin/marketplace.json` | Claude Code | Marketplace entry with a local source |
| `.codex-plugin/plugin.json` | Codex | Plugin metadata and interface |
| `.cursor-plugin/plugin.json` | Cursor | Plugin metadata |
| `.hermes-plugin/plugin.yaml` | Hermes Agent | `provides_skills`, homepage, CLI commands |
| `skills/.../agents/openai.yaml` | Codex | Display name, default prompt, implicit-invocation policy |

The manifests carry the same name and version. They do not duplicate the skill body: the body lives once, in `SKILL.md`.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Skill never triggers | Description lacks the user's vocabulary | Add the concrete trigger words; keep it under 500 characters |
| Agent follows a summary instead of the body | Description summarises the workflow | Description = triggers only |
| Ambiguous skill name error | Two skills share a name | Keep one directory per name; delete the duplicate |
| "Skill not found" on a case-sensitive loader | Directory name differs from `name`, or wrong case | Make them identical and lowercase |
| References not found | Backslashes or absolute paths | Relative forward-slash paths from the skill directory |
| Body truncated or ignored | Oversized `SKILL.md` | Move detail into `references/`, keep the body under 500 lines |
| Conflicting instructions | `AGENTS.md`, `CLAUDE.md` or `SOUL.md` says otherwise | Follow the precedence section: repo wins on style, skill wins on Shopify correctness |
| Nothing works after install | Installed into a directory the agent does not scan | Check the discovery list above for that agent |

## Sources

- https://agentskills.io/specification — Agent Skills specification: naming, frontmatter, progressive disclosure (verified on 2026-11-20)
- https://opencode.ai/docs/skills/ — OpenCode discovery paths and invocation (verified on 2026-11-20)
- https://developers.openai.com/codex/skills/ — Codex skills, `.agents/skills`, `agents/openai.yaml` (verified on 2026-11-20)
- https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/ — Qwen Code skills and extra frontmatter (verified on 2026-11-20)
- https://hermes-agent.nousresearch.com/docs/user-guide/features/skills — Hermes Agent skills, `skill_view`, taps (verified on 2026-11-20)
- https://hermes-agent.nousresearch.com/docs/developer-guide/plugins — Hermes plugin format (verified on 2026-11-20)
- https://skills.sh — skills.sh install and badge (verified on 2026-11-20)
