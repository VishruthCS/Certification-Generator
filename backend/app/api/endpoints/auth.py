from datetime import timedelta, datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse, GoogleToken, ForgotPasswordRequest, ResetPasswordRequest
from google.oauth2 import id_token
from google.auth.transport import requests
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    try:
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="The user with this email already exists in the system.",
            )
        user_db = db.query(User).filter(User.username == user_in.username).first()
        if user_db:
             raise HTTPException(
                status_code=400,
                detail="The user with this username already exists in the system.",
            )
        
        hashed_password = security.get_password_hash(user_in.password)
        new_user = User(
            email=user_in.email,
            username=user_in.username,
            password_hash=hashed_password,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Registration crash: {str(e)}")

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not security.verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/google", response_model=Token)
def google_auth(token_data: GoogleToken, db: Session = Depends(get_db)) -> Any:
    try:
        idinfo = id_token.verify_oauth2_token(
            token_data.token, requests.Request(), settings.GOOGLE_CLIENT_ID
        )
        email = idinfo['email']
        username = email.split("@")[0]
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Handle username collision
            base_username = username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1
                
            # Create a secure random password since Google handles auth
            hashed_password = security.get_password_hash(secrets.token_urlsafe(32))
            user = User(
                email=email,
                username=username,
                password_hash=hashed_password,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return {
            "access_token": security.create_access_token(
                user.id, expires_delta=access_token_expires
            ),
            "token_type": "bearer",
        }
    except ValueError as e:
        print(f"Google token verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid Google token")

def send_reset_email(email: str, token: str):
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        print(f"SMTP not configured. Token for {email} is: {token}")
        return

    msg = MIMEMultipart()
    msg['From'] = settings.SMTP_USERNAME
    msg['To'] = email
    msg['Subject'] = "Certify AI - Password Reset"

    # Assume frontend is running on the origin domain. We'll send a direct token for them to paste, 
    # or a link if we knew the exact frontend URL. For simplicity in an API, providing the token is robust.
    body = f"You requested a password reset.\n\nYour reset token is: {token}\n\nPaste this token in the Reset Password page."
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(settings.SMTP_USERNAME, email, text)
        server.quit()
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send password reset email")

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal that the user does not exist
        return {"message": "If that email exists, a reset link has been sent."}
    
    # Generate secure token
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    # Token valid for 1 hour
    user.reset_token_expires = datetime.now() + timedelta(hours=1)
    db.commit()

    # Send email
    send_reset_email(user.email, token)
    
    return {"message": "If that email exists, a reset link has been sent."}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    # Find user by token
    user = db.query(User).filter(
        User.reset_token == request.token,
        User.reset_token_expires > datetime.now()
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    # Update password
    hashed_password = security.get_password_hash(request.new_password)
    user.password_hash = hashed_password
    # Invalidate token
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"message": "Password has been successfully reset"}

