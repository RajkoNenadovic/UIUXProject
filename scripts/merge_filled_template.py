"""Merge verified implementation notes onto the 50-page submission template.

The template remains the source of every page.  This script only adds a small,
readable footer overlay to page 1 and Part B (pages 20--50); it never replaces
or removes template content.
"""

from __future__ import annotations

import argparse
import io
import textwrap
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TEMPLATE = ROOT / "UX_Deliverable2_Implementation.pdf"
DEFAULT_OUTPUT = ROOT / "UX_Deliverable2_Implementation_Filled_Template.pdf"

# Claims are deliberately limited to facts that can be checked in this
# repository. Missing evidence is explicitly marked TODO rather than inferred.
NOTES = {
    1: (
        "VERIFIED IMPLEMENTATION OVERLAY | ClearLayer (Plain Language Layer). "
        "Repository: github.com/RajkoNenadovic/UIUXProject. "
        "The source template and all 50 original pages are retained. "
        "TODO: release tag and deployment URL were not found in the repository."
    ),
    20: (
        "VERIFIED: Team/repository/topic are shown in the template. "
        "Application: ClearLayer; platform: responsive web application. "
        "Verified member: Lukas Otero Asumendi (LukasOtero2006), implementation work visible in repository. "
        "TODO: Rajko's Deliverable 1 area and other member details need confirmation."
    ),
    21: (
        "VERIFIED demo path: dashboard/upload → library → document summary → reader → focus/actions → export. "
        "Routes are implemented in client/src/App.jsx and document pages. "
        "TODO: reviewer-specific screenshots and requirement mapping were not independently recorded."
    ),
    22: (
        "VERIFIED stack: React 19 + Vite 6; Express 4/Node API; SQLite + better-sqlite3; "
        "i18next/react-i18next. Repository structure is client/, server/, docs/, scripts/. "
        "TODO: diagram and CI/hosting evidence."
    ),
    23: (
        "VERIFIED data flow: React/Vite client → /api proxy → Express routes → SQLite; "
        "locale resources load in the client. External REST API integration was not found. "
        "TODO: architecture diagram image."
    ),
    24: (
        "VERIFIED screens/routes include workspace dashboard, storage, library, profile, notifications, help, "
        "summary, reader, focus, actions, export, scanner, jargon, verification and Q&A. "
        "TODO: Deliverable 1 ownership mapping for non-Lukas screens."
    ),
    25: (
        "VERIFIED: implemented UI includes workspace and document views; source screenshots are not stored as "
        "submission evidence. TODO: add screenshots of the running application."
    ),
    26: (
        "VERIFIED database: SQLite schema at server/db/schema.sql; tables include documents, sentences, "
        "saved_terms, action_items, settings and term_cache. Seed command: npm run db:seed. "
        "TODO: ERD image and live database screenshot."
    ),
    27: (
        "VERIFIED persistence endpoints live in server/src/routes/documents.js and settings.js; "
        "document records include original_text and status. TODO: screenshot and measured query example."
    ),
    28: (
        "VERIFIED API routes found: /api/health, /api/settings and /api/documents (GET/POST/document lookup). "
        "No external REST provider integration was found in the repository. "
        "TODO: provider, endpoint and attribution details."
    ),
    29: (
        "VERIFIED: server has JSON error middleware and document/settings routes; no external-service failure "
        "handling or cache policy could be verified. TODO: complete failure matrix and evidence screenshots."
    ),
    30: (
        "VERIFIED locales: en, es and hr under client/src/i18n/locales; i18next/react-i18next are declared. "
        "TODO: checked completeness percentages, plural screenshots and reviewer names."
    ),
    31: (
        "VERIFIED: translation resources exist for English, Spanish and Croatian and a parity checker exists "
        "at scripts/check-i18n.js. TODO: running-product locale formatting values and screenshots."
    ),
    32: (
        "VERIFIED: locale files include en/es/hr; responsive styles are in client/src/styles/global.css. "
        "TODO: measured text expansion and same-screen locale screenshots."
    ),
    33: (
        "VERIFIED: the repository contains Latin-script English, Spanish and Croatian locale resources. "
        "TODO: RTL implementation/evidence is not verified; document the actual script/line-breaking check."
    ),
    34: (
        "VERIFIED: product includes accessibility settings and localized UI resources. "
        "TODO: color, icon, example-data, personal-data and AI-output cultural review evidence."
    ),
    35: (
        "VERIFIED: keyboard/responsive/accessibility styling and a dyslexia-friendly mode are implemented in "
        "the client. TODO: ten-minute check results, automated tool output and screen-reader walkthrough."
    ),
    36: (
        "VERIFIED: global styles include focus/accessibility and dyslexia-friendly rules. "
        "TODO: measured contrast evidence, unresolved issue links and signed inclusive-design review."
    ),
    37: (
        "VERIFIED: no screenshot evidence for branch/merge graph or contributor history is stored in the repository. "
        "TODO: add repository-insights evidence."
    ),
    38: (
        "VERIFIED git history contains commits for workflow, save/share, dyslexia mode, fixtures and wireframes. "
        "TODO: per-member/per-week commit table and pull-request review records."
    ),
    39: (
        "VERIFIED: repository history is available through git log. TODO: complete pull-request table and "
        "honest collaboration narrative from team records."
    ),
    40: (
        "VERIFIED: no weekly progress log was found in the repository. TODO: reconstruct only from dated branches, "
        "commits and pull requests; do not infer missing activity."
    ),
    41: (
        "VERIFIED: implementation files cover client, server, database seed/schema, fixtures and scripts. "
        "TODO: member-by-member weekly branch/PR log."
    ),
    42: (
        "VERIFIED: repository contains no automated test framework/files; manual build and API checks are the "
        "only recorded validation. TODO: browser/device matrix and issue links."
    ),
    43: (
        "VERIFIED limitations: no external REST integration, no automated test suite and no deployment evidence "
        "were found. Next priorities: add tests, external integration and deployment. TODO: confirm team priorities."
    ),
    44: (
        "VERIFIED member record: Rajko Nenadović / RajkoNenadovic appears in the template and repository identity. "
        "TODO: contribution statement, commits/PRs, learning reflection and signature."
    ),
    45: (
        "VERIFIED member record: Lukas Otero Asumendi / LukasOtero2006; repository work includes core application "
        "structure and document flow. TODO: signed personal statement and exact commit/PR list."
    ),
    46: "TODO: no verified third-member identity or contribution evidence was found in the repository.",
    47: "TODO: no verified fourth-member identity or contribution evidence was found in the repository.",
    48: "TODO: no verified fifth-member identity or contribution evidence was found in the repository.",
    49: (
        "VERIFIED: AI-assisted development is evidenced by the generated implementation workflow, but tool/model "
        "and each person's verification cannot be established from repository files. TODO: team declaration and signatures."
    ),
    50: (
        "VERIFIED: repository link, .env.example, schema/seed files and three locale folders are present. "
        "TODO: release tag, PR evidence, external API, completed accessibility review, signatures and final checklist."
    ),
}

