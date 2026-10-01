import time
import os
import logging
from typing import Dict, Any, Optional
from apps.channels.interfaces import BaseNotificationProvider, DeliveryResult, ChannelType

logger = logging.getLogger(__name__)

class SendGridEmailProvider(BaseNotificationProvider):
    @property
    def provider_name(self) -> str:
        return "SendGrid"

    @property
    def channel(self) -> ChannelType:
        return ChannelType.EMAIL

    def is_healthy(self) -> bool:
        # Check SendGrid status API or socket
        return True

    def send(self, recipient: str, subject: Optional[str], content: str, metadata: Dict[str, Any]) -> DeliveryResult:
        start_time = time.time()
        api_key = os.environ.get("SENDGRID_API_KEY", "sg_live_simulation")
        
        # Check simulation flag for testing
        if metadata.get("simulateFailure"):
            return DeliveryResult(
                success=False,
                provider_name=self.provider_name,
                channel=self.channel.value,
                status_code=503,
                error_message="SendGrid Service Unavailable: connection timeout",
                latency_ms=int((time.time() - start_time) * 1000)
            )

        # In production, invokes `sendgrid.SendGridAPIClient`
        latency = int((time.time() - start_time) * 1000) + 48
        return DeliveryResult(
            success=True,
            provider_name=self.provider_name,
            channel=self.channel.value,
            status_code=202,
            provider_message_id=f"sg_msg_{int(time.time())}",
            raw_response={"status": "queued", "recipient": recipient},
            latency_ms=latency
        )

class AmazonSESEmailProvider(BaseNotificationProvider):
    @property
    def provider_name(self) -> str:
        return "Amazon SES"

    @property
    def channel(self) -> ChannelType:
        return ChannelType.EMAIL

    def is_healthy(self) -> bool:
        return True

    def send(self, recipient: str, subject: Optional[str], content: str, metadata: Dict[str, Any]) -> DeliveryResult:
        start_time = time.time()
        latency = int((time.time() - start_time) * 1000) + 82
        return DeliveryResult(
            success=True,
            provider_name=self.provider_name,
            channel=self.channel.value,
            status_code=200,
            provider_message_id=f"ses_msg_{int(time.time())}",
            raw_response={"message_id": f"ses_{int(time.time())}"},
            latency_ms=latency
        )
