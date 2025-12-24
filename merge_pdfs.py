"""
PDF Merger Script
Merges two or more PDF files into a single PDF.
"""

from pypdf import PdfReader, PdfWriter
import sys
import os


def merge_pdfs(pdf_files: list, output_path: str) -> None:
    """
    Merge multiple PDF files into a single PDF.

    Args:
        pdf_files: List of paths to PDF files to merge (in order)
        output_path: Path for the output merged PDF
    """
    writer = PdfWriter()

    try:
        for pdf_file in pdf_files:
            if not os.path.exists(pdf_file):
                raise FileNotFoundError(f"File not found: {pdf_file}")

            print(f"Adding: {pdf_file}")
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                writer.add_page(page)

        with open(output_path, "wb") as output_file:
            writer.write(output_file)

        print(f"\nSuccessfully merged {len(pdf_files)} PDFs into: {output_path}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def main():
    if len(sys.argv) < 4:
        print("Usage: python merge_pdfs.py <pdf1> <pdf2> [pdf3 ...] <output.pdf>")
        print("\nExample:")
        print("  python merge_pdfs.py file1.pdf file2.pdf merged_output.pdf")
        sys.exit(1)

    # All arguments except the last one are input PDFs
    input_pdfs = sys.argv[1:-1]
    output_pdf = sys.argv[-1]

    merge_pdfs(input_pdfs, output_pdf)


if __name__ == "__main__":
    main()
