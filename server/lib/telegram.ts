export async function sendTelegramAlert(message: string, isError: boolean = false, topicId?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // If not configured, silently skip sending the alert
    return;
  }

  try {
    const icon = isError ? '🚨' : 'ℹ️';
    const tag = process.env.NODE_ENV === 'production' ? '#PRODUCTION' : '#DEV';
    
    // Format the message with some Telegram HTML tags for readability
    const formattedMessage = `<b>${icon} Finance Tracker Alert ${tag}</b>\n<pre>${message}</pre>`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(topicId ? { message_thread_id: topicId } : {}),
      }),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      console.warn('Failed to send Telegram alert:', errorMsg);
    }
  } catch (error) {
    // We use a simple console.warn so we don't accidentally cause infinite loops 
    // if the main logger.error calls this function
    console.warn('Network error while sending Telegram alert:', error);
  }
}