# (x, y, width, height, text) rectangles are positioned inside the template's
# existing blank cells.  Coordinates use the A4 points used by the source PDF.
CELLS = {
    20: [
        (235, 594, 325, 22, "ClearLayer"),
        (235, 515, 325, 22, "TODO: no submitted release tag found"),
        (235, 489, 325, 22, "TODO: no deployment URL found"),
        (235, 462, 325, 22, "15/11/2026 (submission date in current task context)"),
        (265, 348, 135, 49, "Lukas wireframes; reader, focus, mobile scanner, jargon, actions, verification, Q&A, export"),
        (405, 348, 160, 49, "Core application structure, workspace, database-backed documents, uploads, library, accessibility settings"),
        (265, 306, 135, 35, "TODO: confirm Deliverable 1 area"),
        (405, 306, 160, 35, "TODO: confirm responsibilities"),
    ],
    22: [
        (175, 650, 155, 35, "React 19; Vite 6"),
        (335, 650, 225, 35, "Component-based client and route views"),
        (175, 620, 155, 35, "Node.js; Express 4"),
        (335, 620, 225, 35, "REST routes for health, settings and documents"),
        (175, 590, 155, 35, "SQLite; better-sqlite3"),
        (335, 590, 225, 35, "Relational persistence for documents/settings"),
        (175, 560, 155, 35, "i18next 24; react-i18next 15"),
        (335, 560, 225, 35, "Externalized en/es/hr resources"),
        (175, 530, 155, 35, "TODO: no automated framework found"),
        (175, 480, 155, 35, "TODO: no CI found"),
        (175, 450, 155, 35, "TODO: no hosting found"),
        (80, 155, 480, 115, "client/ React/Vite UI; server/ Express API, SQLite schema and seed; docs/ wireframes; scripts/ repository checks. Data flow: browser → Vite /api proxy → Express → SQLite."),
    ],
    24: [
        (100, 610, 110, 22, "Dashboard"),
        (215, 610, 90, 22, "TODO"),
        (310, 610, 50, 22, "TODO"),
        (365, 610, 195, 22, "Workspace/upload flow added"),
        (100, 583, 110, 22, "Library"),
        (215, 583, 90, 22, "TODO"),
        (310, 583, 50, 22, "TODO"),
        (365, 583, 195, 22, "Search, save/share, document links"),
        (100, 555, 110, 22, "Storage"),
        (215, 555, 90, 22, "TODO"),
        (310, 555, 50, 22, "TODO"),
        (365, 555, 195, 22, "Upload/classification workspace"),
        (100, 528, 110, 22, "Profile"),
        (365, 528, 195, 22, "Persisted accessibility settings"),
        (100, 500, 110, 22, "Notifications / Help"),
        (365, 500, 195, 22, "Workspace views implemented"),
        (100, 473, 110, 22, "Split reader"),
        (215, 473, 90, 22, "Lukas"),
        (310, 473, 50, 22, "1"),
        (365, 473, 195, 22, "Selected database document"),
        (100, 445, 110, 22, "Focus / Actions"),
        (215, 445, 90, 22, "Lukas"),
        (365, 445, 195, 22, "Reading controls and document actions"),
        (100, 417, 110, 22, "Scanner / Jargon"),
        (215, 417, 90, 22, "Lukas"),
        (365, 417, 195, 22, "Prototype flows connected"),
        (100, 389, 110, 22, "Verification / Q&A"),
        (215, 389, 90, 22, "Lukas"),
        (365, 389, 195, 22, "Modal/sidebar interactions"),
        (100, 361, 110, 22, "Export / Summary"),
        (215, 361, 90, 22, "Lukas"),
        (365, 361, 195, 22, "Selected-document flow"),
        (80, 140, 480, 70, "TODO: screenshots and complete Deliverable 1 ownership mapping were not found in repository evidence."),
    ],
    26: [
        (205, 680, 350, 22, "SQLite + better-sqlite3"),
        (205, 651, 350, 22, "Small embedded relational database; no separate service"),
        (205, 620, 350, 22, "server/db/schema.sql"),
        (205, 590, 350, 22, "Schema creation scripts; no migration framework found"),
        (205, 562, 350, 22, "npm run db:seed --prefix server"),
        (205, 532, 350, 22, "SQLite defaults; collation not separately configured"),
        (80, 175, 480, 28, "documents: uploaded/seeded source records; sentences: plain-language segments; actions and saved_terms support reader features."),
        (80, 140, 480, 28, "settings: reading/accessibility preferences; term_cache: cached term payloads. TODO: ERD screenshot."),
    ],
    27: [
        (80, 720, 480, 28, "Entities continue: documents, sentences, saved_terms, action_items, settings, term_cache. Foreign keys and CHECK constraints are defined in schema.sql."),
        (80, 460, 480, 45, "Verified operation: GET /api/documents and GET /api/documents/:id load persisted records for Library and document-scoped views. TODO: database/interface screenshots."),
        (80, 320, 480, 38, "The selected document ID is used to fetch title, page count and original_text; this prevents every document from showing the lease sample."),
    ],
    28: [
        (210, 680, 350, 22, "TODO: no external REST provider found"),
        (210, 652, 350, 22, "TODO"),
        (210, 622, 350, 22, "TODO: external integration not verified"),
        (210, 585, 350, 35, "Internal API uses local server routes; no external key found"),
        (210, 555, 350, 22, "TODO"),
        (210, 525, 350, 22, "TODO"),
        (80, 180, 480, 32, "Verified internal endpoints: /api/health, /api/settings, /api/documents. These are local Express routes, not an external REST service."),
    ],
    29: [
        (205, 710, 155, 32, "TODO: external service not implemented"),
        (365, 710, 195, 32, "No external request to retry"),
        (205, 680, 155, 32, "TODO"),
        (365, 680, 195, 32, "TODO"),
        (205, 650, 155, 32, "TODO"),
        (365, 650, 195, 32, "TODO"),
        (205, 620, 155, 22, "No external cache verified"),
        (80, 280, 480, 45, "TODO: working/failure screenshots and external API evidence were not found. Internal Express errors are handled by middleware."),
    ],
    30: [
        (270, 640, 75, 35, "TODO"),
        (350, 640, 80, 35, "TODO"),
        (440, 640, 115, 35, "Source"),
        (270, 608, 75, 35, "TODO"),
        (350, 608, 80, 35, "TODO"),
        (440, 608, 115, 35, "Diacritics"),
        (205, 480, 350, 22, "i18next 24 + react-i18next 15"),
        (205, 452, 350, 22, "client/src/i18n/locales/{en,es,hr}"),
        (205, 420, 350, 22, "JSON; nested translation keys"),
        (205, 385, 350, 22, "TODO: run checker for exact count"),
        (205, 355, 350, 22, "TODO: verify fallback chain"),
        (205, 300, 350, 22, "TODO: verify detection/persistence"),
        (205, 270, 350, 22, "TODO: verify missing-key behavior"),
        (205, 240, 350, 22, "TODO: verify lang/dir evidence"),
    ],
    35: [
        (250, 650, 75, 25, "TODO"),
        (325, 650, 145, 25, "TODO"),
        (475, 650, 80, 25, "TODO"),
        (250, 620, 75, 25, "TODO"),
        (325, 620, 145, 25, "TODO"),
        (475, 620, 80, 25, "TODO"),
        (250, 590, 75, 25, "TODO"),
        (325, 590, 145, 25, "TODO"),
        (475, 590, 80, 25, "TODO"),
        (250, 560, 75, 25, "TODO"),
        (325, 560, 145, 25, "TODO"),
        (475, 560, 80, 25, "TODO"),
        (80, 280, 480, 45, "Verified in code: dyslexia-friendly mode, responsive styles and localized UI exist. TODO: record actual keyboard, zoom, contrast, screen-reader and automated-scan results."),
    ],
    38: [
        (80, 650, 480, 42, "TODO: exact branching/merge protection model was not documented in repository files."),
        (80, 100, 480, 32, "Verified commit subjects include workflow, save/share, dyslexia mode, fixtures and wireframes. TODO: per-week counts and contributor screenshots."),
    ],
    39: [
        (80, 350, 480, 28, "TODO: no pull-request table or reviewer evidence was found locally."),
        (80, 90, 480, 35, "TODO: collaboration narrative and complete weekly totals require team/git-host records."),
    ],
    40: [(80, 650, 480, 55, "TODO: no verified collaboration narrative was found in the repository; do not infer conflicts, workload or decisions.")],
    41: [(80, 350, 480, 40, "Verified implementation areas: client pages/components, server routes, SQLite schema/seed, fixture documents and i18n resources. TODO: member/branch/PR rows.")],
    42: [(80, 650, 480, 40, "Verified repository evidence remains the same as page 41. TODO: complete remaining weekly rows only from dated git/PR records.")],
    43: [
        (185, 650, 165, 22, "No automated test files found"),
        (355, 650, 200, 22, "TODO: command/evidence"),
        (185, 620, 165, 22, "Manual build/API checks"),
        (355, 620, 200, 22, "npm run build; API smoke checks"),
        (185, 590, 165, 22, "TODO"),
        (355, 590, 200, 22, "TODO"),
        (185, 560, 165, 22, "i18n parity script"),
        (355, 560, 200, 22, "node scripts/check-i18n.js"),
        (185, 530, 165, 22, "TODO"),
        (355, 530, 200, 22, "TODO"),
        (80, 225, 480, 38, "Verified limitations: no automated suite, external REST provider or deployment evidence. Next priorities should be tests, external integration and deployment; TODO: confirm team order."),
    ],
    44: [
        (225, 585, 335, 55, "TODO: exact Rajko-authored features/files not independently verified here."),
        (225, 545, 335, 32, "TODO: commit/PR list"),
        (225, 505, 335, 32, "TODO: learning reflection"),
        (225, 465, 335, 28, "TODO: weeks/signature/date"),
    ],
    45: [
        (225, 650, 335, 50, "Verified repository work: core app structure, workspace, database-backed document flow, uploads, library, accessibility settings, dynamic document views and supporting UI."),
        (225, 610, 335, 32, "TODO: exact commit/PR list"),
        (225, 570, 335, 32, "TODO: learning reflection"),
        (225, 525, 335, 28, "TODO: weeks/signature/date"),
    ],
    49: [
        (80, 410, 480, 55, "Verified: AI-assisted development is visible in the generated implementation workflow. TODO: name each tool/model, purpose, user and verification method; signatures are not repository-verifiable."),
    ],
    50: [
        (80, 350, 480, 62, "Verified: repository link, .env.example, schema/seed files and en/es/hr locale folders are present. TODO: release tag, PR evidence, external API, completed accessibility review, signatures and final checklist."),
    ],
}


