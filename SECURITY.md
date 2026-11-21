# Security policy

## Scope

This repository contains instructions and example code for AI agents. It is not a running service. The realistic risks are:

- An example that teaches an unsafe pattern (unescaped Liquid, a secret in a theme, a missing signature check).
- A reference that cites a security control incorrectly.
- A dependency or workflow that could be compromised.

## Reporting a problem

Open a private security advisory on GitHub, or email the maintainer listed in `plugin.json`. Do not open a public issue for an exploitable example.

Include: the file and line, what the example teaches, the correct behaviour, and a source for the correct behaviour.

## What we will do

- Acknowledge within 7 days.
- Fix incorrect security guidance in a patch release and note it in `CHANGELOG.md`.
- Credit the reporter unless they prefer otherwise.

## What this repository will never contain

- Real credentials, tokens or customer data.
- Example payloads that are executable without context. Payloads appear only as inert strings used to verify escaping.
- Instructions that weaken a Shopify security control.

## Supported versions

The latest release on `main` is supported. Older versions receive no fixes.
