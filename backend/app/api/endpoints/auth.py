from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserResponse, GoogleToken
from google.oauth2 import id_token
from google.auth.transport import requests
import secrets

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
def login(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
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
