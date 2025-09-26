# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base
from app.models.user import User
from app.models.project import Project, ProjectStage, ProjectFile
from app.models.moderation import ModerationItem
from app.models.live import LiveSession, LiveQuestion, LiveTask
from app.models.analytics import AuditLog
