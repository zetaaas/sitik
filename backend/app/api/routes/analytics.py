import io
from datetime import datetime

from fastapi import APIRouter, Depends, Response
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session
import xlsxwriter

from app.api.deps import get_db_session, require_role
from app.models.analytics import AuditLog
from app.models.project import Project, ProjectStage
from app.models.live import LiveSession
from app.models.user import UserRole
from app.schemas.analytics import AuditLogResponse, KPIResponse

router = APIRouter(prefix="/analytics", tags=["analytics"], dependencies=[Depends(require_role(UserRole.moderator))])


@router.get("/kpi", response_model=KPIResponse)
def get_kpis(db: Session = Depends(get_db_session)):
    return KPIResponse(
        projects=db.query(Project).count(),
        project_stages=db.query(ProjectStage).count(),
        live_sessions=db.query(LiveSession).count(),
    )


@router.get("/audit", response_model=list[AuditLogResponse])
def list_audit_logs(db: Session = Depends(get_db_session)):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(500).all()


@router.get("/export/pdf")
def export_pdf(db: Session = Depends(get_db_session)):
    kpi = get_kpis(db)
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.drawString(100, 750, "Civil Oversight Platform KPI Report")
    pdf.drawString(100, 720, f"Generated: {datetime.utcnow().isoformat()}Z")
    pdf.drawString(100, 690, f"Projects: {kpi.projects}")
    pdf.drawString(100, 670, f"Project Stages: {kpi.project_stages}")
    pdf.drawString(100, 650, f"Live Sessions: {kpi.live_sessions}")
    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return Response(buffer.read(), media_type="application/pdf")


@router.get("/export/excel")
def export_excel(db: Session = Depends(get_db_session)):
    kpi = get_kpis(db)
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    worksheet = workbook.add_worksheet("KPI")
    worksheet.write_row(0, 0, ["Metric", "Value"])
    worksheet.write_row(1, 0, ["Projects", kpi.projects])
    worksheet.write_row(2, 0, ["Project Stages", kpi.project_stages])
    worksheet.write_row(3, 0, ["Live Sessions", kpi.live_sessions])
    workbook.close()
    output.seek(0)
    return Response(
        output.read(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=kpi.xlsx"},
    )
