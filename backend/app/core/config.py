import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Certificate Template Management System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_SERVER: str = os.getenv("MYSQL_SERVER", "localhost")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "certificate_db")
    
    # Construct DB URI safely
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        import urllib.parse
        # Use pymysql
        if self.MYSQL_PASSWORD:
            encoded_password = urllib.parse.quote_plus(self.MYSQL_PASSWORD)
            return f"mysql+pymysql://{self.MYSQL_USER}:{encoded_password}@{self.MYSQL_SERVER}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
        return f"mysql+pymysql://{self.MYSQL_USER}@{self.MYSQL_SERVER}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
    
    # Upload paths
    UPLOAD_DIR: str = os.path.join(os.getcwd(), "uploads")
    TEMPLATE_DIR: str = os.path.join(UPLOAD_DIR, "templates")
    GENERATED_DIR: str = os.path.join(UPLOAD_DIR, "generated")

    # Optional Google Gemini AI Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

    # Cloudinary Integration
    CLOUDINARY_URL: str = os.getenv("CLOUDINARY_URL", "")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()

import cloudinary
import cloudinary.uploader
import cloudinary.api
if settings.CLOUDINARY_URL:
    cloudinary.config(url=settings.CLOUDINARY_URL)

# Ensure directories exist
os.makedirs(settings.TEMPLATE_DIR, exist_ok=True)
os.makedirs(settings.GENERATED_DIR, exist_ok=True)
