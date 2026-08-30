from pathlib import Path
from datetime import date
from PIL import Image

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parent
PNG_DIR = Path(Path.home()) / "AppData" / "Local" / "Temp" / "atlas-b2b-png-all"
OUT = ROOT / "Atlas-B2B-Digital-Twin-Concept-Architecture.docx"

NAVY = "172033"
TEAL = "168B80"
BLUE = "4969C5"
PURPLE = "8557C7"
GOLD = "D88A16"
INK = "233044"
MUTED = "667085"
LIGHT = "F3F5F7"
PALE_TEAL = "E6F4F1"
PALE_BLUE = "EAF0FF"
PALE_GOLD = "FFF4E5"
WHITE = "FFFFFF"


DIAGRAMS = [
    {
        "number": "1",
        "title": "High-level architecture",
        "file": "01-high-level-architecture",
        "executive": "Atlas turns many disconnected mall signals into one operational view of the physical environment.",
        "technical": "Atlas-native events and third-party telemetry enter a common ingestion and spatial-intelligence plane. The Digital Twin stores current state and history; analytics and MAS services derive predictions, recommendations, and controlled actions.",
        "caption": "Figure 1. Atlas high-level architecture: from physical mall signals to an operator decision surface.",
    },
    {
        "number": "3",
        "title": "Data source architecture",
        "file": "03-data-source-architecture",
        "executive": "Every metric has a source and a confidence level. Atlas does not claim that the mobile app alone knows total footfall, parking occupancy, temperature, or equipment state.",
        "technical": "The source registry should retain provenance, timestamp, granularity, consent or legal basis, latency, and quality score for every signal before fusion.",
        "caption": "Figure 2. Atlas-native data and mall infrastructure are joined through provenance-aware ingestion.",
    },
    {
        "number": "5",
        "title": "Whole-mall footfall estimation",
        "file": "05-whole-mall-footfall-estimation",
        "executive": "Atlas-observed movement is a sample. Counters and infrastructure signals help estimate the full mall population without inflating the sample into a false total.",
        "technical": "The estimator calibrates Atlas-observed sessions against entrance counts and corroborating density signals, segmented by entrance, floor, zone, time window, and data quality. The exact estimator is a pilot and model decision, not a universal constant.",
        "caption": "Figure 3. Sample-to-population calibration: 8,300 observed sessions versus an illustrative 42,000 total visitors.",
    },
    {
        "number": "7",
        "title": "Digital Twin data flow and feedback loop",
        "file": "07-digital-twin-feedback-loop",
        "executive": "The Twin is useful because it connects observation to action and then measures whether the action worked.",
        "technical": "Every recommendation should preserve a causal trail: input signals, Twin state, model version, recommendation, approval, actuator result, and post-action measurement.",
        "caption": "Figure 4. The Digital Twin closes the loop between the real mall, decisions, actions, and measured outcomes.",
    },
    {
        "number": "10",
        "title": "Visitor privacy and anonymisation",
        "file": "10-visitor-privacy",
        "executive": "Management sees patterns and operational counts, not visitor names or individual trails.",
        "technical": "The client emits only when analytics consent and applicable policy allow it. Identifiers rotate, raw events are minimised, aggregation happens before operator-facing analytics, and retention and access controls remain explicit.",
        "caption": "Figure 5. Privacy boundary from device event to aggregated operator insight.",
    },
    {
        "number": "11",
        "title": "Live Digital Twin operator view",
        "file": "11-live-digital-twin-ui",
        "executive": "A mall manager should open one screen and immediately understand live footfall, zone pressure, dwell, alerts, parking, and system health.",
        "technical": "The dashboard consumes derived Twin state and confidence metadata. It must never imply that every visible number came from Atlas users or that a prediction is a measurement.",
        "caption": "Figure 6. Proposed Atlas Twin operator dashboard: live state, estimates, forecasts, alerts, and system health.",
    },
    {
        "number": "18",
        "title": "Predictive intelligence",
        "file": "18-predictive-intelligence",
        "executive": "The product moves from 'the food court is busy' to 'the food court is likely to exceed normal capacity in 25 minutes, so open the west circulation route.'",
        "technical": "Predictions combine current Twin state, historical movement, arrival rates, calendar and events, weather, and operational context. Outputs need a horizon, confidence, baseline, and explanation.",
        "caption": "Figure 7. Predictive intelligence combines historical movement with current and external context.",
    },
    {
        "number": "2",
        "title": "Neural topology and multi-agent system",
        "file": "02-neural-topology-mas",
        "executive": "Atlas can use specialised operational experts - movement, congestion, parking, facilities, safety, and prediction - instead of one opaque 'mall AI.'",
        "technical": "Agents publish typed observations and recommendations through a shared event and state fabric. Connections are sparse and policy-governed; topology learning is a later research capability, not a prerequisite for the first pilot.",
        "caption": "Figure 8. Proposed specialist-agent topology for Atlas Neural / MAS.",
    },
    {
        "number": "22",
        "title": "Scenario simulation",
        "file": "22-scenario-simulation",
        "executive": "Management can ask 'what happens if Entrance 2 closes?' before changing the real mall. Atlas estimates redistributed flows, pressure points, and likely operational impact.",
        "technical": "The simulation forks the current Twin state, applies a scenario constraint, runs movement and occupancy models, and returns a comparison against the baseline. It is a forecast with assumptions, not certainty.",
        "caption": "Figure 9. Scenario simulation runs against a virtual Twin copy before any authorised real-world action.",
    },
    {
        "number": "30",
        "title": "Atlas as the mall's digital nervous system",
        "file": "30-atlas-nervous-system",
        "executive": "The physical mall is the body, infrastructure is the senses, Atlas is the nervous system, the Digital Twin is the internal world model, and the MAS is the decision-making brain.",
        "technical": "This is the north-star metaphor for the stack. Each metaphor maps to concrete services, data contracts, privacy controls, models, and human approval gates.",
        "caption": "Figure 10. Atlas Digital Twin as the mall's digital nervous system.",
    },
]


