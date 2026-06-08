from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String(100), index=True, nullable=False)
    image_path = Column(String(255), nullable=False)
    thumbnail_path = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    placeholders = relationship("PlaceholderConfig", back_populates="template", cascade="all, delete-orphan")
    certificates = relationship("GeneratedCertificate", back_populates="template", cascade="all, delete-orphan")

class PlaceholderConfig(Base):
    __tablename__ = "placeholder_config"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id", ondelete="CASCADE"))
    field_name = Column(String(50), nullable=False) # e.g., "recipient_name", "from_date", "to_date"
    x_coordinate = Column(Float, nullable=False)
    y_coordinate = Column(Float, nullable=False)
    font_size = Column(Integer, default=42)
    font_family = Column(String(50), default="Arial")
    font_color = Column(String(20), default="#000000")

    template = relationship("Template", back_populates="placeholders")

class GeneratedCertificate(Base):
    __tablename__ = "generated_certificates"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id", ondelete="CASCADE"))
    recipient_name = Column(String(100), nullable=False)
    from_date = Column(String(20), nullable=True)
    to_date = Column(String(20), nullable=True)
    certificate_path = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    template = relationship("Template", back_populates="certificates")
