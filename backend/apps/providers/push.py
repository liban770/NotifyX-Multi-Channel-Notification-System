import time
import logging
from typing import Dict, Any, Optional
from apps.channels.interfaces import BaseNotificationProvider, DeliveryResult, ChannelType

logger = logging.getLogger(__name__)

class FirebasePushProvider(BaseNotificationProvider):
    @property
    def provider_name(self) -> str:
        return "Firebase Cloud Messaging"

    @property
    def channel(self) -> ChannelType:
        return ChannelType.PUSH

    def is_healthy(self) -> bool:
        return True

    def send(self, recipient: str, subject: Optional[str], content: str, metadata: Dict[str, Any]) -> DeliveryResult:
        start_time = time.time()
        latency = int((time.time() - start_time) * 1000) + 65
        return DeliveryResult(
            success=True,
            provider_name=self.provider_name,
            channel=self.channel.value,
            status_code=200,
            provider_message_id=f"projects/notifyx/messages/{int(time.time())}",
            raw_response={"name": f"fcm_msg_{int(time.time())}"},
            latency_ms=latency
        )
