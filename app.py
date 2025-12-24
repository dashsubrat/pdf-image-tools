"""
PDF Tools Web Application
A Flask-based web application for various PDF operations.
"""

from flask import Flask, render_template, request, send_file, jsonify, after_this_request
from pypdf import PdfReader, PdfWriter
from werkzeug.utils import secure_filename
from PIL import Image
import os
import uuid
import tempfile
import shutil
from datetime import datetime
import zipfile
import io

app = Flask(__name__)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max total upload
app.config['UPLOAD_FOLDER'] = tempfile.mkdtemp()
ALLOWED_PDF_EXTENSIONS = {'pdf'}
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'}


def allowed_file(filename, allowed_extensions):
    """Check if file has allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def get_session_folder():
    """Create and return a unique session folder."""
    session_id = str(uuid.uuid4())
    session_folder = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    os.makedirs(session_folder, exist_ok=True)
    return session_id, session_folder


# ============== MERGE PDF ==============
def merge_pdfs(pdf_files, output_path):
    """Merge multiple PDF files into a single PDF."""
    writer = PdfWriter()
    total_pages = 0

    try:
        for pdf_file in pdf_files:
            if not os.path.exists(pdf_file):
                return False, f"File not found: {pdf_file}", 0

            reader = PdfReader(pdf_file)
            for page in reader.pages:
                writer.add_page(page)
                total_pages += 1

        with open(output_path, "wb") as output_file:
            writer.write(output_file)

        return True, "PDFs merged successfully!", total_pages

    except Exception as e:
        return False, f"Error merging PDFs: {str(e)}", 0


# ============== SPLIT PDF ==============
def split_pdf(pdf_path, split_mode, split_value, output_folder):
    """
    Split PDF based on mode.
    Modes: 'all' (each page), 'range' (specific pages), 'chunks' (every N pages)
    """
    try:
        reader = PdfReader(pdf_path)
        total_pages = len(reader.pages)
        output_files = []

        if split_mode == 'all':
            # Split into individual pages
            for i, page in enumerate(reader.pages):
                writer = PdfWriter()
                writer.add_page(page)
                output_path = os.path.join(output_folder, f"page_{i + 1}.pdf")
                with open(output_path, "wb") as f:
                    writer.write(f)
                output_files.append(output_path)

        elif split_mode == 'range':
            # Extract specific page ranges (e.g., "1-3,5,7-9")
            ranges = split_value.split(',')
            writer = PdfWriter()
            extracted_pages = []

            for r in ranges:
                r = r.strip()
                if '-' in r:
                    start, end = map(int, r.split('-'))
                    for p in range(start, min(end + 1, total_pages + 1)):
                        if p > 0 and p <= total_pages and p not in extracted_pages:
                            writer.add_page(reader.pages[p - 1])
                            extracted_pages.append(p)
                else:
                    p = int(r)
                    if p > 0 and p <= total_pages and p not in extracted_pages:
                        writer.add_page(reader.pages[p - 1])
                        extracted_pages.append(p)

            output_path = os.path.join(output_folder, "extracted_pages.pdf")
            with open(output_path, "wb") as f:
                writer.write(f)
            output_files.append(output_path)

        elif split_mode == 'chunks':
            # Split into chunks of N pages
            chunk_size = int(split_value)
            for i in range(0, total_pages, chunk_size):
                writer = PdfWriter()
                for j in range(i, min(i + chunk_size, total_pages)):
                    writer.add_page(reader.pages[j])

                chunk_num = (i // chunk_size) + 1
                output_path = os.path.join(output_folder, f"chunk_{chunk_num}.pdf")
                with open(output_path, "wb") as f:
                    writer.write(f)
                output_files.append(output_path)

        return True, "PDF split successfully!", output_files, total_pages

    except Exception as e:
        return False, f"Error splitting PDF: {str(e)}", [], 0


# ============== COMPRESS PDF ==============
def compress_pdf(pdf_path, output_path, compression_level='medium'):
    """
    Compress PDF by removing duplication and compressing streams.
    compression_level: 'low', 'medium', 'high'
    """
    try:
        reader = PdfReader(pdf_path)
        writer = PdfWriter()

        for page in reader.pages:
            page.compress_content_streams()
            writer.add_page(page)

        # Remove duplication
        writer.add_metadata(reader.metadata or {})

        with open(output_path, "wb") as f:
            writer.write(f)

        original_size = os.path.getsize(pdf_path)
        compressed_size = os.path.getsize(output_path)
        reduction = ((original_size - compressed_size) / original_size) * 100

        return True, "PDF compressed successfully!", original_size, compressed_size, reduction

    except Exception as e:
        return False, f"Error compressing PDF: {str(e)}", 0, 0, 0


# ============== ROTATE PDF ==============
def rotate_pdf(pdf_path, output_path, rotation, pages='all'):
    """
    Rotate PDF pages.
    rotation: 90, 180, 270
    pages: 'all' or comma-separated page numbers (e.g., '1,3,5')
    """
    try:
        reader = PdfReader(pdf_path)
        writer = PdfWriter()
        total_pages = len(reader.pages)

        # Parse pages to rotate
        if pages == 'all':
            pages_to_rotate = set(range(total_pages))
        else:
            pages_to_rotate = set()
            for p in pages.split(','):
                p = p.strip()
                if p.isdigit():
                    page_num = int(p) - 1  # Convert to 0-indexed
                    if 0 <= page_num < total_pages:
                        pages_to_rotate.add(page_num)

        for i, page in enumerate(reader.pages):
            if i in pages_to_rotate:
                page.rotate(int(rotation))
            writer.add_page(page)

        with open(output_path, "wb") as f:
            writer.write(f)

        return True, "PDF rotated successfully!", total_pages, len(pages_to_rotate)

    except Exception as e:
        return False, f"Error rotating PDF: {str(e)}", 0, 0


# ============== EXTRACT PAGES ==============
def extract_pages(pdf_path, output_path, page_selection):
    """
    Extract specific pages from PDF.
    page_selection: e.g., '1-3,5,7-9'
    """
    try:
        reader = PdfReader(pdf_path)
        writer = PdfWriter()
        total_pages = len(reader.pages)
        extracted_count = 0

        # Parse page selection
        ranges = page_selection.split(',')
        extracted_pages = []

        for r in ranges:
            r = r.strip()
            if '-' in r:
                start, end = map(int, r.split('-'))
                for p in range(start, min(end + 1, total_pages + 1)):
                    if p > 0 and p <= total_pages and p not in extracted_pages:
                        writer.add_page(reader.pages[p - 1])
                        extracted_pages.append(p)
                        extracted_count += 1
            else:
                p = int(r)
                if p > 0 and p <= total_pages and p not in extracted_pages:
                    writer.add_page(reader.pages[p - 1])
                    extracted_pages.append(p)
                    extracted_count += 1

        if extracted_count == 0:
            return False, "No valid pages selected", 0, 0

        with open(output_path, "wb") as f:
            writer.write(f)

        return True, "Pages extracted successfully!", total_pages, extracted_count

    except Exception as e:
        return False, f"Error extracting pages: {str(e)}", 0, 0


# ============== IMAGES TO PDF ==============
def images_to_pdf(image_paths, output_path, page_size='A4'):
    """
    Convert multiple images to a single PDF.
    """
    try:
        # Page sizes in points (72 points = 1 inch)
        page_sizes = {
            'A4': (595, 842),
            'Letter': (612, 792),
            'Legal': (612, 1008),
            'A3': (842, 1191),
            'Fit': None  # Use image size
        }

        images = []
        for img_path in image_paths:
            img = Image.open(img_path)

            # Convert to RGB if necessary (for PNG with transparency, etc.)
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            images.append(img)

        if not images:
            return False, "No valid images found", 0

        # Save as PDF
        first_image = images[0]
        if len(images) > 1:
            first_image.save(
                output_path,
                'PDF',
                save_all=True,
                append_images=images[1:],
                resolution=100.0
            )
        else:
            first_image.save(output_path, 'PDF', resolution=100.0)

        # Clean up
        for img in images:
            img.close()

        return True, "Images converted to PDF successfully!", len(images)

    except Exception as e:
        return False, f"Error converting images: {str(e)}", 0


# ============== COMPRESS IMAGE ==============
def compress_image(image_path, output_path, quality=75):
    """
    Compress an image by reducing quality.
    quality: 1-100 (higher = better quality, larger file)
    """
    try:
        img = Image.open(image_path)
        original_size = os.path.getsize(image_path)

        # Get the format
        img_format = img.format or 'JPEG'
        if img_format.upper() == 'JPG':
            img_format = 'JPEG'

        # Convert to RGB if necessary for JPEG
        if img_format == 'JPEG' and img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[-1])
            else:
                background.paste(img)
            img = background
        elif img.mode not in ('RGB', 'L') and img_format == 'JPEG':
            img = img.convert('RGB')

        # Save with compression
        if img_format in ('JPEG', 'JPG'):
            img.save(output_path, 'JPEG', quality=quality, optimize=True)
        elif img_format == 'PNG':
            img.save(output_path, 'PNG', optimize=True)
        elif img_format == 'WEBP':
            img.save(output_path, 'WEBP', quality=quality)
        else:
            img.save(output_path, img_format, quality=quality)

        img.close()
        compressed_size = os.path.getsize(output_path)
        reduction = ((original_size - compressed_size) / original_size) * 100 if original_size > 0 else 0

        return True, "Image compressed successfully!", original_size, compressed_size, max(0, reduction)

    except Exception as e:
        return False, f"Error compressing image: {str(e)}", 0, 0, 0


# ============== RESIZE IMAGE ==============
def resize_image(image_path, output_path, width=None, height=None, maintain_aspect=True):
    """
    Resize an image to specified dimensions.
    """
    try:
        img = Image.open(image_path)
        original_width, original_height = img.size
        img_format = img.format or 'JPEG'

        # Calculate new dimensions
        if maintain_aspect:
            if width and height:
                # Fit within both dimensions
                ratio = min(width / original_width, height / original_height)
                new_width = int(original_width * ratio)
                new_height = int(original_height * ratio)
            elif width:
                ratio = width / original_width
                new_width = width
                new_height = int(original_height * ratio)
            elif height:
                ratio = height / original_height
                new_width = int(original_width * ratio)
                new_height = height
            else:
                new_width, new_height = original_width, original_height
        else:
            new_width = width or original_width
            new_height = height or original_height

        # Resize using high-quality resampling
        resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Save in original format
        if img_format.upper() in ('JPG', 'JPEG'):
            if resized_img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', resized_img.size, (255, 255, 255))
                if resized_img.mode == 'P':
                    resized_img = resized_img.convert('RGBA')
                if resized_img.mode == 'RGBA':
                    background.paste(resized_img, mask=resized_img.split()[-1])
                else:
                    background.paste(resized_img)
                resized_img = background
            resized_img.save(output_path, 'JPEG', quality=90)
        else:
            resized_img.save(output_path, img_format)

        img.close()
        resized_img.close()

        return True, "Image resized successfully!", (original_width, original_height), (new_width, new_height)

    except Exception as e:
        return False, f"Error resizing image: {str(e)}", (0, 0), (0, 0)


# ============== CONVERT IMAGE ==============
def convert_image(image_path, output_path, output_format='jpg'):
    """
    Convert image to a different format.
    output_format: 'jpg', 'png', 'webp'
    """
    try:
        img = Image.open(image_path)
        original_format = img.format or 'UNKNOWN'

        # Convert to appropriate mode for target format
        if output_format.lower() in ('jpg', 'jpeg'):
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[-1])
                else:
                    background.paste(img)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            img.save(output_path, 'JPEG', quality=90)
        elif output_format.lower() == 'png':
            img.save(output_path, 'PNG')
        elif output_format.lower() == 'webp':
            if img.mode == 'P':
                img = img.convert('RGBA')
            img.save(output_path, 'WEBP', quality=90)
        else:
            img.save(output_path)

        file_size = os.path.getsize(output_path)
        img.close()

        return True, "Image converted successfully!", original_format, output_format.upper(), file_size

    except Exception as e:
        return False, f"Error converting image: {str(e)}", "", "", 0


# ============== CROP IMAGE ==============
def crop_image(image_path, output_path, x, y, width, height):
    """
    Crop an image to specified region.
    x, y: top-left corner coordinates
    width, height: dimensions of crop area
    """
    try:
        img = Image.open(image_path)
        img_format = img.format or 'JPEG'
        original_width, original_height = img.size

        # Validate crop coordinates
        x = max(0, min(x, original_width))
        y = max(0, min(y, original_height))
        right = min(x + width, original_width)
        bottom = min(y + height, original_height)

        # Crop the image
        cropped_img = img.crop((x, y, right, bottom))
        crop_width, crop_height = cropped_img.size

        # Save in original format
        if img_format.upper() in ('JPG', 'JPEG'):
            if cropped_img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', cropped_img.size, (255, 255, 255))
                if cropped_img.mode == 'P':
                    cropped_img = cropped_img.convert('RGBA')
                if cropped_img.mode == 'RGBA':
                    background.paste(cropped_img, mask=cropped_img.split()[-1])
                else:
                    background.paste(cropped_img)
                cropped_img = background
            cropped_img.save(output_path, 'JPEG', quality=90)
        else:
            cropped_img.save(output_path, img_format)

        img.close()
        cropped_img.close()

        return True, "Image cropped successfully!", (original_width, original_height), (crop_width, crop_height)

    except Exception as e:
        return False, f"Error cropping image: {str(e)}", (0, 0), (0, 0)


# ============== WATERMARK IMAGE ==============
def watermark_image(image_path, output_path, text, position='bottom-right', opacity=128):
    """
    Add text watermark to an image.
    position: 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'
    """
    try:
        from PIL import ImageDraw, ImageFont

        img = Image.open(image_path)
        img_format = img.format or 'JPEG'

        # Convert to RGBA for watermark
        if img.mode != 'RGBA':
            img = img.convert('RGBA')

        # Create watermark layer
        watermark_layer = Image.new('RGBA', img.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(watermark_layer)

        # Try to use a better font, fall back to default
        try:
            font_size = max(20, min(img.size) // 20)
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size)
            except:
                font = ImageFont.load_default()

        # Get text bounding box
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        # Calculate position
        padding = 20
        if position == 'top-left':
            pos = (padding, padding)
        elif position == 'top-right':
            pos = (img.size[0] - text_width - padding, padding)
        elif position == 'bottom-left':
            pos = (padding, img.size[1] - text_height - padding)
        elif position == 'bottom-right':
            pos = (img.size[0] - text_width - padding, img.size[1] - text_height - padding)
        elif position == 'center':
            pos = ((img.size[0] - text_width) // 2, (img.size[1] - text_height) // 2)
        else:
            pos = (img.size[0] - text_width - padding, img.size[1] - text_height - padding)

        # Draw watermark
        draw.text(pos, text, font=font, fill=(255, 255, 255, opacity))

        # Composite the watermark
        watermarked = Image.alpha_composite(img, watermark_layer)

        # Convert back to RGB for JPEG
        if img_format.upper() in ('JPG', 'JPEG'):
            watermarked = watermarked.convert('RGB')
            watermarked.save(output_path, 'JPEG', quality=90)
        elif img_format.upper() == 'PNG':
            watermarked.save(output_path, 'PNG')
        else:
            watermarked = watermarked.convert('RGB')
            watermarked.save(output_path, img_format)

        img.close()
        watermarked.close()

        return True, "Watermark added successfully!", text, position

    except Exception as e:
        return False, f"Error adding watermark: {str(e)}", "", ""


# ============== ROTATE IMAGE ==============
def rotate_image_file(image_path, output_path, rotation=90, flip_horizontal=False, flip_vertical=False):
    """
    Rotate and/or flip an image.
    rotation: 90, 180, 270
    """
    try:
        img = Image.open(image_path)
        img_format = img.format or 'JPEG'
        original_size = img.size

        # Apply rotation
        if rotation == 90:
            img = img.transpose(Image.Transpose.ROTATE_270)
        elif rotation == 180:
            img = img.transpose(Image.Transpose.ROTATE_180)
        elif rotation == 270:
            img = img.transpose(Image.Transpose.ROTATE_90)

        # Apply flips
        if flip_horizontal:
            img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if flip_vertical:
            img = img.transpose(Image.Transpose.FLIP_TOP_BOTTOM)

        new_size = img.size

        # Save in original format
        if img_format.upper() in ('JPG', 'JPEG'):
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[-1])
                else:
                    background.paste(img)
                img = background
            img.save(output_path, 'JPEG', quality=90)
        else:
            img.save(output_path, img_format)

        img.close()

        return True, "Image rotated successfully!", original_size, new_size, rotation

    except Exception as e:
        return False, f"Error rotating image: {str(e)}", (0, 0), (0, 0), 0


# ============== ROUTES ==============

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')


@app.route('/merge', methods=['POST'])
def merge():
    """Handle PDF merge request."""
    if 'files[]' not in request.files:
        return jsonify({'success': False, 'error': 'No files uploaded'}), 400

    files = request.files.getlist('files[]')

    if len(files) < 2:
        return jsonify({'success': False, 'error': 'Please upload at least 2 PDF files'}), 400

    session_id, session_folder = get_session_folder()
    saved_files = []

    try:
        for file in files:
            if file and file.filename and allowed_file(file.filename, ALLOWED_PDF_EXTENSIONS):
                filename = secure_filename(file.filename)
                indexed_filename = f"{len(saved_files):03d}_{filename}"
                filepath = os.path.join(session_folder, indexed_filename)
                file.save(filepath)
                saved_files.append(filepath)
            else:
                shutil.rmtree(session_folder, ignore_errors=True)
                return jsonify({
                    'success': False,
                    'error': f'Invalid file: {file.filename}. Only PDF files are allowed.'
                }), 400

        if len(saved_files) < 2:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': 'Please upload at least 2 valid PDF files'}), 400

        saved_files.sort()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"merged_{timestamp}.pdf"
        output_path = os.path.join(session_folder, output_filename)

        success, message, total_pages = merge_pdfs(saved_files, output_path)

        if not success:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': message}), 500

        file_size = os.path.getsize(output_path)

        return jsonify({
            'success': True,
            'message': message,
            'session_id': session_id,
            'filename': output_filename,
            'total_pages': total_pages,
            'file_size': file_size,
            'files_merged': len(saved_files)
        })

    except Exception as e:
        shutil.rmtree(session_folder, ignore_errors=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/split', methods=['POST'])
def split():
    """Handle PDF split request."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400

    file = request.files['file']
    split_mode = request.form.get('mode', 'all')
    split_value = request.form.get('value', '')

    if not file or not file.filename:
        return jsonify({'success': False, 'error': 'No file selected'}), 400

    if not allowed_file(file.filename, ALLOWED_PDF_EXTENSIONS):
        return jsonify({'success': False, 'error': 'Only PDF files are allowed'}), 400

    session_id, session_folder = get_session_folder()
    output_folder = os.path.join(session_folder, 'output')
    os.makedirs(output_folder, exist_ok=True)

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(session_folder, filename)
        file.save(filepath)

        success, message, output_files, total_pages = split_pdf(
            filepath, split_mode, split_value, output_folder
        )

        if not success:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': message}), 500

        # If multiple files, create a zip
        if len(output_files) > 1:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            zip_filename = f"split_{timestamp}.zip"
            zip_path = os.path.join(session_folder, zip_filename)

            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                for f in output_files:
                    zf.write(f, os.path.basename(f))

            file_size = os.path.getsize(zip_path)
            return jsonify({
                'success': True,
                'message': message,
                'session_id': session_id,
                'filename': zip_filename,
                'total_pages': total_pages,
                'files_created': len(output_files),
                'file_size': file_size,
                'is_zip': True
            })
        else:
            output_filename = os.path.basename(output_files[0])
            # Move file to session folder root
            final_path = os.path.join(session_folder, output_filename)
            shutil.move(output_files[0], final_path)

            file_size = os.path.getsize(final_path)
            return jsonify({
                'success': True,
                'message': message,
                'session_id': session_id,
                'filename': output_filename,
                'total_pages': total_pages,
                'files_created': 1,
                'file_size': file_size,
                'is_zip': False
            })

    except Exception as e:
        shutil.rmtree(session_folder, ignore_errors=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/compress', methods=['POST'])
def compress():
    """Handle PDF compression request."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400

    file = request.files['file']
    compression_level = request.form.get('level', 'medium')

    if not file or not file.filename:
        return jsonify({'success': False, 'error': 'No file selected'}), 400

    if not allowed_file(file.filename, ALLOWED_PDF_EXTENSIONS):
        return jsonify({'success': False, 'error': 'Only PDF files are allowed'}), 400

    session_id, session_folder = get_session_folder()

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(session_folder, filename)
        file.save(filepath)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"compressed_{timestamp}.pdf"
        output_path = os.path.join(session_folder, output_filename)

        success, message, original_size, compressed_size, reduction = compress_pdf(
            filepath, output_path, compression_level
        )

        if not success:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': message}), 500

        return jsonify({
            'success': True,
            'message': message,
            'session_id': session_id,
            'filename': output_filename,
            'original_size': original_size,
            'compressed_size': compressed_size,
            'reduction': round(reduction, 1),
            'file_size': compressed_size
        })

    except Exception as e:
        shutil.rmtree(session_folder, ignore_errors=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/rotate', methods=['POST'])
def rotate():
    """Handle PDF rotation request."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400

    file = request.files['file']
    rotation = request.form.get('rotation', '90')
    pages = request.form.get('pages', 'all')

    if not file or not file.filename:
        return jsonify({'success': False, 'error': 'No file selected'}), 400

    if not allowed_file(file.filename, ALLOWED_PDF_EXTENSIONS):
        return jsonify({'success': False, 'error': 'Only PDF files are allowed'}), 400

    session_id, session_folder = get_session_folder()

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(session_folder, filename)
        file.save(filepath)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"rotated_{timestamp}.pdf"
        output_path = os.path.join(session_folder, output_filename)

        success, message, total_pages, rotated_pages = rotate_pdf(
            filepath, output_path, rotation, pages
        )

        if not success:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': message}), 500

        file_size = os.path.getsize(output_path)

        return jsonify({
            'success': True,
            'message': message,
            'session_id': session_id,
            'filename': output_filename,
            'total_pages': total_pages,
            'rotated_pages': rotated_pages,
            'file_size': file_size
        })

    except Exception as e:
        shutil.rmtree(session_folder, ignore_errors=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/extract', methods=['POST'])
def extract():
    """Handle page extraction request."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400

    file = request.files['file']
    page_selection = request.form.get('pages', '1')

    if not file or not file.filename:
        return jsonify({'success': False, 'error': 'No file selected'}), 400

    if not allowed_file(file.filename, ALLOWED_PDF_EXTENSIONS):
        return jsonify({'success': False, 'error': 'Only PDF files are allowed'}), 400

    session_id, session_folder = get_session_folder()

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(session_folder, filename)
        file.save(filepath)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"extracted_{timestamp}.pdf"
        output_path = os.path.join(session_folder, output_filename)

        success, message, total_pages, extracted_count = extract_pages(
            filepath, output_path, page_selection
        )

        if not success:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': message}), 500

        file_size = os.path.getsize(output_path)

        return jsonify({
            'success': True,
            'message': message,
            'session_id': session_id,
            'filename': output_filename,
            'total_pages': total_pages,
            'extracted_pages': extracted_count,
            'file_size': file_size
        })

    except Exception as e:
        shutil.rmtree(session_folder, ignore_errors=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/images-to-pdf', methods=['POST'])
def images_to_pdf_route():
    """Handle images to PDF conversion request."""
    if 'files[]' not in request.files:
        return jsonify({'success': False, 'error': 'No files uploaded'}), 400

    files = request.files.getlist('files[]')
    page_size = request.form.get('pageSize', 'A4')

    if len(files) < 1:
        return jsonify({'success': False, 'error': 'Please upload at least 1 image'}), 400

    session_id, session_folder = get_session_folder()
    saved_files = []

    try:
        for file in files:
            if file and file.filename and allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
                filename = secure_filename(file.filename)
                indexed_filename = f"{len(saved_files):03d}_{filename}"
                filepath = os.path.join(session_folder, indexed_filename)
                file.save(filepath)
                saved_files.append(filepath)
            else:
                shutil.rmtree(session_folder, ignore_errors=True)
                return jsonify({
                    'success': False,
                    'error': f'Invalid file: {file.filename}. Only image files are allowed.'
                }), 400

        if len(saved_files) < 1:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': 'Please upload at least 1 valid image'}), 400

        saved_files.sort()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"images_to_pdf_{timestamp}.pdf"
        output_path = os.path.join(session_folder, output_filename)

        success, message, image_count = images_to_pdf(saved_files, output_path, page_size)

        if not success:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': message}), 500

        file_size = os.path.getsize(output_path)

        return jsonify({
            'success': True,
            'message': message,
            'session_id': session_id,
            'filename': output_filename,
            'images_converted': image_count,
            'file_size': file_size
        })

    except Exception as e:
        shutil.rmtree(session_folder, ignore_errors=True)
        return jsonify({'success': False, 'error': str(e)}), 500


# ============== IMAGE TOOLS ROUTES ==============

@app.route('/compress-image', methods=['POST'])
def compress_image_route():
    """Handle image compression request."""
    if 'files[]' not in request.files:
        return jsonify({'success': False, 'error': 'No files uploaded'}), 400

    files = request.files.getlist('files[]')
    quality = int(request.form.get('quality', 75))

    if len(files) < 1:
        return jsonify({'success': False, 'error': 'Please upload at least 1 image'}), 400

    session_id, session_folder = get_session_folder()
    output_folder = os.path.join(session_folder, 'output')
    os.makedirs(output_folder, exist_ok=True)

    try:
        results = []
        total_original = 0
        total_compressed = 0

        for file in files:
            if file and file.filename and allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
                filename = secure_filename(file.filename)
                filepath = os.path.join(session_folder, filename)
                file.save(filepath)

                # Get file extension
                ext = filename.rsplit('.', 1)[1].lower()
                output_filename = f"compressed_{filename}"
                output_path = os.path.join(output_folder, output_filename)

                success, message, orig_size, comp_size, reduction = compress_image(
                    filepath, output_path, quality
                )

                if success:
                    total_original += orig_size
                    total_compressed += comp_size
                    results.append(output_path)

        if len(results) == 0:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': 'No images could be compressed'}), 500

        # If multiple files, create a zip
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if len(results) > 1:
            zip_filename = f"compressed_images_{timestamp}.zip"
            zip_path = os.path.join(session_folder, zip_filename)

            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                for f in results:
                    zf.write(f, os.path.basename(f))

            file_size = os.path.getsize(zip_path)
            output_filename = zip_filename
        else:
            output_filename = os.path.basename(results[0])
            final_path = os.path.join(session_folder, output_filename)
            shutil.move(results[0], final_path)
            file_size = os.path.getsize(final_path)

        reduction = ((total_original - total_compressed) / total_original * 100) if total_original > 0 else 0

        return jsonify({
            'success': True,
            'message': 'Images compressed successfully!',
            'session_id': session_id,
            'filename': output_filename,
            'original_size': total_original,
            'compressed_size': total_compressed,
            'reduction': round(max(0, reduction), 1),
            'file_size': file_size,
            'images_processed': len(results)
        })

    except Exception as e:
        shutil.rmtree(session_folder, ignore_errors=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/resize-image', methods=['POST'])
def resize_image_route():
    """Handle image resize request."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400

    file = request.files['file']
    width = request.form.get('width')
    height = request.form.get('height')
    maintain_aspect = request.form.get('maintainAspect', 'true').lower() == 'true'

    width = int(width) if width and width.isdigit() else None
    height = int(height) if height and height.isdigit() else None

    if not width and not height:
        return jsonify({'success': False, 'error': 'Please specify width or height'}), 400

    if not file or not file.filename:
        return jsonify({'success': False, 'error': 'No file selected'}), 400

    if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        return jsonify({'success': False, 'error': 'Only image files are allowed'}), 400

    session_id, session_folder = get_session_folder()

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(session_folder, filename)
        file.save(filepath)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = filename.rsplit('.', 1)[1].lower()
        output_filename = f"resized_{timestamp}.{ext}"
        output_path = os.path.join(session_folder, output_filename)

        success, message, original_size, new_size = resize_image(
            filepath, output_path, width, height, maintain_aspect
        )

        if not success:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': message}), 500

        file_size = os.path.getsize(output_path)

        return jsonify({
            'success': True,
            'message': message,
            'session_id': session_id,
            'filename': output_filename,
            'original_dimensions': f"{original_size[0]}x{original_size[1]}",
            'new_dimensions': f"{new_size[0]}x{new_size[1]}",
            'file_size': file_size
        })

    except Exception as e:
        shutil.rmtree(session_folder, ignore_errors=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/convert-image', methods=['POST'])
def convert_image_route():
    """Handle image format conversion request."""
    if 'files[]' not in request.files:
        return jsonify({'success': False, 'error': 'No files uploaded'}), 400

    files = request.files.getlist('files[]')
    output_format = request.form.get('format', 'jpg')

    if len(files) < 1:
        return jsonify({'success': False, 'error': 'Please upload at least 1 image'}), 400

    session_id, session_folder = get_session_folder()
    output_folder = os.path.join(session_folder, 'output')
    os.makedirs(output_folder, exist_ok=True)

    try:
        results = []

        for file in files:
            if file and file.filename and allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
                filename = secure_filename(file.filename)
                filepath = os.path.join(session_folder, filename)
                file.save(filepath)

                # Create output filename with new extension
                base_name = filename.rsplit('.', 1)[0]
                output_filename = f"{base_name}.{output_format}"
                output_path = os.path.join(output_folder, output_filename)

                success, message, orig_fmt, new_fmt, size = convert_image(
                    filepath, output_path, output_format
                )

                if success:
                    results.append(output_path)

        if len(results) == 0:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': 'No images could be converted'}), 500

        # If multiple files, create a zip
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if len(results) > 1:
            zip_filename = f"converted_images_{timestamp}.zip"
            zip_path = os.path.join(session_folder, zip_filename)

            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                for f in results:
                    zf.write(f, os.path.basename(f))

            file_size = os.path.getsize(zip_path)
            final_filename = zip_filename
        else:
            final_filename = os.path.basename(results[0])
            final_path = os.path.join(session_folder, final_filename)
            shutil.move(results[0], final_path)
            file_size = os.path.getsize(final_path)

        return jsonify({
            'success': True,
            'message': 'Images converted successfully!',
            'session_id': session_id,
            'filename': final_filename,
            'output_format': output_format.upper(),
            'file_size': file_size,
            'images_converted': len(results)
        })

    except Exception as e:
        shutil.rmtree(session_folder, ignore_errors=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/crop-image', methods=['POST'])
def crop_image_route():
    """Handle image crop request."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400

    file = request.files['file']
    crop_area = request.form.get('cropArea', '0,0,100,100')

    try:
        parts = [int(p.strip()) for p in crop_area.split(',')]
        if len(parts) != 4:
            raise ValueError("Invalid crop area format")
        x, y, width, height = parts
    except:
        return jsonify({'success': False, 'error': 'Invalid crop area. Use format: x,y,width,height'}), 400

    if not file or not file.filename:
        return jsonify({'success': False, 'error': 'No file selected'}), 400

    if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        return jsonify({'success': False, 'error': 'Only image files are allowed'}), 400

    session_id, session_folder = get_session_folder()

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(session_folder, filename)
        file.save(filepath)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = filename.rsplit('.', 1)[1].lower()
        output_filename = f"cropped_{timestamp}.{ext}"
        output_path = os.path.join(session_folder, output_filename)

        success, message, original_size, crop_size = crop_image(
            filepath, output_path, x, y, width, height
        )

        if not success:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': message}), 500

        file_size = os.path.getsize(output_path)

        return jsonify({
            'success': True,
            'message': message,
            'session_id': session_id,
            'filename': output_filename,
            'original_dimensions': f"{original_size[0]}x{original_size[1]}",
            'crop_dimensions': f"{crop_size[0]}x{crop_size[1]}",
            'file_size': file_size
        })

    except Exception as e:
        shutil.rmtree(session_folder, ignore_errors=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/watermark-image', methods=['POST'])
def watermark_image_route():
    """Handle image watermark request."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400

    file = request.files['file']
    text = request.form.get('text', 'Watermark')
    position = request.form.get('position', 'bottom-right')

    if not text:
        return jsonify({'success': False, 'error': 'Please provide watermark text'}), 400

    if not file or not file.filename:
        return jsonify({'success': False, 'error': 'No file selected'}), 400

    if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        return jsonify({'success': False, 'error': 'Only image files are allowed'}), 400

    session_id, session_folder = get_session_folder()

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(session_folder, filename)
        file.save(filepath)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = filename.rsplit('.', 1)[1].lower()
        output_filename = f"watermarked_{timestamp}.{ext}"
        output_path = os.path.join(session_folder, output_filename)

        success, message, wm_text, wm_pos = watermark_image(
            filepath, output_path, text, position
        )

        if not success:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': message}), 500

        file_size = os.path.getsize(output_path)

        return jsonify({
            'success': True,
            'message': message,
            'session_id': session_id,
            'filename': output_filename,
            'watermark_text': wm_text,
            'watermark_position': wm_pos,
            'file_size': file_size
        })

    except Exception as e:
        shutil.rmtree(session_folder, ignore_errors=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/rotate-image', methods=['POST'])
def rotate_image_route():
    """Handle image rotation request."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400

    file = request.files['file']
    rotation = int(request.form.get('rotation', 90))
    flip_horizontal = request.form.get('flipHorizontal', 'false').lower() == 'true'
    flip_vertical = request.form.get('flipVertical', 'false').lower() == 'true'

    if not file or not file.filename:
        return jsonify({'success': False, 'error': 'No file selected'}), 400

    if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        return jsonify({'success': False, 'error': 'Only image files are allowed'}), 400

    session_id, session_folder = get_session_folder()

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(session_folder, filename)
        file.save(filepath)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = filename.rsplit('.', 1)[1].lower()
        output_filename = f"rotated_{timestamp}.{ext}"
        output_path = os.path.join(session_folder, output_filename)

        success, message, original_size, new_size, rot = rotate_image_file(
            filepath, output_path, rotation, flip_horizontal, flip_vertical
        )

        if not success:
            shutil.rmtree(session_folder, ignore_errors=True)
            return jsonify({'success': False, 'error': message}), 500

        file_size = os.path.getsize(output_path)

        return jsonify({
            'success': True,
            'message': message,
            'session_id': session_id,
            'filename': output_filename,
            'rotation': rot,
            'flipped_horizontal': flip_horizontal,
            'flipped_vertical': flip_vertical,
            'file_size': file_size
        })

    except Exception as e:
        shutil.rmtree(session_folder, ignore_errors=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/download/<session_id>/<filename>')
def download(session_id, filename):
    """Download the processed file."""
    session_id = secure_filename(session_id)
    filename = secure_filename(filename)

    session_folder = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    filepath = os.path.join(session_folder, filename)

    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404

    @after_this_request
    def cleanup(response):
        try:
            shutil.rmtree(session_folder, ignore_errors=True)
        except Exception:
            pass
        return response

    # Determine mimetype
    if filename.endswith('.zip'):
        mimetype = 'application/zip'
    else:
        mimetype = 'application/pdf'

    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
        mimetype=mimetype
    )


@app.errorhandler(413)
def too_large(e):
    """Handle file too large error."""
    return jsonify({
        'success': False,
        'error': 'File too large. Maximum total upload size is 100MB.'
    }), 413


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
