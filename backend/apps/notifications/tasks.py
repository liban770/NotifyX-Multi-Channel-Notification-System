import logging
from celery import shared_task
from django.utils import timezone
from .models import Notification, NotificationStatus, DeliveryAttempt
from apps.channels.router import ChannelRouter

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def dispatch_single_notification(self, notification_id: str):
    """
    Celery task that executes background asynchronous delivery
    with provider failover, retry tracking, and delivery attempt persistence.
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        if notification.status in [NotificationStatus.CANCELLED, NotificationStatus.DELIVERED]:
            return f"Notification {notification_id} already finalized ({notification.status})."

        notification.status = NotificationStatus.PROCESSING
        notification.save(update_fields=['status', 'updated_at'])

        router = ChannelRouter()
        result = router.dispatch(notification)

        attempt_number = notification.retry_count + 1
        DeliveryAttempt.objects.create(
            notification=notification,
            attempt_number=attempt_number,
            channel=notification.channel,
            provider_name=result.provider_name,
            status='SUCCESS' if result.success else 'FAILED',
            http_status_code=result.status_code,
            provider_message_id=result.provider_message_id,
            raw_response=result.raw_response or {},
            error_details=result.error_message,
            execution_time_ms=result.latency_ms
        )

        if result.success:
            notification.status = NotificationStatus.DELIVERED
            notification.sent_at = timezone.now()
            notification.delivered_at = timezone.now()
            notification.error_message = None
            notification.save(update_fields=['status', 'sent_at', 'delivered_at', 'error_message', 'updated_at'])
            return f"Delivered via {result.provider_name}"
        else:
            notification.retry_count = attempt_number
            notification.error_message = result.error_message
            if attempt_number < notification.max_retries:
                notification.status = NotificationStatus.QUEUED
                notification.save(update_fields=['status', 'retry_count', 'error_message', 'updated_at'])
                # Exponential backoff retry
                countdown = (2 ** attempt_number) * 5
                raise self.retry(exc=Exception(result.error_message), countdown=countdown)
            else:
                notification.status = NotificationStatus.FAILED
                notification.failed_at = timezone.now()
                notification.save(update_fields=['status', 'retry_count', 'failed_at', 'error_message', 'updated_at'])
                return f"Exhausted retries: {result.error_message}"

    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found.")
    except Exception as exc:
        logger.error(f"Unhandled error processing notification {notification_id}: {exc}")
        raise self.retry(exc=exc, countdown=10)
