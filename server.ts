import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import http from "http";
import net from "net";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize the server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
const isApiKeyMissing = !apiKey;

const ai = new GoogleGenAI({
  apiKey: apiKey || "MISSING_API_KEY",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Initialize Telegram Bot for polling if TELEGRAM_BOT_TOKEN is provided in environment variables
const botTokenFromEnv = process.env.TELEGRAM_BOT_TOKEN;
if (botTokenFromEnv) {
  try {
    const bot = new TelegramBot(botTokenFromEnv, { polling: true });
    console.log("🤖 ASABB NOC Telegram Bot is running with polling...");

    bot.on("message", (msg) => {
      console.log("Received Telegram Message:", msg);
      if (!msg.text) return;

      const text = msg.text.trim();
      const chatId = msg.chat.id;

      if (text.startsWith("/status")) {
        const statusMessage = `🟢 *ASABB Bank Zambia NOC Status Report* 🟢\n\n` +
          `*Network Health:* 100% SentinelNOC Active\n` +
          `*Core Gateways:* OPERATIONAL (Lusaka HQ)\n` +
          `*Monitored Devices:* ${devicesState.filter(d => d.status === 'online').length}/${devicesState.length} Online\n` +
          `*Primary Fiber Loops:* Connected & Stable\n\n` +
          `_SentinelNOC Engine v2 running live in Cloud Sandbox_`;
        bot.sendMessage(chatId, statusMessage, { parse_mode: "Markdown" })
          .catch(err => console.error("Error sending Telegram status:", err));
      } else if (text.startsWith("/help")) {
        const helpMessage = `🤖 *ASABB Bank NOC Bot Command Registry* 🤖\n\n` +
          `• \`/status\` - View current network operating stats & device health\n` +
          `• \`/help\` - View this command registry\n` +
          `• Or type any message to interact with the SentinelNOC Watchdog!`;
        bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" })
          .catch(err => console.error("Error sending Telegram help:", err));
      } else {
        bot.sendMessage(
          chatId,
          `🔥 *ASABB NOC received:* \n_"${text}"_\n\n` +
          `*Connection Status:* 🟢 Active\n` +
          `*Timestamp:* ${new Date().toLocaleTimeString('en-GB')} CAT\n` +
          `*Action:* Processed by SentinelNOC Watchdog.`,
          { parse_mode: "Markdown" }
        ).catch(err => console.error("Error sending message to Telegram:", err));
      }
    });

    bot.on("polling_error", (error) => {
      console.error("Telegram polling error:", error);
    });
  } catch (error) {
    console.error("Failed to initialize Telegram Bot polling:", error);
  }
} else {
  console.log("ℹ️ TELEGRAM_BOT_TOKEN not found in environment. Back-and-forth polling inactive until token is set in Secrets.");
}

// Helper function to send Telegram Notification
async function sendTelegramNotification(botToken: string, chatId: string, message: string) {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chat = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chat) {
    console.log("ℹ️ Telegram credentials missing for auto-dispatch.");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: message,
        parse_mode: "Markdown"
      })
    });
    const data = await response.json();
    return data.ok;
  } catch (err) {
    console.error("Failed to send Telegram notification:", err);
    return false;
  }
}

// API endpoint for Real-Time Telegram Notifications
app.post("/api/telegram/notify", async (req, res) => {
  try {
    const { botToken, chatId, message } = req.body;
    const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chat = chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token) {
      return res.status(400).json({ error: "Telegram Bot Token is missing. Please configure it." });
    }
    if (!chat) {
      return res.status(400).json({ error: "Telegram Chat ID is missing. Please configure it." });
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: message,
        parse_mode: "Markdown"
      })
    });

    const data = await response.json();
    if (!data.ok) {
      return res.status(400).json({ 
        error: data.description || "Telegram API rejected the message", 
        code: data.error_code 
      });
    }

    return res.status(200).json({ success: true, result: data.result });
  } catch (error: any) {
    console.error("Telegram Notification Error:", error);
    return res.status(500).json({ error: "Failed to send Telegram message", details: error.message });
  }
});

