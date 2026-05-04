import dns from "dns";
import net from "net";

/**
 * Perform a native SMTP socket deliverability check on a target email address.
 * Standardizes outbound port-25 connection handshakes with fail-safe checks.
 */
export async function verifyEmailDeliverability(email: string): Promise<{
  valid: boolean;
  reason: string;
}> {
  // 1. Basic syntax format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, reason: "Invalid syntax format" };
  }

  const [, domain] = email.split("@");

  try {
    // 2. Resolve MX Records
    const mxRecords = await new Promise<dns.MxRecord[]>((resolve, reject) => {
      dns.resolveMx(domain, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          reject(err || new Error("No MX records found"));
        } else {
          resolve(addresses.sort((a, b) => a.priority - b.priority));
        }
      });
    });

    const bestMx = mxRecords[0].exchange;

    // 3. Connect to the SMTP server on port 25
    return new Promise((resolve) => {
      const socket = net.createConnection(25, bestMx);
      let step = 0;
      let hasResolved = false;

      // Keep it snappy: 4 seconds timeout
      socket.setTimeout(4000);

      const finish = (valid: boolean, reason: string) => {
        if (hasResolved) return;
        hasResolved = true;
        socket.destroy();
        resolve({ valid, reason });
      };

      socket.on("connect", () => {
        // Connection established successfully
      });

      socket.on("data", (data) => {
        const response = data.toString();

        if (step === 0 && response.startsWith("220")) {
          socket.write("HELO mail.velocityos.com\r\n");
          step = 1;
        } else if (step === 1 && response.startsWith("250")) {
          socket.write("MAIL FROM:<verify@velocityos.com>\r\n");
          step = 2;
        } else if (step === 2 && response.startsWith("250")) {
          socket.write(`RCPT TO:<${email}>\r\n`);
          step = 3;
        } else if (step === 3) {
          if (response.startsWith("250")) {
            finish(true, "Deliverable address confirmed via SMTP handshake");
          } else if (response.startsWith("550")) {
            finish(false, "Address rejected by target mail server (550)");
          } else {
            finish(true, `Acceptance response ambiguous: ${response.trim().slice(0, 60)}`);
          }
        }
      });

      socket.on("error", (err) => {
        // Fallback to deliverable if network blockages or strict ISP/cloud provider block port 25
        finish(true, `SMTP verification connection failed (assuming deliverable): ${err.message}`);
      });

      socket.on("timeout", () => {
        finish(true, "SMTP verification timeout (assuming deliverable)");
      });
    });
  } catch (error: any) {
    return { valid: true, reason: `Failed to resolve MX records (assuming deliverable): ${error.message}` };
  }
}