def set_run_font(run, name="Calibri", size=None, color=None, bold=None, italic=None):
    run.font.name = name
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.rFonts
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    rfonts.set(qn("w:ascii"), name)
    rfonts.set(qn("w:hAnsi"), name)
    if size is not None:
        run.font.size = Pt(size)
    if color is not None:
        run.font.color.rgb = RGBColor.from_string(color)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)
    shd.set(qn("w:val"), "clear")


def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_cell_width(cell, width_dxa):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.find(qn("w:tcW"))
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(width_dxa))
    tc_w.set(qn("w:type"), "dxa")


def set_table_geometry(table, widths_dxa, indent_dxa=120):
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = False
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(sum(widths_dxa)))
    tbl_w.set(qn("w:type"), "dxa")
    tbl_ind = tbl_pr.find(qn("w:tblInd"))
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:w"), str(indent_dxa))
    tbl_ind.set(qn("w:type"), "dxa")
    grid = tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths_dxa:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)
    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            set_cell_width(cell, widths_dxa[idx])
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def set_table_borders(table, color="D7DEE8", size="6"):
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.first_child_found_in("w:tblBorders")
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = f"w:{edge}"
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def mark_header_row(row):
    tr_pr = row._tr.get_or_add_trPr()
    header = tr_pr.find(qn("w:tblHeader"))
    if header is None:
        header = OxmlElement("w:tblHeader")
        tr_pr.append(header)
    header.set(qn("w:val"), "true")


def shade_paragraph(paragraph, fill, left="90", right="90", top="80", bottom="80"):
    p_pr = paragraph._p.get_or_add_pPr()
    shd = p_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        p_pr.append(shd)
    shd.set(qn("w:fill"), fill)
    shd.set(qn("w:val"), "clear")
    spacing = p_pr.find(qn("w:spacing"))
    if spacing is None:
        spacing = OxmlElement("w:spacing")
        p_pr.append(spacing)
    spacing.set(qn("w:before"), top)
    spacing.set(qn("w:after"), bottom)


def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("Page ")
    set_run_font(run, size=9, color=MUTED)
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = " PAGE "
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char1)
    run._r.append(instr_text)
    run._r.append(fld_char2)


def add_heading(doc, text, level=1):
    p = doc.add_paragraph(style=f"Heading {level}")
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    set_run_font(run, size={1: 18, 2: 14, 3: 12}[level], color={1: TEAL, 2: BLUE, 3: NAVY}[level], bold=True)
    return p


def add_body(doc, text, after=6):
    p = doc.add_paragraph(style="Normal")
    p.paragraph_format.space_after = Pt(after)
    run = p.add_run(text)
    set_run_font(run, size=10.5, color=INK)
    return p


def add_label_body(doc, label, text, fill):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(7)
    p.paragraph_format.line_spacing = 1.1
    shade_paragraph(p, fill)
    label_run = p.add_run(label.upper() + "  ")
    set_run_font(label_run, size=9, color=TEAL if fill == PALE_TEAL else BLUE, bold=True)
    text_run = p.add_run(text)
    set_run_font(text_run, size=10.2, color=INK)
    return p