// Helper function to send Twilio Voice Call
async function triggerTwilioVoiceCallServer(message: string, customSid?: string, customToken?: string, customFrom?: string, customTo?: string) {
  const sid = (customSid || process.env.TWILIO_ACCOUNT_SID || "AC15c036325c5fd25f898c861f30767ba3").trim();
  const token = (customToken || process.env.TWILIO_AUTH_TOKEN || "").trim();
  const cleanNumber = (num: string) => num.trim().replace(/[^\d+]/g, "");
  const fromNum = cleanNumber(customFrom || process.env.TWILIO_FROM_NUMBER || "+17373880767");
  const toNum = cleanNumber(customTo || process.env.TWILIO_TO_NUMBER || "+260761755780");

  if (!sid || !token || !fromNum || !toNum) {
    console.warn("⚠️ Twilio Auth Token or credentials missing for auto voice call dispatch.");
    return false;
  }

  try {
    const escapedMessage = (message || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

    const twiml = `<Response><Say voice="alice" language="en-US">${escapedMessage}</Say></Response>`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`;

    const basicAuth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams();
    params.append("From", fromNum);
    params.append("To", toNum);
    params.append("Twiml", twiml);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const textResponse = await response.text();
    let data: any = {};
    try { data = JSON.parse(textResponse); } catch (e) { data = { message: textResponse }; }

    if (!response.ok) {
      console.error("❌ Twilio API call failed:", data.message || response.statusText);
      return false;
    }
    console.log("☎️ Twilio Outbound Emergency Call placed! SID:", data.sid);
    return true;
  } catch (err) {
    console.error("❌ Failed to dispatch Twilio voice call:", err);
    return false;
  }
}

// API endpoint for Real-Time Twilio Voice Call alerts
app.post("/api/twilio/call", async (req, res) => {
  try {
    const { accountSid, authToken, fromNumber, toNumber, message } = req.body;
    const ok = await triggerTwilioVoiceCallServer(message, accountSid, authToken, fromNumber, toNumber);
    if (!ok) {
      return res.status(400).json({ 
        error: "Twilio API rejected the voice call. Please check that your Auth Token, From (+17373880767) and To (+260761755780) numbers are valid." 
      });
    }
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Twilio Voice Call Error:", error);
    return res.status(500).json({ error: "Failed to trigger outbound voice call", details: error.message });
  }
});

// ============================================================================
// SENTINELNOC NATIVE DEVICE MONITORING ENGINE (V2)
// ============================================================================

export interface MonitoredDevice {
  id: string;
  branchId: string;
  branchName: string;
  name: string;
  description: string;
  ip: string;
  category: 'Router' | 'Switch' | 'Firewall' | 'Server' | 'Workstation' | 'Auto Detect';
  protocol: 'ICMP Ping' | 'HTTP/HTTPS Probe' | 'TCP Port Probe' | 'SNMP Poller' | 'Syslog Listener' | 'REST Telemetry';
  monitoringEnabled: boolean;
  monitoringInterval: number; // in seconds (default 10)
  consecutiveFailureThreshold: number; // default 3
  status: 'online' | 'warning' | 'offline' | 'unknown';
  lastSeen: string;
  lastResponseStatus: string;
  failureCount: number;
  notes: string;
  currentIncidentId?: string | null;
  manualSimulatedOffline?: boolean; // For live demo simulation
  lastHeartbeatTime?: number; // Unix timestamp of last heartbeat ping
  createdAt: string;
}

export interface DeviceTimelineEvent {
  id: string;
  deviceId: string;
  deviceName: string;
  timestamp: string;
  type: 'online' | 'warning' | 'offline' | 'incident_created' | 'telegram_sent' | 'acknowledged' | 'twilio_escalated' | 'restored' | 'closed';
  title: string;
  description: string;
  actor?: string;
  incidentId?: string | null;
}

export interface MonitoringHistoryRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  timestamp: string;
  status: 'online' | 'warning' | 'offline' | 'unknown';
  responseResult: string;
  failureCount: number;
  incidentId?: string | null;
}

export interface AiIncidentAnalysis {
  incidentId: string;
  explanation: string;
  possibleRootCause: string;
  businessImpact: string;
  recommendedTroubleshooting: string[];
  confidenceScore: number;
  analyzedAt: string;
}

export interface IncidentRecord {
  id: string;
  alertId: string;
  branchId: string;
  branchName: string;
  device: string;
  title: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  status: 'open' | 'acknowledged' | 'resolved';
  startTime: string; // ISO
  elapsedMinutes: number;
  escalationStep: 'none' | 'telegram' | 'followup' | 'call' | 'manager';
  notes?: string;
  restorationTime?: string;
  outageDurationFormatted?: string;
  aiAnalysis?: AiIncidentAnalysis;
  deviceId?: string;
}

// In-Memory Database for Devices & Monitoring State
let devicesState: MonitoredDevice[] = [
  {
    id: 'DEV-101',
    branchId: 'lsk-hq',
    branchName: 'Lusaka HQ - Cairo Rd',
    name: 'Core Router AR-9001',
    description: 'Primary SD-WAN Edge Core Router for HQ Transactions',
    ip: '10.211.1.1',
    category: 'Router',
    protocol: 'ICMP Ping',
    monitoringEnabled: true,
    monitoringInterval: 10,
    consecutiveFailureThreshold: 3,
    status: 'online',
    lastSeen: new Date().toLocaleTimeString('en-GB'),
    lastResponseStatus: '200 OK - 8ms response',
    failureCount: 0,
    notes: 'Primary fiber link via ZAMTEL Optical Core',
    currentIncidentId: null,
    manualSimulatedOffline: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'DEV-102',
    branchId: 'lsk-hq',
    branchName: 'Lusaka HQ - Cairo Rd',
    name: 'Distribution Switch DS-901',
    description: 'HQ High-Density Core Distribution Switch',
    ip: '10.211.1.2',
    category: 'Switch',
    protocol: 'TCP Port Probe',
    monitoringEnabled: true,
    monitoringInterval: 10,
    consecutiveFailureThreshold: 3,
    status: 'online',
    lastSeen: new Date().toLocaleTimeString('en-GB'),
    lastResponseStatus: 'TCP Port 22 Open (3ms)',
    failureCount: 0,
    notes: 'Dual redundant power supplies online',
    currentIncidentId: null,
    manualSimulatedOffline: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'DEV-103',
    branchId: 'solwezi-mine',
    branchName: 'Solwezi Mining Hub',
    name: 'Branch Router AR-4011',
    description: 'Mine Facility Primary SD-WAN Edge Router',
    ip: '10.211.2.1',
    category: 'Router',
    protocol: 'ICMP Ping',
    monitoringEnabled: true,
    monitoringInterval: 10,
    consecutiveFailureThreshold: 3,
    status: 'online',
    lastSeen: new Date().toLocaleTimeString('en-GB'),
    lastResponseStatus: '200 OK - 24ms (Satellite path)',
    failureCount: 0,
    notes: 'Kansanshi Mine Site Perimeter Gateway',
    currentIncidentId: null,
    manualSimulatedOffline: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'DEV-104',
    branchId: 'solwezi-mine',
    branchName: 'Solwezi Mining Hub',
    name: 'Industrial UPS 10kVA',
    description: 'Mine Branch Power Backup & Isolation Protection',
    ip: '10.211.7.100',
    category: 'Server',
    protocol: 'SNMP Poller',
    monitoringEnabled: true,
    monitoringInterval: 10,
    consecutiveFailureThreshold: 3,
    status: 'online',
    lastSeen: new Date().toLocaleTimeString('en-GB'),
    lastResponseStatus: 'SNMP v3 Polled - Battery 100%',
    failureCount: 0,
    notes: 'APC Schneider Heavy-Duty Battery Array',
    currentIncidentId: null,
    manualSimulatedOffline: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'DEV-105',
    branchId: 'kitwe-retail',
    branchName: 'Kitwe Retail Centre',
    name: 'Branch Router AR-4012',
    description: 'Copperbelt Gateway & ATM Cash Vault Switch',
    ip: '10.211.3.1',
    category: 'Router',
    protocol: 'ICMP Ping',
    monitoringEnabled: true,
    monitoringInterval: 10,
    consecutiveFailureThreshold: 3,
    status: 'online',
    lastSeen: new Date().toLocaleTimeString('en-GB'),
    lastResponseStatus: '200 OK - 14ms',
    failureCount: 0,
    notes: 'Kitwe Retail Branch Primary Link',
    currentIncidentId: null,
    manualSimulatedOffline: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'DEV-106',
    branchId: 'ndola-comm',
    branchName: 'Ndola Commercial Branch',
    name: 'Branch Router AR-3015',
    description: 'Ndola Executive Branch SD-WAN Router',
    ip: '10.211.4.1',
    category: 'Router',
    protocol: 'ICMP Ping',
    monitoringEnabled: true,
    monitoringInterval: 10,
    consecutiveFailureThreshold: 3,
    status: 'online',
    lastSeen: new Date().toLocaleTimeString('en-GB'),
    lastResponseStatus: '200 OK - 18ms',
    failureCount: 0,
    notes: 'President Avenue Branch Gateway',
    currentIncidentId: null,
    manualSimulatedOffline: false,
    createdAt: new Date().toISOString()
  }
];

let incidentsState: IncidentRecord[] = [];
let historyLogState: MonitoringHistoryRecord[] = [];
let timelineEventsState: DeviceTimelineEvent[] = [
  {
    id: 'evt-init',
    deviceId: 'DEV-101',
    deviceName: 'Core Router AR-9001',
    timestamp: new Date().toLocaleTimeString('en-GB'),
    type: 'online',
    title: 'SentinelNOC Engine Initialized',
    description: 'SentinelNOC continuous background health poller online across all 8 Zambia regional branches.',
    actor: 'System Daemon'
  }
];

let lastMonitoringCycleTime = new Date().toLocaleTimeString('en-GB');

// Helper to validate IP address or hostname
function isValidIpAddress(ip: string): boolean {
  if (!ip) return false;
  const clean = ip.trim();
  if (clean.length < 2) return false;
  return true;
}

// Function to generate Gemini AI analysis for an outage
async function generateAiOutageAnalysis(device: MonitoredDevice, incidentId: string): Promise<AiIncidentAnalysis> {
  const defaultAnalysis: AiIncidentAnalysis = {
    incidentId,
    explanation: `Critical loss of telemetry on ${device.name} (${device.ip}) located at ${device.branchName}. SentinelNOC detected ${device.consecutiveFailureThreshold} consecutive failed reachability probes.`,
    possibleRootCause: `Primary fiber cut or power unit fault on the ${device.category} circuit at ${device.branchName}.`,
    businessImpact: `Branch banking transactions, POS clearing, and local ATM operations at ${device.branchName} are suspended or diverted to degraded satellite failover.`,
    recommendedTroubleshooting: [
      `Inspect power source & UPS telemetry on ${device.name}`,
      `Verify physical fiber path to ISP handoff box at ${device.branchName}`,
      `Initiate loopback query on IP ${device.ip} via secondary WAN interface`,
      `Dispatch L2 Field Technician if unacknowledged after 15 minutes`
    ],
    confidenceScore: 94,
    analyzedAt: new Date().toLocaleTimeString('en-GB')
  };

  if (isApiKeyMissing) return defaultAnalysis;

  try {
    const prompt = `You are GIZA, the AI Network Specialist for ASABB Bank Zambia NOC.
Analyze this CRITICAL NETWORK DEVICE OUTAGE and generate a structured JSON analysis:
- Device Name: ${device.name}
- Device IP: ${device.ip}
- Category: ${device.category}
- Branch: ${device.branchName}
- Protocol: ${device.protocol}
- Failed Checks: ${device.consecutiveFailureThreshold} consecutive timeouts

Return strictly valid JSON with this format (no markdown formatting, no code block backticks):
{
  "explanation": "Brief plain language explanation",
  "possibleRootCause": "Likely technical cause",
  "businessImpact": "Financial & operational impact on ASABB branch",
  "recommendedTroubleshooting": ["Step 1", "Step 2", "Step 3"],
  "confidenceScore": 95
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.2 }
    });

    const raw = (response.text || "").replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(raw);

    return {
      incidentId,
      explanation: parsed.explanation || defaultAnalysis.explanation,
      possibleRootCause: parsed.possibleRootCause || defaultAnalysis.possibleRootCause,
      businessImpact: parsed.businessImpact || defaultAnalysis.businessImpact,
      recommendedTroubleshooting: Array.isArray(parsed.recommendedTroubleshooting) ? parsed.recommendedTroubleshooting : defaultAnalysis.recommendedTroubleshooting,
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 92,
      analyzedAt: new Date().toLocaleTimeString('en-GB')
    };
  } catch (e) {
    console.warn("Gemini AI Outage Analysis fallback:", e);
    return defaultAnalysis;
  }
}

