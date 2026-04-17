import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
sys.path.insert(0, '.')
django.setup()

from reports.models import Report
from reports.serializers import ReportSerializer
import json

reports = Report.objects.all()
print(f"Total reports: {reports.count()}\n")

if reports.exists():
    print("=== API Response Format ===\n")
    serializer = ReportSerializer(reports, many=True)
    resp = {"count": reports.count(), "next": None, "previous": None, "results": serializer.data}
    print(json.dumps(resp, indent=2, default=str))
else:
    print("No reports found!")
