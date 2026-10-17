#!/usr/bin/env python3
"""
Generate professional architectural PDF using ReportLab.
Reads docs/Cloudworx_PartA_Architecture_Design.md and formats it cleanly.
Handles code blocks, inline tags, tables, and typography without raw HTML entity artifacts.
"""

import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Preformatted
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#627d98"))

        # Header (Pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, "Cloudworx Industrial Digital Twin — Architecture Design Document")
            self.drawRightString(558, 755, "Confidential — Assessment")
            self.setStrokeColor(colors.HexColor("#bcccdc"))
            self.setLineWidth(0.5)
            self.line(54, 748, 558, 748)

        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawString(54, 35, "Cloudworx Technologies © 2026")
        self.drawRightString(558, 35, page_text)
        self.setStrokeColor(colors.HexColor("#bcccdc"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)

        self.restoreState()


def format_inline_markdown(text):
    """
    Format markdown text for ReportLab Paragraphs.
    Converts markdown formatting to ReportLab XML tags while escaping special characters.
    """
    # 1. LaTeX math substitutions
    text = text.replace(r'\ge', '≥').replace(r'\le', '≤').replace(r'\times', '×')
    text = re.sub(r'\\text\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\$([^$]+)\$', r'\1', text)

    # 2. Extract and protect inline code `...` first with placeholders
    code_tokens = []
    def stash_code(match):
        code = match.group(1)
        code_escaped = code.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        code_tokens.append(f'<font face="Courier">{code_escaped}</font>')
        return f'__CODE_TOKEN_{len(code_tokens)-1}__'

    text = re.sub(r'`([^`]+)`', stash_code, text)

    # 3. Escape ampersands in remaining text
    text = re.sub(r'&(?!(?:amp|lt|gt|quot|apos);)', '&amp;', text)

    # 4. Bold and Italic
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)

    # 5. Escape raw < and > not part of ReportLab formatting
    text = re.sub(r'<(?!\/?(?:b|i|font)(?:[\s>]))', '&lt;', text)

    # 6. Restore protected code tokens
    for i, token in enumerate(code_tokens):
        text = text.replace(f'__CODE_TOKEN_{i}__', token)

    return text


def build_pdf(md_path, pdf_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        text = f.read()

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#102a43'),
        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#486581'),
        spaceAfter=15,
    )

    h1_style = ParagraphStyle(
        'Heading1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#102a43'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#243b53'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor('#243b53'),
        spaceAfter=5,
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3,
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#102a43'),
        backColor=colors.HexColor('#f0f4f8'),
        borderPadding=6,
        spaceAfter=8,
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("Cloudworx Industrial Digital Twin Platform", title_style))
    story.append(Paragraph("Architecture Design Document — Surface 1 & Surface 2 | Reference: CWX-ARCH-2026", subtitle_style))
    story.append(Spacer(1, 8))

    lines = text.split('\n')
    in_code_block = False
    code_lines = []
    in_table = False
    table_rows = []

    for line in lines:
        stripped = line.strip()

        # Handle Code Blocks
        if stripped.startswith('```'):
            if in_code_block:
                # Preformatted accepts raw plain text; DO NOT escape HTML entities here
                code_text = '\n'.join(code_lines)
                story.append(Preformatted(code_text, code_style))
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        # Handle Tables
        if '|' in line and (stripped.startswith('|') or stripped.endswith('|')):
            if not in_table:
                in_table = True
                table_rows = []
            
            # Skip separator row like |---|---|
            if re.match(r'^[\|\s\:\-]+$', stripped):
                continue
            
            cells = [c.strip() for c in stripped.strip('|').split('|')]
            table_rows.append(cells)
            continue
        elif in_table:
            # End of table, render it
            if table_rows:
                num_cols = max(len(r) for r in table_rows)
                col_widths = [504 / num_cols] * num_cols
                
                # Format cells as Paragraphs
                formatted_data = []
                for row_idx, row in enumerate(table_rows):
                    row_data = []
                    for cell in row:
                        cell_clean = format_inline_markdown(cell)
                        font = 'Helvetica-Bold' if row_idx == 0 else 'Helvetica'
                        row_data.append(Paragraph(cell_clean, ParagraphStyle(
                            'TableCell',
                            fontName=font,
                            fontSize=8,
                            leading=10,
                            textColor=colors.HexColor('#102a43') if row_idx == 0 else colors.HexColor('#334e68'),
                        )))
                    formatted_data.append(row_data)

                t = Table(formatted_data, colWidths=col_widths)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#d9e2ec')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#102a43')),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('LEFTPADDING', (0, 0), (-1, -1), 5),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#bcccdc')),
                ]))
                story.append(t)
                story.append(Spacer(1, 6))
            in_table = False
            table_rows = []

        if not stripped:
            continue

        # Skip main markdown title as we already added styled header
        if stripped.startswith('# Cloudworx Industrial Digital Twin'):
            continue
        if stripped.startswith('**Document Reference:'):
            continue
        if stripped.startswith('---'):
            story.append(Spacer(1, 4))
            continue

        # Headings
        if stripped.startswith('## '):
            h_text = format_inline_markdown(stripped[3:].strip())
            story.append(Paragraph(h_text, h1_style))
            continue
        elif stripped.startswith('### '):
            h_text = format_inline_markdown(stripped[4:].strip())
            story.append(Paragraph(h_text, h2_style))
            continue

        # Bullet points
        if stripped.startswith('- ') or stripped.startswith('* '):
            b_text = format_inline_markdown(stripped[2:].strip())
            story.append(Paragraph(f"• {b_text}", bullet_style))
            continue

        # Numbered list
        if re.match(r'^\d+\.\s', stripped):
            num_match = re.match(r'^(\d+\.)\s*(.*)', stripped)
            prefix = num_match.group(1)
            b_text = format_inline_markdown(num_match.group(2))
            story.append(Paragraph(f"<b>{prefix}</b> {b_text}", bullet_style))
            continue

        # Standard Body Text
        p_text = format_inline_markdown(stripped)
        story.append(Paragraph(p_text, body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated PDF successfully: {pdf_path}")

if __name__ == '__main__':
    md_file = os.path.abspath('docs/Cloudworx_PartA_Architecture_Design.md')
    out_pdf = os.path.abspath('docs/Cloudworx_PartA_Architecture_Design.pdf')
    os.makedirs(os.path.dirname(out_pdf), exist_ok=True)
    build_pdf(md_file, out_pdf)
