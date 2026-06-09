import os
import sys

# Add the current directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine

def main():
    try:
        with engine.connect() as conn:
            # Check if reset_token exists in users table
            print("Checking users table...")
            
            # Use raw SQL to add columns safely (try/except handles if they exist)
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL;"))
                print("Added reset_token to users.")
            except Exception as e:
                print(f"reset_token might already exist: {e}")
                
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME DEFAULT NULL;"))
                print("Added reset_token_expires to users.")
            except Exception as e:
                print(f"reset_token_expires might already exist: {e}")
                
            print("Checking templates table...")
            try:
                # Add user_id to templates
                conn.execute(text("ALTER TABLE templates ADD COLUMN user_id INT DEFAULT NULL;"))
                print("Added user_id to templates.")
            except Exception as e:
                print(f"user_id might already exist in templates: {e}")
                
            try:
                # Add foreign key constraint
                conn.execute(text("ALTER TABLE templates ADD CONSTRAINT fk_template_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;"))
                print("Added foreign key constraint to templates.")
            except Exception as e:
                print(f"Foreign key might already exist: {e}")
                
            conn.commit()
            print("Database alteration complete.")
    except Exception as e:
        print(f"Failed to connect or execute: {e}")

if __name__ == "__main__":
    main()
