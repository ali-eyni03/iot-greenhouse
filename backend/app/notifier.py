import os
import httpx

BALE_BOT_TOKEN = os.getenv("BALE_BOT_TOKEN", "")
BALE_CHAT_ID = os.getenv("BALE_CHAT_ID", "")

# Bale uses the same structure as the Telegram Bot API, just on its own domain
BALE_API_URL = f"https://tapi.bale.ai/bot{BALE_BOT_TOKEN}/sendMessage"


async def send_bale_alert(text: str) -> bool:
    """
    Sends a text message to the fixed chat_id (the user themself) in Bale messenger.
    Returns True on success, otherwise False (and prints the error).
    This function never raises an exception, because a network failure while
    sending an alert should not stop the main application flow (such as saving
    a sensor reading).
    """
    if not BALE_BOT_TOKEN or not BALE_CHAT_ID:
        print("Bale bot token or chat_id not configured, skipping alert")
        return False

    payload = {
        "chat_id": BALE_CHAT_ID,
        "text": text,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(BALE_API_URL, json=payload)
            response.raise_for_status()
            return True
    except httpx.HTTPError as e:
        print(f"Failed to send Bale alert: {e}")
        return False