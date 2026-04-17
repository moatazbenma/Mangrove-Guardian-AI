import os
import django
import sys
sys.path.insert(0, '.')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from reports.models import Report
from reports.serializers import ReportSerializer
import json

reports = Report.objects.all()
print(f'Total reports: {reports.count()}')

if reports.exists():
    for i, r in enumerate(reports):
        print(f'\n--- Report {i+1} ---')
        print(f'ID: {r.id}')
        print(f'Location: {r.location}')
        print(f'Photo field (raw): {r.photo}')
        print(f'Photo field type: {type(r.photo)}')
        if r.photo:
            print(f'Photo URL: {r.photo.url}')
        
        # Serialize it
        serializer = ReportSerializer(r)
        print(f'Serialized photo field: {serializer.data.get("photo")}')
else:
    print('No reports')
