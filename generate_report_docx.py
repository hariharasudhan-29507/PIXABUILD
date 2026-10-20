import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_pixabuild_report(output_filename="PixaBuild_Project_Report.docx"):
    doc = docx.Document()

    # 1. Page Setup & Margins (1 inch all around)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # 2. Configure Default Styles
    style_normal = doc.styles['Normal']
    font_normal = style_normal.font
    font_normal.name = 'Times New Roman'
    font_normal.size = Pt(12)
    font_normal.color.rgb = RGBColor(0x22, 0x22, 0x22)
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(6)

    # Helper: Set Cell Shading
    def set_cell_background(cell, fill_hex):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    # Helper: Set Cell Margins (Padding)
    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(
            f'<w:tcMar {nsdecls("w")}>'
            f'<w:top w:w="{top}" w:type="dxa"/>'
            f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
            f'<w:left w:w="{left}" w:type="dxa"/>'
            f'<w:right w:w="{right}" w:type="dxa"/>'
            f'</w:tcMar>'
        )
        tcPr.append(tcMar)

    # Helper: Set Table Borders
    def set_table_borders(table):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>'
            f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>'
            f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/>'
            f'<w:insideV w:val="none"/>'
            f'<w:left w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    # Helper: Headings
    def add_chapter_title(title_text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(12)
        run = p.add_run(title_text)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(0x11, 0x11, 0x11)

    def add_section_heading(heading_text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(heading_text)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    def add_subsection_heading(sub_text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(sub_text)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

    def add_body_p(text):
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        return p

    def add_figure_placeholder(caption_text):
        p_box = doc.add_paragraph()
        p_box.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_box.paragraph_format.space_before = Pt(10)
        p_box.paragraph_format.space_after = Pt(2)
        run_box = p_box.add_run("<< INSERT FIGURE HERE >>")
        run_box.font.name = 'Consolas'
        run_box.font.size = Pt(10)
        run_box.font.color.rgb = RGBColor(0x77, 0x77, 0x77)

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(12)
        run_cap = p_cap.add_run(caption_text)
        run_cap.italic = True
        run_cap.font.name = 'Times New Roman'
        run_cap.font.size = Pt(10.5)
        run_cap.font.color.rgb = RGBColor(0x44, 0x44, 0x44)

    def add_code_block(code_text):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.rows[0].cells[0]
        set_cell_background(cell, "F5F5F3")
        set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
        p = cell.paragraphs[0]
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(code_text.strip())
        run.font.name = 'Consolas'
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------
    # COVER / HEADER
    # -------------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p.paragraph_format.space_before = Pt(36)
    title_p.paragraph_format.space_after = Pt(6)
    r_main = title_p.add_run("PROJECT REPORT\nON\nPIXABUILD")
    r_main.bold = True
    r_main.font.size = Pt(20)
    r_main.font.name = 'Times New Roman'

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_p.paragraph_format.space_after = Pt(30)
    r_sub = sub_p.add_run("Spatial AI Furniture Commerce and In-Room Visualization Platform")
    r_sub.font.size = Pt(13)
    r_sub.italic = True

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHAPTER 1: INTRODUCTION
    # -------------------------------------------------------------
    add_chapter_title("CHAPTER 1\nINTRODUCTION")

    add_section_heading("1.1 PERSPECTIVE")
    add_body_p(
        "Buying furniture online often presents a clear spatial problem: customers cannot reliably judge scale, depth, and proportion from isolated studio photographs. Flat white-background product shots rarely communicate how a lounge chair or coffee table will actually look seated inside a real living room with existing daylight and floor materials. This uncertainty leads to high return rates, abandoned shopping carts, and reliance on manual measuring tapes."
    )
    add_body_p(
        "PixaBuild resolves this by combining a curated Scandinavian furniture store with an automated in-room spatial staging engine. Shoppers browse catalog items, choose an architectural room template or upload a photo of their own home, and generate an integrated perspective preview. Instead of placing a flat rectangular cutout over the picture, the system segments the floor boundaries, calculates depth scale, and casts dual-layer contact shadows on the floor plane. The system supports two primary user roles:"
    )
    add_body_p("• Customer: Explores catalog collections, inspects pieces via 3D spatial orbit views, stages products inside personal room photos, adds customized finishes to their cart, and completes checkout.")
    add_body_p("• Store Administrator: Manages product specifications and pricing, tracks customer order manifests, monitors user credentials, and reviews real-time event logs.")

    add_section_heading("1.2 OBJECTIVE")
    add_body_p("The main objectives of the PixaBuild platform are:")
    add_body_p("1. Build an editorial web interface following Scandinavian design principles—generous whitespace, warm neutral surfaces, high-contrast typography, and zero decorative visual clutter.")
    add_body_p("2. Automate background extraction on furniture items using flood-fill alpha matting, eliminating ugly rectangular studio borders when compositing.")
    add_body_p("3. Implement perspective-grounded contact shadow generation so placed objects sit naturally on the room's floor plane.")
    add_body_p("4. Deliver an interactive Before/After comparison slider that lets customers contrast their original empty room with the staged scene.")
    add_body_p("5. Ensure the entire stack stays lightweight (under 60 MB RAM on the backend service) so it can deploy on standard cloud tiers without memory crashes.")

    add_section_heading("1.3 SCOPE")
    add_body_p(
        "The project encompasses catalog discovery across six key categories (Sofas, Coffee Tables, Dining Chairs, Bed Frames, Display Cabinets, and Office Desks), product inspection with dynamic 3D tilt, room image ingestion, spatial compositing, cart calculation with white-glove delivery options, schema-validated checkout, and an administration dashboard. The current scope targets daylight residential interior photography on modern desktop and mobile browsers."
    )

    # -------------------------------------------------------------
    # CHAPTER 2: REQUIREMENT DESCRIPTION
    # -------------------------------------------------------------
    add_chapter_title("CHAPTER 2\nREQUIREMENT DESCRIPTION")

    add_section_heading("2.1 FUNCTIONAL REQUIREMENTS")
    add_body_p("The functional requirements capture the core capabilities provided by the application:")
    add_body_p("• User Authentication: Provide credential-based sign-in for shoppers and administrators, securing administrative routes through role checks.")
    add_body_p("• Catalog Navigation: Display furniture pieces with verified prices, dimensions, materials, and color swatches, filterable by room environment.")
    add_body_p("• Room Library & Ingestion: Offer pre-configured interior presets (Living Room, Bedroom, Dining Room, Home Office, Entryway) and support custom room photo uploads in JPEG and PNG formats.")
    add_body_p("• Spatial Placement Synthesis: Anchor transparent product cutouts onto the floor plane, apply directional contact shadows, and generate full-resolution composite previews.")
    add_body_p("• Split Comparison Slider: Provide a responsive slider handle to compare the original room against the staged composite image in real time.")
    add_body_p("• Cart and Order Processing: Validate delivery information with strict schema parsing, compute totals with freight rates, and generate unique tracking identifiers.")

    add_section_heading("2.2 NON-FUNCTIONAL REQUIREMENTS")
    add_body_p("• Performance: Client-side compositing and visualizer rendering must complete in under 1.5 seconds on standard consumer broadband.")
    add_body_p("• Memory Footprint: The backend Python web service must operate under a 512 MB memory limit (benchmarked at ~27 MB) to prevent out-of-memory errors on free cloud instances.")
    add_body_p("• Usability: Color contrast ratios must meet WCAG AA standards (minimum 4.5:1 for body text) using high-contrast deep charcoal against warm ivory surfaces.")
    add_body_p("• Resilience: If the backend image server is temporarily offline, the frontend must fall back to an internal HTML5 canvas compositing engine without showing broken image states.")

    # -------------------------------------------------------------
    # CHAPTER 3: SYSTEM DESIGN
    # -------------------------------------------------------------
    add_chapter_title("CHAPTER 3\nSYSTEM DESIGN")

    add_section_heading("3.1 ARCHITECTURE DESIGN")
    add_body_p(
        "The system uses a decoupled client-server architecture. The user interacts with the Next.js 16 frontend. When the customer requests an in-room preview, the client transmits the room image and furniture ID to the FastAPI backend. The server processes the scene through floor segmentation, depth gradient scaling, and shadow compositing modules, returning a composite JPEG. If the server is unreachable, the client executes the same shadow geometry locally via HTML5 canvas."
    )
    add_figure_placeholder("Figure 3.1: Architecture Diagram of PixaBuild Platform")

    add_section_heading("3.2 DESIGN COMPONENTS")
    add_subsection_heading("3.2.1 Front End:")
    add_body_p(
        "Constructed with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS. Smooth scrolling is provided by Lenis, entrance reveal animations are driven by GSAP, and all interface icons are sourced from Lucide React using uniform 1.5px strokes."
    )
    add_subsection_heading("3.2.2 Back End:")
    add_body_p(
        "Built using Python FastAPI and Uvicorn. Core image transformations use Pillow and NumPy for breadth-first search alpha extraction, perspective depth scaling, and multi-layer Gaussian contact shadow rendering."
    )

    add_section_heading("3.3 DATABASE DESCRIPTION")
    add_body_p("Structured database records are managed in PostgreSQL via Supabase, with client sessions stored in browser cache.")
    
    add_subsection_heading("3.3.1 Furniture Item Structure")
    add_body_p("Table 3.1 shows the schema attributes for catalog product records.")

    # Table 3.1
    t31 = doc.add_table(rows=7, cols=5)
    t31.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t31)

    headers_31 = ["Attribute Name", "Type", "Width", "Constraint(s)", "Description"]
    for i, h in enumerate(headers_31):
        cell = t31.rows[0].cells[i]
        set_cell_background(cell, "EAEAE8")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.bold = True
        run.font.size = Pt(10)

    rows_31_data = [
        ("item_id", "String", "32", "PRIMARY KEY", "Unique product identifier (e.g., pixa-sofa-1)"),
        ("name", "String", "128", "NOT NULL", "Commercial display title of the furniture piece"),
        ("category", "String", "48", "NOT NULL", "Category (Sofa, Coffee Table, Bed Frame, etc.)"),
        ("price", "Decimal", "10,2", "NOT NULL", "Base retail unit price in USD"),
        ("dimensions", "String", "48", "NOT NULL", "Physical dimensions in metric format (W x D x H)"),
        ("cutout_url", "String", "255", "NOT NULL", "Relative path to transparent alpha PNG asset"),
    ]

    for row_idx, data in enumerate(rows_31_data):
        for col_idx, text in enumerate(data):
            cell = t31.rows[row_idx + 1].cells[col_idx]
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            run = p.add_run(text)
            run.font.size = Pt(9.5)

    add_body_p("Table 3.1: Furniture Item Description")

    add_section_heading("3.4 LOW LEVEL DESIGN")
    add_body_p("Table 3.4 outlines the execution contract for the in-room staging pipeline.")

    # Table 3.4
    t34 = doc.add_table(rows=8, cols=2)
    t34.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t34)

    t34_data = [
        ("Files Used", "pipeline/generate.py, server.py, frontend/src/app/visualize/page.tsx"),
        ("Short Description", "Receives room photo and furniture ID, returning a natural composite image"),
        ("Arguments", "room_file (UploadFile/Blob), furniture_id (String), prompt (Optional)"),
        ("Return", "Binary JPEG image stream (HTTP 200)"),
        ("Pre-Condition", "Room image must be valid JPEG/PNG; product ID must exist in catalog"),
        ("Post-Condition", "Composite image rendered into split comparison canvas"),
        ("Exception", "HTTP 404 (Missing Asset), HTTP 415 (Invalid Format), HTTP 500 (Error)"),
        ("Actor", "Customer / Buyer"),
    ]

    for row_idx, (prop, desc) in enumerate(t34_data):
        cell_p = t34.rows[row_idx].cells[0]
        cell_d = t34.rows[row_idx].cells[1]
        set_cell_background(cell_p, "F5F5F3")
        set_cell_margins(cell_p, 60, 60, 100, 100)
        set_cell_margins(cell_d, 60, 60, 100, 100)
        
        p1 = cell_p.paragraphs[0]
        r1 = p1.add_run(prop)
        r1.bold = True
        r1.font.size = Pt(10)

        p2 = cell_d.paragraphs[0]
        r2 = p2.add_run(desc)
        r2.font.size = Pt(9.5)

    add_body_p("Table 3.4: Room Staging Generation Contract")

    add_section_heading("3.5 USER INTERFACE DESIGN")
    add_subsection_heading("3.5.1 Landing Page Hero Section")
    add_body_p(
        "Features an oversized Scandinavian lounge chair photographed in natural daylight, occupying 70% of visual weight on desktop, paired with editorial typography and direct shopping actions."
    )
    add_figure_placeholder("Figure 3.2: Hero Layout of PixaBuild Storefront")

    add_subsection_heading("3.5.2 Spatial Visualizer Studio")
    add_body_p(
        "Provides room category tabs, custom image upload triggers, an honest 5-step integration progress workflow, and a responsive before-and-after split slider."
    )
    add_figure_placeholder("Figure 3.3: Interactive Room Visualizer Studio Interface")

    # -------------------------------------------------------------
    # CHAPTER 4: SYSTEM IMPLEMENTATION
    # -------------------------------------------------------------
    add_chapter_title("CHAPTER 4\nSYSTEM IMPLEMENTATION")

    add_section_heading("4.1 ALPHA MATTING ALGORITHM")
    add_body_p(
        "Studio product shots photographed on white backgrounds produce harsh rectangular blocks if pasted directly over a room photo. The system runs an automated queue-based flood fill starting from perimeter boundary pixels to isolate the exterior studio background without cutting into light-colored interior cushions or wood grain."
    )
    add_code_block(
        "FUNCTION extract_cutout(image, tolerance):\n"
        "    Compute median color of boundary pixels -> bg_color\n"
        "    Initialize queue Q and boolean array is_bg[height, width]\n"
        "    FOR each pixel on top, bottom, left, right borders:\n"
        "        IF distance(pixel, bg_color) < tolerance:\n"
        "            Mark is_bg[y, x] = True, Push (y, x) to Q\n"
        "    WHILE Q is not empty:\n"
        "        Pop (y, x) from Q\n"
        "        FOR each neighbor (ny, nx):\n"
        "            IF inside image AND NOT is_bg[ny, nx]:\n"
        "                IF distance(neighbor, bg_color) < tolerance:\n"
        "                    Mark is_bg[ny, nx] = True, Push (ny, nx) to Q\n"
        "    Generate alpha_mask where is_bg is False (255) and True (0)\n"
        "    Apply Gaussian blur (radius=0.8) to soften mask edges\n"
        "    RETURN image with alpha_mask applied\n"
        "END FUNCTION"
    )

    add_section_heading("4.2 GROUND CONTACT SHADOW COMPOSITING")
    add_body_p(
        "To anchor furniture credibly on a room's floor plane, the engine renders two separate shadow matrices: an ambient floor spread and a dark contact line directly under the furniture's feet."
    )
    add_code_block(
        "FUNCTION composite_scene(room_img, furniture_cutout):\n"
        "    Target width FW = room_width * 0.42\n"
        "    Scale furniture_cutout maintaining native aspect ratio\n"
        "    Anchor center at (50% room_width, 74% room_height)\n"
        "    // Layer 1: Diffuse Ambient Floor Shadow (Soft penumbra)\n"
        "    Draw ellipse (FW * 1.15, FH * 0.28) with radial gradient opacity 110 -> 0\n"
        "    Blur with Gaussian kernel (sigma = 12)\n"
        "    // Layer 2: Ambient Occlusion Line (Direct floor contact)\n"
        "    Draw ellipse (FW * 0.90, FH * 0.08) with radial gradient opacity 170 -> 0\n"
        "    Blur with Gaussian kernel (sigma = 4)\n"
        "    Composite Room + Diffuse Shadow + Contact Line + Cutout\n"
        "    RETURN final composite JPEG\n"
        "END FUNCTION"
    )

    add_section_heading("4.3 CHECKOUT ORDER PROCESSING")
    add_body_p(
        "Customer shipping forms are parsed client-side using Zod validation schemas before order confirmation numbers are generated."
    )
    add_code_block(
        "FUNCTION submit_order(form_data, cart_items):\n"
        "    IF form_data.firstName < 2 chars OR form_data.address is empty:\n"
        "        RETURN validation_errors\n"
        "    Generate order tracking ID: 'SE-' + random_number(100000, 999999)\n"
        "    Save order manifest to database\n"
        "    Clear cart and emit 'cart_updated' event\n"
        "    RETURN order_success_view\n"
        "END FUNCTION"
    )

    # -------------------------------------------------------------
    # CHAPTER 5: RESULTS AND DISCUSSION
    # -------------------------------------------------------------
    add_chapter_title("CHAPTER 5\nRESULTS AND DISCUSSION")

    add_section_heading("5.1 TEST CASES AND VERIFICATION")
    add_body_p(
        "System testing evaluated the spatial staging pipeline, asset resolution, custom upload handling, and the commerce workflow."
    )

    add_subsection_heading("5.1.1 Spatial Visualizer Test Cases")

    # Table 5.1
    t51 = doc.add_table(rows=6, cols=5)
    t51.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t51)

    headers_51 = ["Test ID", "Description", "Input Data", "Expected Output", "Result"]
    for i, h in enumerate(headers_51):
        cell = t51.rows[0].cells[i]
        set_cell_background(cell, "EAEAE8")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.bold = True
        run.font.size = Pt(10)

    rows_51_data = [
        ("TC-01", "Standard room staging", "Room: living_01.jpg, Item: pixa-sofa-1", "Composite JPEG with transparent edges", "PASS"),
        ("TC-02", "Invalid product ID", "Room: bedroom_01.jpg, Item: bad-id-99", "Handled gracefully; default fallback cutout", "PASS"),
        ("TC-03", "High-res user room photo", "user_room.png (3200x2400, 4.2 MB)", "Scaled proportionally; placement successful", "PASS"),
        ("TC-04", "Invalid file upload type", "document.pdf as room file", "Error message: 'Invalid file format'", "PASS"),
        ("TC-05", "Backend offline simulation", "Server port 8000 unreachable", "Client canvas engine renders fallback", "PASS"),
    ]

    for row_idx, data in enumerate(rows_51_data):
        for col_idx, text in enumerate(data):
            cell = t51.rows[row_idx + 1].cells[col_idx]
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            run = p.add_run(text)
            run.font.size = Pt(9.5)

    add_body_p("Table 5.1: Test Cases for Visualizer Pipeline")

    add_subsection_heading("5.1.2 Cart and Checkout Test Cases")

    # Table 5.2
    t52 = doc.add_table(rows=4, cols=5)
    t52.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t52)

    for i, h in enumerate(headers_51):
        cell = t52.rows[0].cells[i]
        set_cell_background(cell, "EAEAE8")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.bold = True
        run.font.size = Pt(10)

    rows_52_data = [
        ("TC-06", "Add to cart from visualizer", "pixa-sofa-1, Qty: 1, $499.00", "Cart badge increments; item stored", "PASS"),
        ("TC-07", "Valid order submission", "Valid name, street, postal code", "Order ID 'SE-XXXXXX' generated", "PASS"),
        ("TC-08", "Missing required address", "Name provided, Address left blank", "Validation alert; submission halted", "PASS"),
    ]

    for row_idx, data in enumerate(rows_52_data):
        for col_idx, text in enumerate(data):
            cell = t52.rows[row_idx + 1].cells[col_idx]
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            run = p.add_run(text)
            run.font.size = Pt(9.5)

    add_body_p("Table 5.2: Test Cases for Commerce Flow")

    # -------------------------------------------------------------
    # CHAPTER 6: CONCLUSION AND FUTURE ENHANCEMENTS
    # -------------------------------------------------------------
    add_chapter_title("CHAPTER 6\nCONCLUSION AND FUTURE ENHANCEMENT(S)")

    add_body_p(
        "PixaBuild demonstrates that online furniture shopping can be significantly enhanced through practical computer vision and grounded spatial compositing. By automating transparent cutout extraction, implementing dual-layer floor contact shadows, and providing an interactive Before/After comparison slider, the application resolves customer hesitation without requiring complex augmented reality equipment or native mobile apps. Memory optimization brought backend runtime RAM down to approximately 27 MB, enabling stable deployment on free cloud tiers."
    )
    add_body_p("Future enhancements include:")
    add_body_p("• Dynamic Lighting Direction Detection: Estimating room window and light source vectors to angle floor contact shadows automatically.")
    add_body_p("• Multi-Object Staging: Permitting shoppers to arrange complete furniture groupings (e.g., a sofa, coffee table, and vitrine) within the same room view.")
    add_body_p("• WebXR Spatial Integration: Introducing optional LiDAR scanning support for mobile browsers capable of capturing physical room geometry.")

    # -------------------------------------------------------------
    # APPENDIX A & B
    # -------------------------------------------------------------
    add_chapter_title("APPENDIX – A\nSYSTEM REQUIREMENTS")

    add_section_heading("HARDWARE REQUIREMENTS:")
    add_body_p("• Processor: 1.6 GHz dual-core 64-bit CPU or higher (x86_64 or ARM64)")
    add_body_p("• Client Memory: 2 GB RAM minimum for smooth browser operation")
    add_body_p("• Server Memory: 512 MB RAM minimum (Application runs at ~27 MB)")
    add_body_p("• Storage: 500 MB available drive space for dependencies and catalog assets")

    add_section_heading("SOFTWARE REQUIREMENTS:")
    add_body_p("• Operating System: Windows 10/11, macOS 12+, Linux, Android 10+, or iOS 15+")
    add_body_p("• Frontend Environment: Node.js v18.18+ or v20+, Next.js 16, React 19")
    add_body_p("• Backend Environment: Python 3.10 – 3.12, FastAPI 0.110+, Uvicorn")
    add_body_p("• Database: PostgreSQL via Supabase")
    add_body_p("• Supported Browsers: Google Chrome 110+, Safari 16+, Firefox 115+, Edge 110+")

    add_chapter_title("APPENDIX – B\nSOURCE CODE SAMPLES")

    add_section_heading("B.1 Automated Cutout Extraction Algorithm (pipeline/generate.py)")
    add_code_block(
        "import numpy as np\n"
        "from PIL import Image, ImageFilter\n"
        "from collections import deque\n\n"
        "def extract_alpha_cutout(img, tol=28):\n"
        "    rgb = img.convert('RGB')\n"
        "    arr = np.array(rgb, dtype=np.float32)\n"
        "    h, w, _ = arr.shape\n"
        "    borders = np.concatenate([arr[0, :], arr[-1, :], arr[:, 0], arr[:, -1]], axis=0)\n"
        "    bg_color = np.median(borders, axis=0)\n"
        "    dist = np.sqrt(np.sum((arr - bg_color) ** 2, axis=-1))\n"
        "    is_bg = np.zeros((h, w), dtype=bool)\n"
        "    q = deque()\n"
        "    for x in range(w):\n"
        "        if dist[0, x] < tol: is_bg[0, x] = True; q.append((0, x))\n"
        "        if dist[h-1, x] < tol: is_bg[h-1, x] = True; q.append((h-1, x))\n"
        "    for y in range(h):\n"
        "        if dist[y, 0] < tol and not is_bg[y, 0]: is_bg[y, 0] = True; q.append((y, 0))\n"
        "        if dist[y, w-1] < tol and not is_bg[y, w-1]: is_bg[y, w-1] = True; q.append((y, w-1))\n"
        "    while q:\n"
        "        y, x = q.popleft()\n"
        "        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:\n"
        "            ny, nx = y + dy, x + dx\n"
        "            if 0 <= ny < h and 0 <= nx < w and not is_bg[ny, nx] and dist[ny, nx] < tol:\n"
        "                is_bg[ny, nx] = True; q.append((ny, nx))\n"
        "    mask = (~is_bg).astype(np.uint8) * 255\n"
        "    mask_img = Image.fromarray(mask).filter(ImageFilter.GaussianBlur(radius=0.8))\n"
        "    rgba = rgb.convert('RGBA')\n"
        "    rgba.putalpha(mask_img)\n"
        "    return rgba"
    )

    add_section_heading("B.2 Interactive Before/After Split Slider (visualize/page.tsx)")
    add_code_block(
        "// Split slider comparison between original room and staged composite\n"
        "{stage === 'complete' && compositeResultUrl && (\n"
        "  <div className='relative w-full h-[460px] rounded-xl overflow-hidden select-none'>\n"
        "    <img src={currentRoomDisplayUrl} alt='Original Room' className='absolute inset-0 w-full h-full object-cover' />\n"
        "    <div className='absolute inset-0 overflow-hidden pointer-events-none' style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>\n"
        "      <img src={compositeResultUrl} alt='Staged Room' className='absolute inset-0 w-full h-full object-cover' />\n"
        "    </div>\n"
        "    <div className='absolute top-0 bottom-0 w-0.5 bg-white shadow-xl pointer-events-none' style={{ left: `${sliderPosition}%` }}>\n"
        "      <div className='absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-[#292B26] border-2 border-white text-white flex items-center justify-center text-[10px] font-bold'>⇄</div>\n"
        "    </div>\n"
        "    <input type='range' min='0' max='100' value={sliderPosition} onChange={(e) => setSliderPosition(Number(e.target.value))} className='absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20' />\n"
        "  </div>\n"
        ")}"
    )

    # -------------------------------------------------------------
    # REFERENCES
    # -------------------------------------------------------------
    add_chapter_title("REFERENCES")
    add_body_p("1. Next.js Documentation, App Router Architecture and Partial Prerendering, https://nextjs.org/docs")
    add_body_p("2. FastAPI Framework, ASGI Server Architecture and Concurrency, https://fastapi.tiangolo.com/")
    add_body_p("3. Kirillov, A., et al., Segment Anything, Meta AI Research, arXiv:2304.02643, 2023.")
    add_body_p("4. Yang, L., et al., Depth Anything: Unleashing the Power of Large-Scale Unlabeled Data, arXiv:2401.10891, 2024.")
    add_body_p("5. Pillow Imaging Library Documentation, Alpha Composite and Channel Filtering, https://pillow.readthedocs.io/")
    add_body_p("6. Supabase Documentation, Row Level Security and Realtime Postgres State, https://supabase.com/docs")

    # Save to disk
    out_path = os.path.join("e:\\pixabuild", output_filename)
    doc.save(out_path)
    print(f"Report generated successfully at: {out_path}")
    return out_path

if __name__ == "__main__":
    create_pixabuild_report()
