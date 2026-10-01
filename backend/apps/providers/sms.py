import time
import os
import logging
from typing import Dict, Any, Optional
from apps.channels.interfaces import BaseNotificationProvider, DeliveryResult, ChannelType

logger = logging.getLogger(__name__)

class TwilioSMSProvider(BaseNotificationProvider):
    @property
    def provider_name(self) -> str:
        return "Twilio"

    @property
    def channel(self) -> ChannelType:
        return ChannelType.SMS

    def is_healthy(self) -> bool:
        return True

    def send(self, recipient: str, subject: Optional[str], content: str, metadata: Dict[str, Any]) -> DeliveryResult:
        start_time = time.time()
        
        # Check simulated carrier failure
        if metadata.get("simulateFailure"):
            return DeliveryResult(
                success=False,
                provider_name=self.provider_name,
                channel=self.channel.value,
                status_code=400,
                error_message="Twilio Error 30008: Destination carrier unreachable",
                latency_ms=int((time.time() - start_time) * 1000) + 110
            )

        latency = int((time.time() - start_time) * 1000) + 72
        return DeliveryResult(
            success=True,
            provider_name=self.provider_name,
            channel=self.channel.value,
            status_code=201,
            provider_message_id=f"SM_{int(time.time())}",
            raw_response={"status": "sent", "to": recipient},
            latency_ms=latency
        )