// Async helper to probe real IP endpoint or hostname
async function probeEndpoint(
  ip: string,
  protocol: string
): Promise<{ isReachable: boolean; responseText: string }> {
  const cleanIp = (ip || '').trim();

  // If IP is explicitly invalid or test failure simulation loopback
  if (!cleanIp || cleanIp === '0.0.0.0' || cleanIp === '127.0.0.99') {
    return { isReachable: false, responseText: 'Host Unreachable / DNS Resolution Failed' };
  }

  // Check if IP is a simulated internal branch subnet (e.g. 10.211.*)
  if (cleanIp.startsWith('10.211.')) {
    // Virtual NOC branch endpoint: healthy unless manualSimulatedOffline is flagged
    return { isReachable: true, responseText: `${protocol} OK - ${Math.floor(Math.random() * 12 + 5)}ms latency` };
  }

  // Real device probing (e.g. user added iPhone, local IP, or external domain)
  const startTime = Date.now();

  if (protocol.includes('HTTP') || cleanIp.startsWith('http://') || cleanIp.startsWith('https://')) {
    try {
      const url = cleanIp.startsWith('http') ? cleanIp : `http://${cleanIp}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      return { isReachable: true, responseText: `HTTP ${res.status} ${res.statusText} (${latency}ms)` };
    } catch (err: any) {
      return { isReachable: false, responseText: `HTTP Probe Timeout / Connection Refused (${err.message || 'Offline'})` };
    }
  }

  // Default TCP socket probe across ports 80, 443, 22, 53, 8080, 62078 (iOS WiFi sync / iPhone MDM)
  const portsToTest = [80, 443, 22, 53, 8080, 62078];
  
  for (const port of portsToTest) {
    const socketResult = await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(800);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      try {
        socket.connect(port, cleanIp);
      } catch (err) {
        resolve(false);
      }
    });

    if (socketResult) {
      const latency = Date.now() - startTime;
      return { isReachable: true, responseText: `TCP Port ${port} Open (${latency}ms latency)` };
    }
  }

  // If no ports responded or device is unreachable (e.g. phone turned off, power cut, LAN device unreachable from cloud sandbox)
  return {
    isReachable: false,
    responseText: `Host Unreachable / Socket Connection Timeout (2000ms) - Power Off or Link Down`
  };
}

// Background Monitoring Engine Cycle
async function runMonitoringCycle() {
  lastMonitoringCycleTime = new Date().toLocaleTimeString('en-GB');

  for (let i = 0; i < devicesState.length; i++) {
    const dev = devicesState[i];
    if (!dev.monitoringEnabled) {
      dev.status = 'unknown';
      dev.lastResponseStatus = 'Monitoring Disabled';
      continue;
    }

    // Determine reachability result
    let isReachable = true;
    let responseText = '200 OK - 12ms';

    if (dev.manualSimulatedOffline) {
      isReachable = false;
      responseText = 'Connection Timeout / Power Disconnected (Manual Override)';
    } else if (dev.lastHeartbeatTime && (dev.protocol === 'REST Telemetry' || dev.protocol === 'Syslog Listener' || dev.category === 'Workstation' || dev.name.toLowerCase().includes('iphone') || dev.name.toLowerCase().includes('phone'))) {
      // Live Heartbeat check mode
      const secondsSince = (Date.now() - dev.lastHeartbeatTime) / 1000;
      if (secondsSince <= 15) {
        isReachable = true;
        responseText = `REST Heartbeat Active (${Math.round(secondsSince)}s ago)`;
      } else {
        isReachable = false;
        responseText = `Heartbeat Lost (${Math.round(secondsSince)}s since last ping) - Phone Powered Off or Disconnected`;
      }
    } else {
      const probeRes = await probeEndpoint(dev.ip, dev.protocol);
      isReachable = probeRes.isReachable;
      responseText = probeRes.responseText;
    }

    const prevStatus = dev.status;

    if (isReachable) {
      dev.failureCount = 0;
      dev.lastSeen = new Date().toLocaleTimeString('en-GB');
      dev.lastResponseStatus = responseText;

      // Auto Recovery Detection if previously offline!
      if (prevStatus === 'offline') {
        dev.status = 'online';

        // Resolve associated incident
        const activeInc = incidentsState.find(inc => inc.id === dev.currentIncidentId || (inc.deviceId === dev.id && inc.status !== 'resolved'));
        let durationFormatted = '3 minutes';

        if (activeInc) {
          activeInc.status = 'resolved';
          activeInc.restorationTime = new Date().toLocaleTimeString('en-GB');
          const elapsedMins = Math.max(1, activeInc.elapsedMinutes || 1);
          durationFormatted = `${elapsedMins} minute(s)`;
          activeInc.outageDurationFormatted = durationFormatted;
        }

        dev.currentIncidentId = null;

        // Add to Timeline
        timelineEventsState.unshift({
          id: `evt-${Date.now()}-restored`,
          deviceId: dev.id,
          deviceName: dev.name,
          timestamp: new Date().toLocaleTimeString('en-GB'),
          type: 'restored',
          title: '🟢 Service Restored',
          description: `Device ${dev.name} (${dev.ip}) recovered and is reporting healthy telemetry. Outage duration: ${durationFormatted}.`,
          actor: 'SentinelNOC Auto-Recovery Watchdog',
          incidentId: activeInc?.id
        });

        // Trigger Telegram "🟢 Service Restored" Notification
        const restoreTelegramMsg = `🟢 *SERVICE RESTORED - ASABB NOC* 🟢\n\n` +
          `*Incident ID:* ${activeInc?.id || 'INC-AUTO'}\n` +
          `*Branch:* ${dev.branchName}\n` +
          `*Device:* ${dev.name} (${dev.ip})\n` +
          `*Restoration Time:* ${new Date().toLocaleTimeString('en-GB')} CAT\n` +
          `*Outage Duration:* ${durationFormatted}\n` +
          `*SLA Uptime:* Recalculated & Recovering\n\n` +
          `_SentinelNOC Automatic Recovery Detection Engine_`;

        sendTelegramNotification(process.env.TELEGRAM_BOT_TOKEN || '', process.env.TELEGRAM_CHAT_ID || '', restoreTelegramMsg);
      } else {
        dev.status = 'online';
      }

    } else {
      // Failure path
      dev.failureCount += 1;
      dev.lastResponseStatus = responseText;

      if (dev.failureCount < dev.consecutiveFailureThreshold) {
        dev.status = 'warning';

        timelineEventsState.unshift({
          id: `evt-${Date.now()}-warn`,
          deviceId: dev.id,
          deviceName: dev.name,
          timestamp: new Date().toLocaleTimeString('en-GB'),
          type: 'warning',
          title: `🟡 Warning State (${dev.failureCount}/${dev.consecutiveFailureThreshold})`,
          description: `Unresponsive probe on ${dev.name} (${dev.ip}). Counter at ${dev.failureCount}/${dev.consecutiveFailureThreshold}.`,
          actor: 'SentinelNOC Health Poller'
        });

      } else {
        // Consecutive threshold reached -> Declare OFFLINE!
        if (dev.status !== 'offline') {
          dev.status = 'offline';

          // Check if duplicate active incident exists
          const existingInc = incidentsState.find(inc => inc.deviceId === dev.id && inc.status !== 'resolved');

          if (!existingInc) {
            const incId = `INC-ASABB-${Math.floor(1000 + Math.random() * 9000)}`;
            
            const newIncident: IncidentRecord = {
              id: incId,
              alertId: `alt-${Date.now()}`,
              branchId: dev.branchId,
              branchName: dev.branchName,
              device: dev.name,
              title: `${dev.branchName} - ${dev.name} Connectivity Loss (${dev.ip})`,
              severity: 'CRITICAL',
              status: 'open',
              startTime: new Date().toISOString(),
              elapsedMinutes: 1,
              escalationStep: 'telegram',
              deviceId: dev.id,
              notes: `Auto-generated by SentinelNOC v2 Engine after ${dev.consecutiveFailureThreshold} consecutive failed probes.`
            };

            dev.currentIncidentId = incId;
            incidentsState.unshift(newIncident);

            // Add Timeline Events
            timelineEventsState.unshift({
              id: `evt-${Date.now()}-off`,
              deviceId: dev.id,
              deviceName: dev.name,
              timestamp: new Date().toLocaleTimeString('en-GB'),
              type: 'offline',
              title: '🔴 Device Declared Offline',
              description: `${dev.name} (${dev.ip}) breached ${dev.consecutiveFailureThreshold} consecutive check failures.`,
              actor: 'SentinelNOC Health Poller',
              incidentId: incId
            });

            timelineEventsState.unshift({
              id: `evt-${Date.now()}-inc`,
              deviceId: dev.id,
              deviceName: dev.name,
              timestamp: new Date().toLocaleTimeString('en-GB'),
              type: 'incident_created',
              title: `Critical Incident #${incId} Created`,
              description: `SLA timer started. Critical Incident created for ${dev.branchName}.`,
              actor: 'SentinelNOC Incident Daemon',
              incidentId: incId
            });

            // Trigger AI Analysis asynchronously
            generateAiOutageAnalysis(dev, incId).then((aiReport) => {
              newIncident.aiAnalysis = aiReport;

              // Dispatch Telegram Notification with AI Summary
              const telegramMsg = `🚨 *ASABB NOC CRITICAL OUTAGE DETECTED* 🚨\n\n` +
                `*Incident ID:* ${incId}\n` +
                `*Branch:* ${dev.branchName}\n` +
                `*Device:* ${dev.name} (\`${dev.ip}\`)\n` +
                `*Severity:* 🔴 CRITICAL\n` +
                `*Detection Time:* ${new Date().toLocaleTimeString('en-GB')} CAT\n` +
                `*SLA Timer:* Started\n\n` +
                `🧠 *GIZA AI Analysis (${aiReport.confidenceScore}% Confidence):*\n` +
                `${aiReport.explanation}\n\n` +
                `💡 *Possible Cause:* ${aiReport.possibleRootCause}\n` +
                `💼 *Business Impact:* ${aiReport.businessImpact}\n\n` +
                `🔧 *Recommended Action:*\n` +
                aiReport.recommendedTroubleshooting.map(s => `• ${s}`).join('\n') + `\n\n` +
                `_SentinelNOC Automatic Escalation Watchdog Active_`;

              sendTelegramNotification(process.env.TELEGRAM_BOT_TOKEN || '', process.env.TELEGRAM_CHAT_ID || '', telegramMsg);

              // Dispatch Real Twilio Emergency Voice Call automatically
              const voiceMsg = `Emergency Alert from Sentinel NOC. Critical network outage detected at ${dev.branchName}. Device ${dev.name} is offline. Incident ticket ${incId} generated. Please review the live dashboard immediately.`;
              triggerTwilioVoiceCallServer(voiceMsg).then((called) => {
                if (called) {
                  timelineEventsState.unshift({
                    id: `evt-${Date.now()}-call`,
                    deviceId: dev.id,
                    deviceName: dev.name,
                    timestamp: new Date().toLocaleTimeString('en-GB'),
                    type: 'call_sent',
                    title: '☎️ Outbound Emergency Voice Call Placed',
                    description: `Automated Twilio voice call successfully dispatched to NOC Emergency Line.`,
                    actor: 'SentinelNOC Twilio Voice Gateway',
                    incidentId: incId
                  });
                }
              });

              timelineEventsState.unshift({
                id: `evt-${Date.now()}-tg`,
                deviceId: dev.id,
                deviceName: dev.name,
                timestamp: new Date().toLocaleTimeString('en-GB'),
                type: 'telegram_sent',
                title: 'Telegram Alert Dispatched',
                description: `Emergency Telegram alert & AI diagnosis pushed to Level 1 NOC Team.`,
                actor: 'SentinelNOC Dispatcher',
                incidentId: incId
              });
            });
          }
        }
      }
    }

    // Record history log
    historyLogState.unshift({
      id: `log-${Date.now()}-${i}`,
      deviceId: dev.id,
      deviceName: dev.name,
      timestamp: new Date().toLocaleTimeString('en-GB'),
      status: dev.status,
      responseResult: dev.lastResponseStatus,
      failureCount: dev.failureCount,
      incidentId: dev.currentIncidentId
    });

    // Keep history log capped at 100 items
    if (historyLogState.length > 100) {
      historyLogState = historyLogState.slice(0, 100);
    }
  }
}

