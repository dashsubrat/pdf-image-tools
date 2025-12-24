"""
Script to create sample PDF files for testing the merge script.
Uses fpdf2 library to generate PDFs.
"""

from fpdf import FPDF


def create_sample_pdf(filename: str, title: str, content_lines: list, title_color: tuple = (0, 0, 0)):
    """
    Create a sample PDF file with given title and content.

    Args:
        filename: Output PDF filename
        title: Title text for the PDF
        content_lines: List of text lines to include
        title_color: RGB tuple for the title color (values 0-255)
    """
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Add title
    pdf.set_font("Helvetica", "B", 24)
    pdf.set_text_color(*title_color)
    pdf.cell(0, 20, title, ln=True, align="C")

    # Add spacing
    pdf.ln(10)

    # Add content
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(0, 0, 0)

    for line in content_lines:
        pdf.cell(0, 8, line, ln=True)

    # Add page number at bottom
    pdf.set_y(-30)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 10, f"Page 1 - {title}", align="C")

    pdf.output(filename)
    print(f"Created: {filename}")


def main():
    # Create first sample PDF
    create_sample_pdf(
        filename="sample1.pdf",
        title="Sample PDF Document 1",
        content_lines=[
            "This is the first sample PDF document.",
            "It was created to test the PDF merger script.",
            "",
            "Features of this document:",
            "  - Simple text content",
            "  - Single page layout",
            "  - Standard letter size",
            "",
            "This document should appear first in the merged output."
        ],
        title_color=(51, 102, 204)  # Blue title
    )

    # Create second sample PDF
    create_sample_pdf(
        filename="sample2.pdf",
        title="Sample PDF Document 2",
        content_lines=[
            "This is the second sample PDF document.",
            "It will be merged with the first document.",
            "",
            "Contents:",
            "  - Additional test content",
            "  - Different title color",
            "  - Same page structure",
            "",
            "This document should appear second in the merged output."
        ],
        title_color=(204, 51, 51)  # Red title
    )

    print("\n" + "=" * 50)
    print("Sample PDFs created successfully!")
    print("=" * 50)
    print("\nTo merge them, run:")
    print("  python merge_pdfs.py sample1.pdf sample2.pdf merged_output.pdf")


if __name__ == "__main__":
    main()
