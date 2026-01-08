import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function notifyDiscord(email: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn(
      "[Discord] Missing DISCORD_WEBHOOK_URL, skipping notification",
    );
    return;
  }

  console.log("[Discord] Sending notification...");

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "New madebyoss.com signup",
            fields: [{ name: "Email", value: email }],
            color: 0x3b82f6,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (res.ok) {
      console.log("[Discord] Notification sent successfully");
    } else {
      console.error("[Discord] Webhook failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[Discord] Webhook error:", err);
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }

    const { data, error } = await resend.contacts.create({
      email,
      unsubscribed: false,
    });

    if (error) {
      console.error("[Resend] Failed to create contact:", error);
      return Response.json({ error: "Failed to subscribe" }, { status: 500 });
    }

    console.log("[Resend] Contact created:", data?.id);
    await notifyDiscord(email);

    return Response.json({ success: true });
  } catch (err) {
    console.error("[Subscribe] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
