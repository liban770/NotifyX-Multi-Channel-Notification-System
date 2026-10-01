import logging
from typing import Dict, Any, Optional
from apps.channels.interfaces import BaseNotificationProvider, DeliveryResult, ChannelType
from apps.providers.email import SendGridEmailProvider, AmazonSESEmailProvider
from apps.providers.sms import TwilioSMSProvider
from apps.providers.push import FirebasePushProvider

logger = logging.getLogger(__name__)

class ChannelRouter:
    """
    Channel Router responsible for selecting healthy providers,
    managing primary/fallback routing, and circuit-breaker handling.
    """

    def __init__(self):
        # Register providers by channel with priority ordering
        self._providers: Dict[str, list[BaseNotificationProvider]] = {
            ChannelType.EMAIL.value: [
                SendGridEmailProvider(),      # Primary (Tier 1)
                AmazonSESEmailProvider(),     # Fallback (Tier 2)
            ],
            ChannelType.SMS.value: [
                TwilioSMSProvider(),
            ],
            ChannelType.PUSH.value: [
                FirebasePushProvider(),
            ],
        }

    def dispatch(self, notification) -> DeliveryResult:
        channel = notification.channel
        providers_list = self._providers.get(channel, [])

        if not providers_list:
            return DeliveryResult(
                success=False,
                provider_name="UNKNOWN_CHANNEL",
                channel=channel,
                error_message=f"No provider registered for channel {channel}"
            )

        last_error = None
        for provider in providers_list:
            try:
                if not provider.is_healthy():
                    logger.warning(f"Provider {provider.provider_name} degraded, attempting fallback.")
                    continue

                result = provider.send(
                    recipient=notification.recipient,
                    subject=notification.subject,
                    content=notification.content,
                    metadata=notification.metadata or {}
                )

                if result.success:
                    return result
                
                last_error = result.error_message
                logger.warning(f"Provider {provider.provider_name} returned failure: {last_error}. Trying next tier.")

            except Exception as exc:
                last_error = str(exc)
                logger.error(f"Provider {provider.provider_name} raised exception: {exc}")

        return DeliveryResult(
            success=False,
            provider_name=providers_list[0].provider_name,
            channel=channel,
            error_message=last_error or "All providers in pool exhausted without successful ACK."
        )