def _draw_overlay(pdf_bytes: bytes, page_sizes: list[tuple[float, float]]) -> bytes:
    """Create one transparent overlay page per template page."""
    stream = io.BytesIO()
    pdf = canvas.Canvas(stream, pagesize=page_sizes[0])
    for index, (width, height) in enumerate(page_sizes, start=1):
        pdf.setPageSize((width, height))
        if index in NOTES:
            for x, y, cell_width, cell_height, text in CELLS.get(index, []):
                pdf.setFillColor(white)
                pdf.rect(x, y, cell_width, cell_height, fill=1, stroke=0)
                pdf.setFillColor(HexColor("#111827"))
                pdf.setFont("Helvetica", 6.5)
                lines = textwrap.wrap(
                    text, width=max(12, int(cell_width / 4.0)), break_long_words=False
                )
                line_y = y + cell_height - 9
                for line in lines[: max(1, int(cell_height / 8))]:
                    pdf.drawString(x + 3, line_y, line)
                    line_y -= 8
            box_x, box_y = 28, 18
            box_w, box_h = width - 56, 48 if index != 1 else 58
            pdf.setFillColor(white)
            pdf.roundRect(box_x, box_y, box_w, box_h, 5, fill=1, stroke=0)
            pdf.setStrokeColor(HexColor("#2563eb"))
            pdf.setLineWidth(0.8)
            pdf.roundRect(box_x, box_y, box_w, box_h, 5, fill=0, stroke=1)
            pdf.setFillColor(HexColor("#111827"))
            pdf.setFont("Helvetica-Bold", 7.2)
            pdf.drawString(box_x + 7, box_y + box_h - 12, f"Implementation notes — template page {index}")
            pdf.setFont("Helvetica", 7.1)
            available = max(40, int(box_w / 4.2))
            lines = textwrap.wrap(NOTES[index], width=available, break_long_words=False)[:3]
            for line_number, line in enumerate(lines):
                pdf.drawString(box_x + 7, box_y + box_h - 22 - line_number * 9, line)
        pdf.showPage()
    pdf.save()
    return stream.getvalue()


def merge(template: Path, output: Path) -> None:
    reader = PdfReader(str(template))
    if len(reader.pages) != 50:
        raise ValueError(f"Expected a 50-page template, found {len(reader.pages)} pages")
    page_sizes = [
        (float(page.mediabox.width), float(page.mediabox.height))
        for page in reader.pages
    ]
    overlay = PdfReader(io.BytesIO(_draw_overlay(b"", page_sizes)))
    writer = PdfWriter()
    for original, annotation in zip(reader.pages, overlay.pages):
        # Build a fresh page so the original template is merged last. This
        # keeps its headings, tables and images as the visible base layer;
        # the small white rectangles only occupy blank answer cells.
        page = writer.add_blank_page(
            width=float(original.mediabox.width),
            height=float(original.mediabox.height),
        )
        page.merge_page(annotation)
        page.merge_page(original)
    with output.open("wb") as handle:
        writer.write(handle)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--template", type=Path, default=DEFAULT_TEMPLATE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    merge(args.template, args.output)
    result = PdfReader(str(args.output))
    print(f"Created {args.output}")
    print(f"Pages: {len(result.pages)}")
    print(f"Size: {args.output.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