def add_caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    set_run_font(run, size=9.2, color=MUTED, italic=True)
    return p


def add_source(doc, stem):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(8)
    run = p.add_run(f"Editable source: docs/atlas-b2b/diagrams/{stem}.puml")
    set_run_font(run, size=8.5, color=MUTED)
    return p


def add_image(doc, image_path, max_width=6.45, max_height=6.1):
    with Image.open(image_path) as image:
        width, height = image.size
    width_in = width / 96
    height_in = height / 96
    scale = min(max_width / width_in, max_height / height_in)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run()
    run.add_picture(str(image_path), width=Inches(width_in * scale), height=Inches(height_in * scale))
    inline = run._r.xpath(".//wp:inline")[-1]
    doc_pr = inline.find(qn("wp:docPr"))
    if doc_pr is not None:
        doc_pr.set("descr", "Atlas B2B Digital Twin architecture diagram")
    return p


def setup_styles(doc):
    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Calibri"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor.from_string(INK)
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.1
    for level, size, color, before, after in [
        (1, 18, TEAL, 16, 8),
        (2, 14, BLUE, 12, 6),
        (3, 12, NAVY, 8, 4),
    ]:
        style = styles[f"Heading {level}"]
        style.font.name = "Calibri"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True


def setup_page(section):
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.85)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.header_distance = Inches(0.35)
    section.footer_distance = Inches(0.35)
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    hp.paragraph_format.space_after = Pt(0)
    run = hp.add_run("ATLAS B2B  /  DIGITAL TWIN CONCEPT ARCHITECTURE")
    set_run_font(run, size=8.5, color=MUTED, bold=True)
    footer = section.footer
    fp = footer.paragraphs[0]
    fp.text = ""
    add_page_number(fp)


def add_cover(doc):
    for _ in range(2):
        doc.add_paragraph().paragraph_format.space_after = Pt(18)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(10)
    run = p.add_run("ATLAS B2B  /  CONCEPT ARCHITECTURE")
    set_run_font(run, size=10, color=TEAL, bold=True)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run("Digital Twin")
    set_run_font(run, size=34, color=NAVY, bold=True)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(18)
    run = p.add_run("How Atlas gives a physical mall a digital nervous system")
    set_run_font(run, size=17, color=BLUE, bold=False)
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(18)
    p.paragraph_format.line_spacing = 1.15
    shade_paragraph(p, PALE_TEAL, left="150", right="150", top="130", bottom="130")
    run = p.add_run("A live operational model that combines Atlas indoor mapping and movement intelligence with mall infrastructure data to understand, visualise, predict, and eventually optimise the physical environment.")
    set_run_font(run, size=12, color=INK)
    for label, value in [
        ("Audience", "Mall executives, operations leaders, product and engineering teams"),
        ("Scope", "First ten Digital Twin concept diagrams"),
        ("Status", "Concept architecture aligned to the current Atlas foundation"),
        ("Date", "19 August 2026"),
    ]:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        label_run = p.add_run(label + ": ")
        set_run_font(label_run, size=10, color=TEAL, bold=True)
        value_run = p.add_run(value)
        set_run_font(value_run, size=10, color=INK)
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(30)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run("Atlas does not just map buildings. It gives physical spaces a digital nervous system.")
    set_run_font(run, size=12, color=PURPLE, italic=True)