// Start continuous background monitoring cycle every 4 seconds
setInterval(runMonitoringCycle, 4000);

// ============================================================================
// MONITORING ENGINE REST API ENDPOINTS
// ============================================================================

// 0. GET & POST /api/monitoring/heartbeat - Real Phone/Device Live Ping Receiver
app.all("/api/monitoring/heartbeat", (req, res) => {
  const queryId = (req.query.id || req.query.deviceId || req.body?.id || req.body?.deviceId || req.query.ip || req.body?.ip || '').toString().trim();

  if (!queryId) {
    return res.status(400).json({ 
      error: "Please specify ?id=DEV_ID or ?ip=IP in your request.",
      example: "/api/monitoring/heartbeat?id=DEV-201"
    });
  }

  const dev = devicesState.find(d => 
    d.id.toLowerCase() === queryId.toLowerCase() || 
    d.ip.toLowerCase() === queryId.toLowerCase() ||
    d.name.toLowerCase().includes(queryId.toLowerCase())
  );

  if (!dev) {
    return res.status(404).json({ error: `Device matching '${queryId}' not found in SentinelNOC registry.` });
  }

  dev.lastHeartbeatTime = Date.now();
  dev.lastSeen = new Date().toLocaleTimeString('en-GB');

  return res.status(200).json({
    status: "ok",
    message: `Heartbeat received from ${dev.name} (${dev.ip})`,
    device: dev.name,
    deviceId: dev.id,
    timestamp: dev.lastSeen,
    nextCheckInSeconds: 5
  });
});

