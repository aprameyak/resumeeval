"""PDF report generation using ReportLab."""
import os
import uuid
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

from app.config import settings
from app.models.evaluation import Evaluation

logger = logging.getLogger(__name__)

REPORT_DIR = Path(settings.LOCAL_UPLOAD_PATH) / "reports"
REPORT_DIR.mkdir(parents=True, exist_ok=True)

# Color palette
PRIMARY = colors.HexColor("#6366f1")
DARK = colors.HexColor("#0f172a")
MUTED = colors.HexColor("#64748b")
SUCCESS = colors.HexColor("#22c55e")
WARNING = colors.HexColor("#f59e0b")
DANGER = colors.HexColor("#ef4444")
BG_LIGHT = colors.HexColor("#f8fafc")


def _score_color(score: float, max_val: float) -> colors.Color:
    pct = score / max_val if max_val else 0
    if pct >= 0.75:
        return SUCCESS
    elif pct >= 0.5:
        return WARNING
    return DANGER


def generate_pdf_report(evaluation: Evaluation) -> str:
    """Generate a PDF report and return its file path."""
    filename = f"report_{evaluation.id}_{uuid.uuid4().hex[:8]}.pdf"
    output_path = str(REPORT_DIR / filename)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    title_style = ParagraphStyle("title", parent=styles["Title"], textColor=DARK, fontSize=24, spaceAfter=4)
    sub_style = ParagraphStyle("sub", parent=styles["Normal"], textColor=MUTED, fontSize=11, spaceAfter=16)
    section_style = ParagraphStyle("section", parent=styles["Heading2"], textColor=PRIMARY, fontSize=14, spaceBefore=18, spaceAfter=8)
    body_style = ParagraphStyle("body", parent=styles["Normal"], textColor=DARK, fontSize=10, leading=14)
    muted_style = ParagraphStyle("muted", parent=styles["Normal"], textColor=MUTED, fontSize=9)

    story.append(Paragraph("ResumeScore Evaluation Report", title_style))
    candidate = evaluation.candidate_name or "Unknown Candidate"
    story.append(Paragraph(f"Candidate: {candidate}", sub_style))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}", muted_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=16))

    # ── Overall Score ─────────────────────────────────────────────────────────
    story.append(Paragraph("Overall Score", section_style))
    total = evaluation.total_score or 0
    bonus = evaluation.bonus_points_total or 0
    deduc = evaluation.deductions_total or 0
    base = total - bonus + deduc

    score_data = [
        ["Category", "Score", "Max", "Percentage"],
        ["Open Source", f"{evaluation.open_source_score or 0:.1f}", "35", f"{(evaluation.open_source_score or 0)/35*100:.0f}%"],
        ["Self Projects", f"{evaluation.self_projects_score or 0:.1f}", "30", f"{(evaluation.self_projects_score or 0)/30*100:.0f}%"],
        ["Production Experience", f"{evaluation.production_score or 0:.1f}", "25", f"{(evaluation.production_score or 0)/25*100:.0f}%"],
        ["Technical Skills", f"{evaluation.technical_skills_score or 0:.1f}", "10", f"{(evaluation.technical_skills_score or 0)/10*100:.0f}%"],
        ["Bonus Points", f"+{bonus:.1f}", "20", ""],
        ["Deductions", f"-{deduc:.1f}", "", ""],
        ["TOTAL SCORE", f"{total:.1f}", "120", f"{total/120*100:.0f}%"],
    ]

    table = Table(score_data, colWidths=[8 * cm, 3 * cm, 3 * cm, 3 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("BACKGROUND", (0, -1), (-1, -1), DARK),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [BG_LIGHT, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Evidence ──────────────────────────────────────────────────────────────
    story.append(Paragraph("Category Evidence", section_style))
    evidences = [
        ("Open Source", evaluation.open_source_evidence),
        ("Self Projects", evaluation.self_projects_evidence),
        ("Production Experience", evaluation.production_evidence),
        ("Technical Skills", evaluation.technical_skills_evidence),
    ]
    for label, evidence in evidences:
        if evidence:
            story.append(Paragraph(f"<b>{label}:</b>", body_style))
            story.append(Paragraph(evidence, muted_style))
            story.append(Spacer(1, 0.3 * cm))

    # ── Bonuses / Deductions ──────────────────────────────────────────────────
    if evaluation.bonus_points_breakdown:
        story.append(Paragraph("Bonus Points", section_style))
        story.append(Paragraph(f"Total: +{bonus:.1f} points", body_style))
        story.append(Paragraph(evaluation.bonus_points_breakdown, muted_style))

    if evaluation.deductions_reasons:
        story.append(Paragraph("Deductions", section_style))
        story.append(Paragraph(f"Total: -{deduc:.1f} points", body_style))
        story.append(Paragraph(evaluation.deductions_reasons, muted_style))

    # ── Strengths ─────────────────────────────────────────────────────────────
    if evaluation.key_strengths:
        story.append(Paragraph("Key Strengths", section_style))
        for s in evaluation.key_strengths:
            story.append(Paragraph(f"• {s}", body_style))

    # ── Areas for Improvement ─────────────────────────────────────────────────
    if evaluation.areas_for_improvement:
        story.append(Paragraph("Areas for Improvement", section_style))
        for a in evaluation.areas_for_improvement:
            story.append(Paragraph(f"• {a}", body_style))

    # ── GitHub Summary ────────────────────────────────────────────────────────
    if evaluation.github_data:
        gh = evaluation.github_data
        profile = gh.get("profile", {}) if isinstance(gh, dict) else {}
        if profile:
            story.append(Paragraph("GitHub Summary", section_style))
            story.append(Paragraph(f"Username: {profile.get('login', 'N/A')}", body_style))
            story.append(Paragraph(f"Followers: {profile.get('followers', 0)}", body_style))
            story.append(Paragraph(f"Public Repos: {profile.get('public_repos', 0)}", body_style))
            if profile.get("bio"):
                story.append(Paragraph(f"Bio: {profile['bio']}", muted_style))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MUTED))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(
        "Generated by ResumeScore · Powered by interviewstreet/hiring-agent",
        ParagraphStyle("footer", parent=styles["Normal"], textColor=MUTED, fontSize=8, alignment=TA_CENTER)
    ))

    doc.build(story)
    logger.info(f"Report saved to {output_path}")
    return output_path
