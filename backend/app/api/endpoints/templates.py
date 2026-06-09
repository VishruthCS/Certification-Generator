import os
import shutil
from typing import Any, List
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.template import Template, PlaceholderConfig
from app.schemas.template import TemplateResponse, PlaceholderConfigCreate, GenerateCertificateRequest, PlaceholderConfigResponse, TemplateRename
from app.services.ai import detect_placeholders
from app.services.generation import generate_certificate
from fastapi.responses import StreamingResponse
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

import cloudinary
import cloudinary.uploader

@router.post("/upload", response_model=TemplateResponse)
def upload_template(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Validate file format
    allowed_extensions = ["png", "jpg", "jpeg"]
    ext = file.filename.split(".")[-1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file format. Only PNG, JPG, JPEG are allowed.")
    
    try:
        # Upload directly to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file.file,
            folder="templates"
        )
        file_url = upload_result.get("secure_url")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to Cloudinary: {e}")
    
    # Save to database
    template_name = file.filename.rsplit(".", 1)[0]
    db_template = Template(
        template_name=template_name,
        image_path=file_url,
        thumbnail_path=file_url, # Using original as thumbnail for now
        user_id=current_user.id
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    return db_template

@router.get("/", response_model=List[TemplateResponse])
def get_templates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    templates = db.query(Template).filter(Template.user_id == current_user.id).all()
    return templates

@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(template_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    template = db.query(Template).filter(Template.id == template_id, Template.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.put("/{template_id}/rename", response_model=TemplateResponse)
def rename_template(template_id: int, request: TemplateRename, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    template = db.query(Template).filter(Template.id == template_id, Template.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template.template_name = request.template_name
    db.commit()
    db.refresh(template)
    return template

@router.delete("/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    template = db.query(Template).filter(Template.id == template_id, Template.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Remove file from Cloudinary if it's a Cloudinary URL
    if template.image_path and "cloudinary.com" in template.image_path:
        try:
            # Extract public_id from Cloudinary URL
            # Example URL: https://res.cloudinary.com/dotjk5awd/image/upload/v12345/templates/filename.png
            parts = template.image_path.split('/')
            file_with_ext = parts[-1]
            public_id = "templates/" + file_with_ext.split('.')[0]
            cloudinary.uploader.destroy(public_id)
        except Exception as e:
            print(f"Failed to delete from Cloudinary: {e}")
    # Fallback to remove file from disk if local
    elif template.image_path and os.path.exists(template.image_path):
        os.remove(template.image_path)
        
    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully"}

@router.post("/{template_id}/analyze")
def analyze_template(template_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    template = db.query(Template).filter(Template.id == template_id, Template.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Call Gemini to get coordinates
    coordinates = detect_placeholders(template.image_path)
    return coordinates

@router.post("/{template_id}/placeholders")
def save_placeholders(template_id: int, configs: List[PlaceholderConfigCreate], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    template = db.query(Template).filter(Template.id == template_id, Template.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    # Clear existing placeholders for this template
    db.query(PlaceholderConfig).filter(PlaceholderConfig.template_id == template_id).delete()
    
    for config in configs:
        db_config = PlaceholderConfig(
            template_id=template_id,
            field_name=config.field_name,
            x_coordinate=config.x_coordinate,
            y_coordinate=config.y_coordinate,
            font_size=config.font_size,
            font_family=config.font_family,
            font_color=config.font_color
        )
        db.add(db_config)
    db.commit()
    return {"message": "Configuration saved"}

@router.get("/{template_id}/placeholders", response_model=List[PlaceholderConfigResponse])
def get_placeholders(template_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    template = db.query(Template).filter(Template.id == template_id, Template.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    configs = db.query(PlaceholderConfig).filter(PlaceholderConfig.template_id == template_id).all()
    return configs
@router.post("/{template_id}/generate")
def generate_cert(template_id: int, request: GenerateCertificateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    template = db.query(Template).filter(Template.id == template_id, Template.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    configs = db.query(PlaceholderConfig).filter(PlaceholderConfig.template_id == template_id).all()
    if not configs:
        raise HTTPException(status_code=400, detail="Template has no placeholder configurations")
        
    try:
        output_stream = generate_certificate(template, configs, request.data, request.format)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    media_type = "application/pdf" if request.format.lower() == "pdf" else "image/png"
    filename = f"certificate.{request.format.lower()}"
    
    return StreamingResponse(
        output_stream,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