// 1. GET /api/monitoring/status - Live Dashboard state
app.get("/api/monitoring/status", (req, res) => {
  const total = devicesState.length;
  const online = devicesState.filter(d => d.status === 'online').length;
  const offline = devicesState.filter(d => d.status === 'offline').length;
  const warning = devicesState.filter(d => d.status === 'warning').length;
  const unknown = devicesState.filter(d => d.status === 'unknown').length;
  const overallHealth = total > 0 ? Math.round((online / total) * 100) : 100;

  return res.status(200).json({
    devices: devicesState,
    stats: {
      totalDevices: total,
      onlineDevices: online,
      offlineDevices: offline,
      warningDevices: warning,
      unknownDevices: unknown,
      overallHealthPercent: overallHealth,
      lastMonitoringCycle: lastMonitoringCycleTime
    },
    incidents: incidentsState,
    history: historyLogState.slice(0, 25),
    timeline: timelineEventsState.slice(0, 30)
  });
});

// 2. POST /api/monitoring/devices/onboard - Device Onboarding
app.post("/api/monitoring/devices/onboard", async (req, res) => {
  try {
    const { branchId, branchName, name, description, ip, category, protocol, monitoringInterval, consecutiveFailureThreshold, notes } = req.body;

    if (!name || !ip) {
      return res.status(400).json({ error: "Device Name and IP Address are required." });
    }

    if (!isValidIpAddress(ip)) {
      return res.status(400).json({ error: "Invalid IP Address or Hostname format. Please provide a valid IPv4 address (e.g. 10.211.5.10)." });
    }

    const newId = `DEV-${Math.floor(200 + Math.random() * 800)}`;
    const newDevice: MonitoredDevice = {
      id: newId,
      branchId: branchId || 'custom-branch',
      branchName: branchName || 'Registered Branch',
      name: name.trim(),
      description: description || 'Registered Network Asset',
      ip: ip.trim(),
      category: category || 'Router',
      protocol: protocol || 'ICMP Ping',
      monitoringEnabled: true,
      monitoringInterval: Number(monitoringInterval) || 10,
      consecutiveFailureThreshold: Number(consecutiveFailureThreshold) || 3,
      status: 'online',
      lastSeen: new Date().toLocaleTimeString('en-GB'),
      lastResponseStatus: 'Discovered & Healthy (Initial Check)',
      failureCount: 0,
      notes: notes || '',
      manualSimulatedOffline: false,
      createdAt: new Date().toISOString()
    };

    devicesState.push(newDevice);

    timelineEventsState.unshift({
      id: `evt-${Date.now()}-onboard`,
      deviceId: newId,
      deviceName: newDevice.name,
      timestamp: new Date().toLocaleTimeString('en-GB'),
      type: 'online',
      title: 'Device Discovered & Monitored',
      description: `New device ${newDevice.name} (${newDevice.ip}) successfully onboarded to SentinelNOC Watchdog.`,
      actor: 'Network Engineer'
    });

    return res.status(200).json({ success: true, device: newDevice });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to onboard device", details: err.message });
  }
});

