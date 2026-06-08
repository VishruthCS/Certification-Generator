from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PlaceholderConfigBase(BaseModel):
    field_name: str
    x_coordinate: float
    y_coordinate: float
    font_size: int = 40
    font_family: Optional[str] = "Arial"
    font_color: Optional[str] = "#000000"

class PlaceholderConfigCreate(PlaceholderConfigBase):
    pass

class PlaceholderConfigResponse(PlaceholderConfigBase):
    id: int
    template_id: int

    class Config:
        from_attributes = True

class TemplateBase(BaseModel):
    template_name: str

class TemplateCreate(TemplateBase):
    pass

class TemplateRename(BaseModel):
    template_name: str

class TemplateResponse(TemplateBase):
    id: int
    image_path: str
    thumbnail_path: Optional[str] = None
    created_at: datetime
    placeholders: List[PlaceholderConfigResponse] = []

    class Config:
        from_attributes = True

class GeneratedCertificateBase(BaseModel):
    recipient_name: str
    from_date: Optional[str] = None
    to_date: Optional[str] = None

class GeneratedCertificateCreate(GeneratedCertificateBase):
    template_id: int
    format: str = "png" # "png" or "pdf"

class GeneratedCertificateResponse(GeneratedCertificateBase):
    id: int
    template_id: int
    certificate_path: str
    created_at: datetime

    class Config:
        from_attributes = True

class GenerateCertificateRequest(BaseModel):
    data: dict[str, str]
    format: str = "png"
