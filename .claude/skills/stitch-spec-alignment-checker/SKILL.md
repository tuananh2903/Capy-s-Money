---
name: stitch-spec-alignment-checker
description: >-
  Checks alignment between modified product code, designs on Stitch, and specifications under the /docs directory.
  Generates a discrepancy report and updates code only after user approval.
---

# Stitch and Specification Alignment Checker

## Overview
This skill provides a structured workflow for the agent to check the alignment between the product code, design assets/tokens on Stitch, and technical specification documents under `/docs`. It is critical for enforcing the **Design & Spec Alignment** rule, ensuring no silent design drift or logic deviation from the PRD/SRS occurs during development.

## Dependencies
This skill leverages:
- **StitchMCP** server tools (e.g., `StitchMCP/list_screens`, `StitchMCP/get_screen`, `StitchMCP/list_design_systems`) to query Stitch project designs.
- `git` tools (`git status`, `git diff`) to detect modified files.
- Core workspace file reading tools to parse `/docs` files and source code.

## Quick Start
To run an alignment check, prompt the agent:
> "Run the alignment check for the modified files" or "Check if the Dashboard screen matches the Stitch design and docs spec."

## Workflow

### 1. Detect Modified Files
- Identify which code or UI components have been added or modified by checking `git status` or running `git diff`.
- Focus particularly on files under `src/screens/` and `src/components/`.

### 2. Retrieve Design Specs from Stitch
- Map each modified component or screen to its design counterpart on Stitch.
- Call `StitchMCP/list_screens` or `StitchMCP/get_screen` to fetch design specs, typography, spacing, shapes, and color tokens.
- **Critical Guardrail**: If the connection to the Stitch MCP server fails, or if a design screen cannot be found for the modified component:
  - **STOP immediately** and ask the user for guidance. Do not guess or continue.

### 3. Locate Spec Documents under `/docs`
- Search the `/docs` folder (including `docs/plans/`, `docs/brainstorms/`, `docs/requirements/`, `docs/design/`) for technical plans or PRDs related to the modified component.
- **Critical Guardrail**: If no corresponding spec document is found:
  - **STOP immediately** and ask the user for guidance. Do not proceed with assumptions.

### 4. Semantic and Design Comparison
- Read the content of the `/docs` file, the Stitch design properties, and the implementation code.
- Compare these three sources. The priority of truth is:
  1. `/docs` documentation (Primary source of truth).
  2. Stitch designs (Secondary source of truth).
  3. Product code.
- Verify the following guidelines:
  - **Stitch Brand Palette & Styling**: Colors must match the brand (Primary `#864E5A`, Pink container `#FFB7C5`, off-white background `#FFF8F7`, outline `#837375`, error `#BA1A1A`). Cards must have `borderRadius: 32` minimum. Buttons must be fully pill-shaped. No pure black/white or harsh red/green colors. Spacing must adhere to the 8px scale.
  - **Spec Logic**: Gating logic (freemium/premium checks), database schema models, offline sync rules, and validation checks must align exactly with the `/docs` requirements.

### 5. Generate Discrepancy Report
- Write the findings to a report file named `alignment_check_report.md` in the workspace root directory.
- The report must contain:
  - List of files/components checked.
  - Any discrepancies found between Code, Stitch, and `/docs` (grouped by component).
  - Clear proposed code edits/fixes to align the code with the design/docs.

### 6. User Approval & Code Modification
- Present the generated `alignment_check_report.md` to the user.
- **DO NOT** make any code changes to fix the discrepancies until the user has explicitly reviewed the report and given approval.
- Once approved, proceed to execute the proposed code changes incrementally.

## Common Mistakes
1. **Making changes before approval**: Editing the codebase to match specs/designs without first showing the user the `alignment_check_report.md` file.
2. **Ignoring missing docs/designs**: Guessing alignment parameters if a design screen or a doc file is missing. Always stop and ask the user.
3. **Overriding /docs with Stitch**: Treating Stitch as the absolute truth when it conflicts with a business rule documented in `/docs`. `/docs` is always the primary truth.