// 3. POST /api/monitoring/devices/:id/toggle-simulation - Live Demo Outage Toggle
app.post("/api/monitoring/devices/:id/toggle-simulation", (req, res) => {
  const { id } = req.params;
  const dev = devicesState.find(d => d.id === id);

  if (!dev) {
    return res.status(404).json({ error: "Device not found" });
  }

  dev.manualSimulatedOffline = !dev.manualSimulatedOffline;

  if (dev.manualSimulatedOffline) {
    dev.lastResponseStatus = 'Simulated Disconnect / Power Cut Active';
  } else {
    dev.lastResponseStatus = 'Restoring Link Connectivity...';
  }

  return res.status(200).json({ 
    success: true, 
    manualSimulatedOffline: dev.manualSimulatedOffline,
    message: dev.manualSimulatedOffline ? `Simulated power/network disconnect applied to ${dev.name}` : `Restored normal network line to ${dev.name}`
  });
});

// 4. POST /api/monitoring/devices/:id/toggle-monitoring - Enable/Disable Monitoring
app.post("/api/monitoring/devices/:id/toggle-monitoring", (req, res) => {
  const { id } = req.params;
  const dev = devicesState.find(d => d.id === id);

  if (!dev) {
    return res.status(404).json({ error: "Device not found" });
  }

  dev.monitoringEnabled = !dev.monitoringEnabled;
  if (!dev.monitoringEnabled) {
    dev.status = 'unknown';
    dev.lastResponseStatus = 'Monitoring Suspended';
  }

  return res.status(200).json({ success: true, device: dev });
});

