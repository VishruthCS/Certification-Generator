from app.core.database import engine
from sqlalchemy import text

def migrate():
    print("Starting production database migration...")
    with engine.connect() as conn:
        # Check users table
        try:
            conn.execute(text("SELECT reset_token FROM users LIMIT 1"))
            print("reset_token already exists in users.")
        except Exception:
            print("Adding reset_token to users...")
            conn.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL"))
            conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL"))
            conn.commit()

        # Check templates table
        try:
            conn.execute(text("SELECT user_id FROM templates LIMIT 1"))
            print("user_id already exists in templates.")
        except Exception:
            print("Adding user_id to templates...")
            conn.execute(text("ALTER TABLE templates ADD COLUMN user_id INTEGER NULL"))
            conn.execute(text("ALTER TABLE templates ADD CONSTRAINT fk_template_user FOREIGN KEY (user_id) REFERENCES users(id)"))
            conn.commit()
            
    print("Production database migration complete!")

if __name__ == "__main__":
    migrate()