def add_executive_summary(doc):
    add_heading(doc, "Executive summary", 1)
    add_body(doc, "Atlas Digital Twin is a real-time virtual representation of a physical mall. It combines Atlas indoor maps, positioning, and privacy-aware movement intelligence with signals from entrance counters, people-counting systems, Wi-Fi/BLE/IoT, parking, building-management systems, equipment, security, and external context.")
    add_body(doc, "The critical commercial distinction is that Atlas users are a movement-data source, not the whole mall population. Atlas-observed journeys provide high-resolution spatial behaviour; independent infrastructure helps calibrate that sample to estimated total footfall and zone occupancy.")
    add_label_body(doc, "The promise", "Move mall operations from seeing what is happening, to understanding why it is happening, to predicting what happens next, and finally to testing and approving interventions before they affect the real environment.", PALE_BLUE)
    add_heading(doc, "What the ten diagrams explain", 2)
    add_body(doc, "The document follows one story: the mall produces signals; Atlas preserves spatial meaning and privacy; the Digital Twin fuses those signals into a live state; analytics explains the state; prediction estimates the future; specialised agents coordinate reasoning; simulation tests choices; and the operator measures the result.")

    table = doc.add_table(rows=1, cols=3)
    set_table_geometry(table, [1600, 2600, 5160])
    set_table_borders(table)
    headers = ["Atlas foundation", "Repository surface", "Role in the B2B architecture"]
    for cell, value in zip(table.rows[0].cells, headers):
        set_cell_shading(cell, PALE_BLUE)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(value)
        set_run_font(run, size=9.2, color=NAVY, bold=True)
    mark_header_row(table.rows[0])
    rows = [
        ("Versioned map model", "packages/spatial-model; tooling/map-importer", "Defines venue, floors, POIs, navigation nodes, edges, and map versions."),
        ("Positioning contracts", "packages/positioning-core", "Defines position estimates, confidence, and BLE/PDR/visual contribution boundaries."),
        ("Movement events", "packages/analytics-events; platform event ingestion", "Defines privacy-aware event envelopes and movement events such as zone entry, exit, POI passage, and dwell."),
        ("API and analytics", "services/platform-api; services/analytics-worker", "Provides the service boundary for ingestion, validation, storage, and aggregation."),
        ("Digital Twin and Neural MAS", "Product direction above the foundation", "Adds live state, sensor fusion, forecasting, simulation, agent coordination, and recommendations."),
    ]
    for row in rows:
        cells = table.add_row().cells
        for idx, value in enumerate(row):
            p = cells[idx].paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(value)
            set_run_font(run, size=9.2, color=INK, bold=(idx == 0))
    set_table_geometry(table, [1600, 2600, 5160])

    add_heading(doc, "How to read the status labels", 2)
    add_body(doc, "Current foundation means the capability is represented in the existing Atlas repository. Pilot integration means the capability depends on a venue-specific system or data-provider connection. Product direction means the Digital Twin or Neural MAS capability is proposed above the current foundation and should be implemented incrementally.")


def add_diagram_section(doc, item, index):
    if index > 0:
        doc.add_page_break()
    add_heading(doc, f"{item['number']}. {item['title']}", 1)
    add_label_body(doc, "Executive lens", item["executive"], PALE_TEAL)
    add_label_body(doc, "Technical lens", item["technical"], PALE_BLUE)
    image_path = PNG_DIR / f"{item['file']}.png"
    if not image_path.exists():
        raise FileNotFoundError(image_path)
    add_image(doc, image_path)
    add_caption(doc, item["caption"])
    add_source(doc, item["file"])


def add_close(doc):
    doc.add_page_break()
    add_heading(doc, "The single Atlas B2B story", 1)
    add_label_body(doc, "Observe", "The mall produces signals from visitors, infrastructure, equipment, and the outside environment.", PALE_GOLD)
    add_label_body(doc, "Understand", "Atlas gives those signals spatial meaning and fuses them into a live, privacy-preserving operational state.", PALE_TEAL)
    add_label_body(doc, "Predict", "Historical movement, current conditions, events, weather, and capacity constraints produce a forecast with a horizon and confidence.", PALE_BLUE)
    add_label_body(doc, "Simulate", "Management can test a decision against a virtual copy of the current Twin before changing the real mall.", "F2EAFE")
    add_label_body(doc, "Act and learn", "A manager approves a bounded intervention, the mall changes, and the Twin measures the result against the prediction.", "F3F4F6")
    add_body(doc, "The commercial proposition is simple: Atlas does not only map the mall; it gives the mall a continuously updating operational model.")
    add_heading(doc, "The remaining diagram backlog", 2)
    add_body(doc, "The next set of views can expand the core narrative into movement tracking, sensor fusion, spatial zones, indoor positioning, heatmap generation, journey analytics, the real-time event pipeline, the spatial data model, Twin state, agent activation and rewiring, integration, deployment, edge/cloud processing, product ecosystem, maturity roadmap, and the manager use-case flow.")


def main():
    if not PNG_DIR.exists():
        raise SystemExit(f"Missing embedded diagram PNG directory: {PNG_DIR}")
    doc = Document()
    setup_styles(doc)
    setup_page(doc.sections[0])
    add_cover(doc)
    doc.add_page_break()
    add_executive_summary(doc)
    doc.add_page_break()
    for index, item in enumerate(DIAGRAMS):
        add_diagram_section(doc, item, index)
    add_close(doc)
    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
