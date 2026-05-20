#!/usr/bin/env python3
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_admin(username: str, email: str, password: str):
    from app.config import settings
    from app.database import AsyncSessionLocal
    from app.models.models import User

    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        from app.models.models import Base
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == username))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"User '{username}' already exists. Updating...")
            existing_user.email = email
            existing_user.hashed_password = pwd_context.hash(password)
            existing_user.is_admin = True
            existing_user.is_active = True
        else:
            print(f"Creating admin user '{username}'...")
            admin = User(
                username=username,
                email=email,
                hashed_password=pwd_context.hash(password),
                is_admin=True,
                is_active=True,
            )
            db.add(admin)

        await db.commit()
        print(f"Admin user '{username}' created/updated successfully!")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(f"Usage: python {sys.argv[0]} <username> <email> <password>")
        sys.exit(1)

    username, email, password = sys.argv[1], sys.argv[2], sys.argv[3]
    asyncio.run(create_admin(username, email, password))