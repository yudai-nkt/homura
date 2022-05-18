export const sendMessage = (
  message: string,
  { token, channelId }: { token: string; channelId: string }
): Promise<Response> =>
  fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: message }),
  });
