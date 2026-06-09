# 🎓 Certify AI - Smart Certificate Generator

**Certify AI** is an intelligent, fully automated web application designed to eliminate the manual effort involved in configuring and issuing certificates. By leveraging advanced Vision AI, the platform allows users to upload blank certificate templates, automatically detects where dynamic data should go, and provides a seamless interface for generating and sharing perfectly aligned, high-quality certificates in real-time.

---

## ✨ Core Features

*   🤖 **AI-Powered Auto-Detection:** Upload any blank certificate design, and the integrated Google Gemini Vision AI will automatically scan the image, identify blank lines, and generate the correct fields (e.g., Recipient Name, Issue Date, Signatures) along with their exact coordinates.
*   🎨 **Interactive Configuration Engine:** An intuitive drag-and-drop canvas (powered by React-Konva) allows users to visually tweak the AI's suggestions, add custom fields, dynamically resize fonts, and choose font colors.
*   ⚡ **Real-Time Live Preview:** As users type the recipient's details into the form, the certificate renders instantly on the screen, showing exactly what the final output will look like.
*   🎯 **Smart Text Alignment Engine:** Uses Center-Anchoring to ensure that regardless of whether a user inputs a very short name or a very long name, the text expands symmetrically and stays perfectly centered over the certificate lines.
*   🔒 **Secure Authentication System:** Built-in JWT-based login and registration system to protect templates and configurations from unauthorized access.
*   ☁️ **Cloud-Native Architecture:** 
    *   **Cloudinary** integration guarantees secure, highly available image serving.
    *   **Aiven MySQL** ensures data integrity and reliable cloud connectivity.
*   📤 **High-Quality Export & Sharing:** Download certificates locally as high-resolution PNGs or standard PDFs, or use the native "Share via WhatsApp" integration for instant mobile distribution.

---

## 🛠️ Technology Stack

**Frontend (Client)**
*   **Framework:** React (Vite)
*   **UI Library:** Material-UI (MUI) v5
*   **Canvas Engine:** React-Konva (for live preview and drag-and-drop configuration)
*   **Routing:** React Router v6
*   **Network:** Axios

**Backend (Server)**
*   **Framework:** Python FastAPI
*   **ORM:** SQLAlchemy
*   **Database:** MySQL (Aiven Cloud)
*   **Image Processing:** Pillow (PIL)
*   **AI Engine:** Google Generative AI (Gemini 1.5 Pro)
*   **Security:** Bcrypt (Password Hashing), python-jose (JWT)
*   **Image Storage:** Cloudinary

**Deployment**
*   **Platform:** Render (Static Site for Frontend, Web Service for Backend)

---

## 🚀 Local Development Setup

To run this project locally on your machine, you will need Node.js and Python installed.

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd "Certificate generator"
```

### 2. Backend Setup
Navigate to the backend directory and set up your Python environment:
```bash
cd backend
python -m venv .venv

# Activate the virtual environment
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` folder and add the following variables:
```env
# Database Credentials (Aiven MySQL)
MYSQL_SERVER=your_database_host
MYSQL_PORT=your_database_port
MYSQL_USER=your_database_user
MYSQL_PASSWORD=your_database_password
MYSQL_DB=your_database_name

# Gemini API Key (For Auto-Detection)
GEMINI_API_KEY=your_gemini_api_key

# Cloudinary Credentials (For Image Hosting)
CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>

# Security
SECRET_KEY=generate_a_random_secret_string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Start the backend server:
```bash
uvicorn app.main:app --reload
```
The backend API will run at `http://localhost:8000`.

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` folder and add the following variables:
```env
# Point this to your backend server
VITE_API_URL=http://localhost:8000/api/v1
```

Start the frontend development server:
```bash
npm run dev
```
The React app will run at `http://localhost:5173`.

---

## 📁 Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints (auth, templates, generation)
│   │   ├── core/         # Configuration, database setup, and security
│   │   ├── models/       # SQLAlchemy database models
│   │   ├── schemas/      # Pydantic validation schemas
│   │   └── services/     # Core business logic (AI, Image Processing)
│   ├── requirements.txt  # Python dependencies
│   └── .env              # Backend environment variables
└── frontend/
    ├── src/
    │   ├── components/   # Reusable UI components (Sidebar)
    │   ├── pages/        # Main application pages (Login, Gallery, Configure, Generate)
    │   ├── services/     # Axios API configuration
    │   ├── App.jsx       # Routing and Theme logic
    │   └── main.jsx      # React entry point
    ├── package.json      # Node dependencies
    └── .env              # Frontend environment variables
```

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License
This project is open-source and available under the MIT License.