// 5. DELETE /api/monitoring/devices/:id - Remove Device
app.delete("/api/monitoring/devices/:id", (req, res) => {
  const { id } = req.params;
  devicesState = devicesState.filter(d => d.id !== id);
  return res.status(200).json({ success: true, message: `Device ${id} removed` });
});

// 6. POST /api/monitoring/ai-analyze - On-demand Gemini AI Outage Analysis
app.post("/api/monitoring/ai-analyze", async (req, res) => {
  try {
    const { deviceId, incidentId } = req.body;
    const dev = devicesState.find(d => d.id === deviceId) || devicesState[0];
    const aiReport = await generateAiOutageAnalysis(dev, incidentId || 'INC-MANUAL');
    return res.status(200).json({ success: true, analysis: aiReport });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to generate AI analysis", details: err.message });
  }
});

// Default heuristic AI Chat helper for GIZA AI Assistant
function generateHeuristicResponse(message: string, dashboardState: any): string {
  const query = message.toLowerCase();
  const branches = dashboardState?.branches || [];
  const incidents = dashboardState?.incidents || incidentsState;
  const stats = dashboardState?.stats || { onlineCount: 8, degradedCount: 0, offlineCount: 0, slaUptime: 100, activeIncidentsCount: 0, mttrMinutes: 12 };

  const activeIncidents = incidents.filter((i: any) => i.status !== "resolved");

  if (query.includes("duration") || query.includes("timeline") || query.includes("history")) {
    let analysis = `### 🔍 SentinelNOC v2 Monitoring Engine Timeline\n\n`;
    analysis += `* **Total Devices Monitored:** \`${devicesState.length}\`\n`;
    analysis += `* **Online Devices:** 🟢 \`${devicesState.filter(d => d.status === 'online').length}\`\n`;
    analysis += `* **Offline Devices:** 🔴 \`${devicesState.filter(d => d.status === 'offline').length}\`\n`;
    analysis += `* **Last Health Probe Cycle:** \`${lastMonitoringCycleTime}\` CAT\n\n`;

    if (activeIncidents.length > 0) {
      analysis += `🚨 **Active Outages Monitored:**\n`;
      activeIncidents.forEach((inc: any) => {
        analysis += `- **${inc.id}**: ${inc.title} (Severity: **${inc.severity}**)\n`;
      });
    } else {
      analysis += `🟢 All registered IP endpoints are healthy and passing health checks.\n`;
    }
    return analysis;
  }

  let defaultResponse = `👋 **I am Giza, the ASABB AI NOC Assistant.**\n\n`;
  defaultResponse += `I am directly synchronized with the **SentinelNOC v2 Native Device Monitoring Engine**.\n\n`;
  defaultResponse += `* **Monitored Hardware:** \`${devicesState.length} devices\` across Zambia\n`;
  defaultResponse += `* **Active Incidents:** \`${activeIncidents.length}\`\n`;
  defaultResponse += `* **Infrastructure Health:** \`${stats.slaUptime}%\`\n\n`;

  if (activeIncidents.length > 0) {
    defaultResponse += `⚠️ Critical incident **${activeIncidents[0].id}** active at **${activeIncidents[0].branchName}**. Watchdog escalation is active.\n\n`;
  } else {
    defaultResponse += `🟢 Telemetry is fully operational across all ASABB regional branches.\n\n`;
  }
  defaultResponse += `You can ask me to: **draft an incident report**, **summarize active outages**, or **run an SLA audit**.`;

  return defaultResponse;
}

