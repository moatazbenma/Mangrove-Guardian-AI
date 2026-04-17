import time
from reports.models import Report
from analysis.models import Analysis
from analysis.tasks import analyze_report_image

report = Report.objects.order_by('-id').first()
if not report:
    print('NO_REPORTS_FOUND')
    raise SystemExit(0)

analysis, _ = Analysis.objects.get_or_create(report=report)
analysis.status = 'pending'
analysis.result = None
analysis.save(update_fields=['status', 'result', 'updated_at'])

print('TEST_REPORT_ID', report.id)
print('TEST_ANALYSIS_ID', analysis.id)

task = analyze_report_image.delay(report.id)
print('TASK_ID', task.id)

for i in range(1, 19):
    analysis.refresh_from_db()
    print(f'POLL_{i}', analysis.status)
    if analysis.status in ('complete', 'failed'):
        break
    time.sleep(10)

analysis.refresh_from_db()
print('FINAL_STATUS', analysis.status)
print('FINAL_HEALTH', analysis.health_score)
print('FINAL_DAMAGE', analysis.damage_detected)
print('FINAL_RISK', analysis.risk_level)
print('FINAL_RESULT', (analysis.result or '')[:500])
