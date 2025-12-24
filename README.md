# PDF Merger - Web Application

A modern, user-friendly web application to merge multiple PDF files into a single document. Features a clean drag-and-drop interface with file reordering capabilities.

![PDF Merger](https://via.placeholder.com/800x400?text=PDF+Merger+Screenshot)

## Features

- 📁 **Drag & Drop Upload**: Simply drag PDF files onto the upload area
- 🔄 **Reorder Files**: Drag files in the list to change merge order
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🔒 **Secure**: Files are processed server-side and deleted immediately after download
- 💨 **Fast**: Efficient PDF processing with no watermarks
- 🆓 **100% Free**: No registration, no hidden fees

## Tech Stack

- **Backend**: Python 3.8+, Flask
- **PDF Processing**: PyPDF
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Production Server**: Gunicorn (Linux/Mac) or Waitress (Windows)

## Project Structure

```
mergepdf/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── css/
    │   └── style.css     # Stylesheet
    └── js/
        └── app.js        # Frontend JavaScript
```

## Local Development

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. **Clone or navigate to the project directory**:
   ```bash
   cd mergepdf
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the development server**:
   ```bash
   python app.py
   ```

5. **Open your browser** and navigate to:
   ```
   http://localhost:5000
   ```

## Deployment Options

### Option 1: Deploy to Render (Free Tier Available)

1. Create a `render.yaml` file in your project root:
   ```yaml
   services:
     - type: web
       name: pdf-merger
       env: python
       buildCommand: pip install -r requirements.txt
       startCommand: gunicorn app:app
       envVars:
         - key: PYTHON_VERSION
           value: 3.11.0
   ```

2. Push to GitHub and connect to [Render](https://render.com)

3. Create a new Web Service and select your repository

### Option 2: Deploy to Railway

1. Push your code to GitHub

2. Go to [Railway](https://railway.app) and create a new project

3. Select "Deploy from GitHub repo"

4. Railway will auto-detect Python and deploy

### Option 3: Deploy to Heroku

1. Create a `Procfile`:
   ```
   web: gunicorn app:app
   ```

2. Create a `runtime.txt`:
   ```
   python-3.11.0
   ```

3. Deploy using Heroku CLI:
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

### Option 4: Deploy to a VPS (DigitalOcean, AWS, etc.)

1. **SSH into your server**

2. **Install Python and pip**:
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip python3-venv nginx
   ```

3. **Clone your project**:
   ```bash
   git clone https://github.com/yourusername/pdf-merger.git
   cd pdf-merger
   ```

4. **Set up virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Create a systemd service** (`/etc/systemd/system/pdfmerger.service`):
   ```ini
   [Unit]
   Description=PDF Merger Web App
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/path/to/pdf-merger
   Environment="PATH=/path/to/pdf-merger/venv/bin"
   ExecStart=/path/to/pdf-merger/venv/bin/gunicorn --workers 3 --bind unix:pdfmerger.sock -m 007 app:app

   [Install]
   WantedBy=multi-user.target
   ```

6. **Configure Nginx** (`/etc/nginx/sites-available/pdfmerger`):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       client_max_body_size 50M;

       location / {
           include proxy_params;
           proxy_pass http://unix:/path/to/pdf-merger/pdfmerger.sock;
       }
   }
   ```

7. **Enable and start services**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pdfmerger /etc/nginx/sites-enabled
   sudo systemctl start pdfmerger
   sudo systemctl enable pdfmerger
   sudo systemctl restart nginx
   ```

### Option 5: Deploy with Docker

1. Create a `Dockerfile`:
   ```dockerfile
   FROM python:3.11-slim

   WORKDIR /app

   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   COPY . .

   EXPOSE 5000

   CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
   ```

2. Create a `.dockerignore`:
   ```
   __pycache__
   *.pyc
   venv
   .git
   *.pdf
   ```

3. Build and run:
   ```bash
   docker build -t pdf-merger .
   docker run -p 5000:5000 pdf-merger
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_CONTENT_LENGTH` | Maximum upload size in bytes | 50MB |
| `SECRET_KEY` | Flask secret key (set in production) | None |

### Production Considerations

1. **Set a secret key** in production:
   ```python
   app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key')
   ```

2. **Use HTTPS** in production (configure via reverse proxy)

3. **Set appropriate CORS headers** if needed

4. **Consider rate limiting** for public deployments

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Main web interface |
| POST | `/merge` | Upload and merge PDF files |
| GET | `/download/<session_id>/<filename>` | Download merged PDF |

### POST /merge

**Request**: `multipart/form-data` with `files[]` containing PDF files

**Response**:
```json
{
  "success": true,
  "message": "PDFs merged successfully!",
  "session_id": "uuid",
  "filename": "merged_20241210_123456.pdf",
  "total_pages": 10,
  "file_size": 524288,
  "files_merged": 3
}
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

If you encounter any issues or have suggestions, please open an issue on GitHub.

---

Made with ❤️ by [Your Name]
