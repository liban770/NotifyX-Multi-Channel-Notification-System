import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _

class NotificationStatus(models.TextChoices):
    PENDING = 'PENDING', _('Pending')
    QUEUED = 'QUEUED', _('Queued')
    PROCESSING = 'PROCESSING', _('Processing')
    SENT = 'SENT', _('Sent')
    DELIVERED = 'DELIVERED', _('Delivered')
    FAILED = 'FAILED', _('Failed')
    CANCELLED = 'CANCELLED', _('Cancelled')

class PriorityLevel(models.TextChoices):
    LOW = 'LOW', _('Low')
    NORMAL = 'NORMAL', _('Normal')
    HIGH = 'HIGH', _('High')
    CRITICAL = 'CRITICAL', _('Critical')

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='notifications')
    recipient = models.CharField(max_length=255, db_index=True)
    recipient_user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='received_notifications')
    notification_type = models.CharField(max_length=100, db_index=True)
    template = models.ForeignKey('templates.Template', on_delete=models.SET_NULL, null=True, blank=True)
    channel = models.CharField(max_length=50, db_index=True)
    subject = models.CharField(max_length=255, null=True, blank=True)
    content = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    priority = models.CharField(max_length=50, choices=PriorityLevel.choices, default=PriorityLevel.NORMAL)
    status = models.CharField(max_length=50, choices=NotificationStatus.choices, default=NotificationStatus.PENDING, db_index=True)
    idempotency_key = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    max_retries = models.PositiveIntegerField(default=3)
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['recipient', 'channel']),
            models.Index(fields=['created_at']),
        ]

class DeliveryAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='delivery_attempts')
    attempt_number = models.PositiveIntegerField()
    channel = models.CharField(max_length=50)
    provider_name = models.CharField(max_length=100)
    status = models.CharField(max_length=50)
    http_status_code = models.IntegerField(null=True, blank=True)
    provider_message_id = models.CharField(max_length=255, null=True, blank=True)
    raw_response = models.JSONField(default=dict, blank=True)
    error_details = models.TextField(null=True, blank=True)
    execution_time_ms = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['attempt_number']
