from app.core.database import engine, Base
# Import all models so they are registered with Base.metadata before creation
from app.models.user import User
from app.models.template import Template
from app.models.placeholder import PlaceholderConfig

def reset_database():
    print("WARNING: Dropping all tables in the database...")
    Base.metadata.drop_all(bind=engine)
    
    print("Recreating all tables from scratch with the latest schema...")
    Base.metadata.create_all(bind=engine)
    
    print("Database reset successfully! All new columns are now present.")

if __name__ == "__main__":
    reset_database()