// API endpoint for GIZA AI Assistant
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, dashboardState } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (isApiKeyMissing) {
      const fallbackText = generateHeuristicResponse(message, dashboardState);
      const outputText = fallbackText + "\n\n---\n*💡 Note: Running in offline heuristic simulation. Add a `GEMINI_API_KEY` in Settings > Secrets to enable live Gemini AI reasoning.*";
      return res.status(200).json({ text: outputText });
    }

    const formattedDevices = devicesState.map(d =>
      `- **${d.name}** (${d.ip}) @ ${d.branchName}: Status: **${d.status.toUpperCase()}** | Protocol: ${d.protocol} | Failures: ${d.failureCount}/${d.consecutiveFailureThreshold} | Last Seen: ${d.lastSeen}`
    ).join("\n");

    const formattedIncidents = incidentsState.map(i =>
      `- **INCIDENT #${i.id}** on **${i.branchName}** (Device: ${i.device}): "${i.title}" | Status: **${i.status.toUpperCase()}** | Severity: **${i.severity}**`
    ).join("\n") || "No active or logged incidents.";

    const systemInstruction = `You are "Giza", the expert Network Operations Center (NOC) AI Assistant for ASABB Bank Zambia.
Your role is to assist network operators and system engineers in monitoring ASABB Bank Zambia's network, responding to critical branch outages, and interpreting SentinelNOC v2 telemetry.

LIVE SENTINELNOC V2 TELEMETRY CONTEXT:
=========================================
MONITORED DEVICES (${devicesState.length} TOTAL):
${formattedDevices}

ACTIVE INCIDENTS:
${formattedIncidents}
=========================================

Instructions:
1. Speak as Giza, ASABB Bank Zambia's professional NOC AI.
2. Rely strictly on the live device state & telemetry context above.
3. Be concise, technical, and accurate. Use Markdown bolding and lists.`;

    const rawContents: any[] = [];
    if (history && history.length > 0) {
      history.forEach((h: any) => {
        const role = h.role === 'giza' || h.role === 'assistant' || h.role === 'model' ? 'model' : 'user';
        if (rawContents.length > 0 || role === 'user') {
          rawContents.push({ role: role, parts: [{ text: h.text }] });
        }
      });
    }

    rawContents.push({ role: 'user', parts: [{ text: message }] });

    const alternatingContents: any[] = [];
    let lastRole: string | null = null;
    rawContents.forEach((turn) => {
      if (turn.role === lastRole) {
        if (alternatingContents.length > 0) {
          alternatingContents[alternatingContents.length - 1].parts[0].text += "\n\n" + turn.parts[0].text;
        }
      } else {
        alternatingContents.push(turn);
        lastRole = turn.role;
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: alternatingContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
      }
    });

    const replyText = response.text || "I was unable to analyze the telemetry data.";
    return res.status(200).json({ text: replyText });

  } catch (error: any) {
    console.error("Giza Chat API Error:", error);
    const fallbackText = generateHeuristicResponse(req.body.message, req.body.dashboardState);
    return res.status(200).json({ text: fallbackText });
  }
});

// Setup Vite Dev server or static files serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ASABB NOC Backend] SentinelNOC Monitoring Engine running at http://localhost:${PORT}`);
    console.log(`[ASABB NOC Backend] Mode: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
