import logging

logger = logging.getLogger(__name__)


def send_sms(phone_number: str, message: str) -> None:
    """Mock SMS sender that logs the outgoing message."""
    logger.info("Sending SMS to %s: %s", phone_number, message)
