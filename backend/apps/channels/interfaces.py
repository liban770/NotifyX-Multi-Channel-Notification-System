from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

class ChannelType(str, Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"
    PUSH = "PUSH"
    IN_APP = "IN_APP"

@dataclass
class DeliveryResult:
    success: bool
    provider_name: str
    channel: str
    status_code: Optional[int] = None
    provider_message_id: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    latency_ms: int = 0

class BaseNotificationProvider(ABC):
    """Abstract Base Class for all communication gateway providers."""
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def channel(self) -> ChannelType:
        pass

    @abstractmethod
    def is_healthy(self) -> bool:
        """Synthetic ping to verify provider API availability."""
        pass

    @abstractmethod
    def send(self, recipient: str, subject: Optional[str], content: str, metadata: Dict[str, Any]) -> DeliveryResult:
        """Executes actual network transmission to external provider."""
        pass
