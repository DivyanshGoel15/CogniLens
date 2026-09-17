"""Generates an educational multi-page sample PDF for testing the ingestion pipeline.

Contains headings, paragraphs, structured tables, equations, and technical terminology.
Does not use or download copyrighted material.
"""

from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak


def generate_sample_pdf(output_path: str | Path) -> Path:
    """Generate a high-quality 2-page educational PDF.

    Args:
        output_path: Path where the generated PDF will be saved.

    Returns:
        Path of the generated PDF file.
    """
    dest = Path(output_path)
    dest.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(dest),
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e3a8a"),
        spaceAfter=12,
    )

    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1e40af"),
        spaceBefore=12,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1f2937"),
        spaceAfter=8,
    )

    formula_style = ParagraphStyle(
        "Formula",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        fontName="Courier",
        textColor=colors.HexColor("#374151"),
        spaceBefore=6,
        spaceAfter=6,
        leftIndent=18,
    )

    story = []

    # --- PAGE 1 ---
    story.append(Paragraph("Computer Systems & Network Architecture", title_style))
    story.append(Paragraph("<b>Course:</b> CS-401 Distributed Systems | <b>Module:</b> 01 Transport Protocols", body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. Introduction to Network Layering", h2_style))
    story.append(
        Paragraph(
            "Modern distributed networks rely on hierarchical abstraction models to isolate hardware implementation "
            "details from application logic. In packet-switched communication, end hosts decompose data streams into discrete "
            "segments, encapsulated across successive network layers before transmission across physical media.",
            body_style,
        )
    )

    story.append(Paragraph("2. Mathematical Formulation of Throughput", h2_style))
    story.append(
        Paragraph(
            "The capacity of a data path is governed by the Bandwidth-Delay Product (BDP). The BDP determines the volume of data "
            "in flight required to fully saturate transmission links:",
            body_style,
        )
    )
    story.append(Paragraph("<b>BDP = Link Bandwidth (bps) × Round Trip Time (RTT in seconds)</b>", formula_style))
    story.append(
        Paragraph(
            "Furthermore, for Transmission Control Protocol (TCP) connections encountering packet loss probability <i>p</i>, "
            "throughput estimation often follows the Mathis formula: <b>Throughput ≤ (MSS / RTT) × (C / √p)</b>.",
            body_style,
        )
    )

    story.append(Spacer(1, 14))
    story.append(Paragraph("3. Summary of Protocol Stack Layers", h2_style))

    table_data = [
        ["Layer Number", "Layer Name", "Primary Protocol", "Data Unit (PDU)"],
        ["7", "Application", "HTTP/3, DNS, gRPC", "Message"],
        ["4", "Transport", "TCP, UDP, QUIC", "Segment / Datagram"],
        ["3", "Network", "IPv4, IPv6, BGP", "Packet"],
        ["2", "Data Link", "Ethernet, IEEE 802.11", "Frame"],
        ["1", "Physical", "Optical Fiber, Copper", "Bits"],
    ]

    table = Table(table_data, colWidths=[80, 110, 160, 130])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f1f5f9")]),
            ]
        )
    )
    story.append(table)

    # --- PAGE 2 ---
    story.append(PageBreak())
    story.append(Paragraph("4. Congestion Control & Avoidance Algorithms", h2_style))
    story.append(
        Paragraph(
            "Congestion avoidance algorithms regulate transmission rate dynamically in response to buffer overflows and packet drops. "
            "Classic algorithms such as TCP Tahoe, Reno, and CUBIC use Additive-Increase / Multiplicative-Decrease (AIMD) mechanisms.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "Modern transport frameworks like BBR (Bottleneck Bandwidth and RTT) decouple congestion detection from packet loss, "
            "sampling real-time delivery rates to operate near the Kleinrock optimum operating point.",
            body_style,
        )
    )

    story.append(Paragraph("5. Review Questions for Cognitive Evaluation", h2_style))
    story.append(Paragraph("• <b>Q1:</b> Contrast packet loss recovery between TCP selective acknowledgments (SACK) and standard cumulative ACK.", body_style))
    story.append(Paragraph("• <b>Q2:</b> How does a high Bandwidth-Delay Product affect TCP receiver window buffer sizing?", body_style))
    story.append(Paragraph("• <b>Q3:</b> Explain why UDP is preferred over TCP for low-latency streaming applications.", body_style))

    doc.build(story)
    return dest


if __name__ == "__main__":
    out = Path("data/sample_documents/sample.pdf")
    generate_sample_pdf(out)
    print(f"Generated sample PDF at: {out} ({out.stat().st_size} bytes)")
