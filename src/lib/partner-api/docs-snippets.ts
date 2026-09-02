type SnippetEndpoint = {
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  body?: string;
  query?: string;
};

const BASE_URL = 'https://www.moonskin.eu';
const API_KEY = 'msk_live_YOUR_KEY';

export type PartnerCodeLang = 'javascript' | 'python' | 'php' | 'go';

function partnerEndpointUrl(endpoint: SnippetEndpoint): string {
  const path = endpoint.path.replace('{id}', 'TRADE-123');
  return `${BASE_URL}${path}${endpoint.query ?? ''}`;
}

function parsedBody(endpoint: SnippetEndpoint): unknown | null {
  if (!endpoint.body) return null;
  return JSON.parse(endpoint.body) as unknown;
}

export function buildPartnerEndpointJavaScript(endpoint: SnippetEndpoint): string {
  const url = partnerEndpointUrl(endpoint);
  const body = parsedBody(endpoint);
  const headers = body
    ? `    Authorization: 'Bearer ${API_KEY}',\n    'Content-Type': 'application/json',`
    : `    Authorization: 'Bearer ${API_KEY}',`;
  const extra = body
    ? `,\n  body: JSON.stringify(${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')})`
    : '';
  return `const res = await fetch('${url}', {
  method: '${endpoint.method}',
  headers: {
${headers}
  }${extra}
});

if (!res.ok) {
  throw new Error(\`MoonSkin \${res.status}: \${await res.text()}\`);
}

const json = await res.json();
console.log(json);`;
}

export function buildPartnerEndpointPython(endpoint: SnippetEndpoint): string {
  const url = partnerEndpointUrl(endpoint);
  const body = parsedBody(endpoint);
  const method = endpoint.method.toLowerCase();
  const lines = [
    '# pip install requests',
    'import requests',
    '',
    `url = ${JSON.stringify(url)}`,
    `headers = {"Authorization": "Bearer ${API_KEY}"}`,
  ];
  if (body) {
    lines.push(`payload = ${JSON.stringify(body, null, 2)}`);
    lines.push('');
    lines.push(`res = requests.${method}(url, headers=headers, json=payload, timeout=30)`);
  } else {
    lines.push('');
    lines.push(`res = requests.${method}(url, headers=headers, timeout=30)`);
  }
  lines.push('res.raise_for_status()');
  lines.push('print(res.json())');
  return lines.join('\n');
}

export function buildPartnerEndpointPhp(endpoint: SnippetEndpoint): string {
  const url = partnerEndpointUrl(endpoint);
  const headers = endpoint.body
    ? `'Authorization: Bearer ${API_KEY}',\n    'Content-Type: application/json',`
    : `'Authorization: Bearer ${API_KEY}',`;
  const opts = [
    '  CURLOPT_RETURNTRANSFER => true,',
    '  CURLOPT_HTTPHEADER => [',
    `    ${headers}`,
    '  ],',
  ];
  if (endpoint.method === 'POST') {
    opts.push('  CURLOPT_POST => true,');
  } else if (endpoint.method !== 'GET') {
    opts.push(`  CURLOPT_CUSTOMREQUEST => '${endpoint.method}',`);
  }
  if (endpoint.body) {
    opts.push(`  CURLOPT_POSTFIELDS => '${endpoint.body.replace(/'/g, "\\'")}',`);
  }
  return `$ch = curl_init('${url}');
curl_setopt_array($ch, [
${opts.join('\n')}
]);
$raw = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($raw === false || $status >= 400) {
  throw new RuntimeException("MoonSkin HTTP $status: $raw");
}

$data = json_decode($raw, true);
print_r($data);`;
}

export function buildPartnerEndpointGo(endpoint: SnippetEndpoint): string {
  const url = partnerEndpointUrl(endpoint);
  const imports = endpoint.body
    ? `"fmt"
  "io"
  "net/http"
  "strings"`
    : `"fmt"
  "io"
  "net/http"`;
  const bodySetup = endpoint.body
    ? `\tbody := strings.NewReader(\`${endpoint.body}\`)\n\treq, err := http.NewRequest(http.Method${capitalizeMethod(endpoint.method)}, ${JSON.stringify(url)}, body)\n`
    : `\treq, err := http.NewRequest(http.Method${capitalizeMethod(endpoint.method)}, ${JSON.stringify(url)}, nil)\n`;
  const contentType = endpoint.body ? '\treq.Header.Set("Content-Type", "application/json")\n' : '';
  return `package main

import (
  ${imports}
)

func main() {
${bodySetup}\tif err != nil {
\t\tpanic(err)
\t}
\treq.Header.Set("Authorization", "Bearer ${API_KEY}")
${contentType}\tres, err := http.DefaultClient.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer res.Body.Close()
\traw, _ := io.ReadAll(res.Body)
\tfmt.Println(res.StatusCode, string(raw))
}`;
}

function capitalizeMethod(method: string): string {
  return method.charAt(0) + method.slice(1).toLowerCase();
}

export function buildPartnerEndpointSnippet(
  lang: PartnerCodeLang,
  endpoint: SnippetEndpoint
): string {
  if (lang === 'javascript') return buildPartnerEndpointJavaScript(endpoint);
  if (lang === 'python') return buildPartnerEndpointPython(endpoint);
  if (lang === 'php') return buildPartnerEndpointPhp(endpoint);
  return buildPartnerEndpointGo(endpoint);
}

export const partnerWebhookSignatureExamples = {
  node: `const crypto = require('crypto');
const header = req.headers['x-moonskin-signature']; // t=123,v1=abc...
const rawBody = req.rawBody; // raw unparsed body
const match = header.match(/t=(\\d+),v1=([a-f0-9]+)/);
const timestamp = parseInt(match[1], 10);
const provided = match[2];
const expected = crypto.createHmac('sha256', WEBHOOK_SECRET)
  .update(\`\${timestamp}.\${rawBody}\`)
  .digest('hex');
if (expected.length !== provided.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) {
  throw new Error('Invalid signature');
}
// Reject if |now - timestamp| > 300 seconds`,

  python: `import hashlib
import hmac
import re
import time

header = request.headers["X-MoonSkin-Signature"]  # t=123,v1=abc...
raw_body = request.get_data(as_text=True)  # unparsed body string
match = re.match(r"t=(\\d+),v1=([a-f0-9]+)", header)
timestamp, provided = int(match.group(1)), match.group(2)
if abs(time.time() - timestamp) > 300:
    raise ValueError("Expired timestamp")
expected = hmac.new(
    WEBHOOK_SECRET.encode(),
    f"{timestamp}.{raw_body}".encode(),
    hashlib.sha256,
).hexdigest()
if not hmac.compare_digest(expected, provided):
    raise ValueError("Invalid signature")`,

  php: `preg_match('/t=(\\d+),v1=([a-f0-9]+)/', $header, $match);
$timestamp = (int) $match[1];
$provided = $match[2];
if (abs(time() - $timestamp) > 300) {
  throw new RuntimeException('Expired timestamp');
}
$expected = hash_hmac('sha256', $timestamp . '.' . $rawBody, $webhookSecret);
if (!hash_equals($expected, $provided)) {
  throw new RuntimeException('Invalid signature');
}`,

  go: `package main

import (
  "crypto/hmac"
  "crypto/sha256"
  "encoding/hex"
  "fmt"
  "regexp"
  "strconv"
  "time"
)

var sigRe = regexp.MustCompile(\`t=(\\d+),v1=([a-f0-9]+)\`)

func verifyMoonSkinSignature(header, rawBody, secret string) error {
  parts := sigRe.FindStringSubmatch(header)
  if len(parts) != 3 {
    return fmt.Errorf("malformed signature header")
  }
  ts, _ := strconv.ParseInt(parts[1], 10, 64)
  if abs(time.Now().Unix()-ts) > 300 {
    return fmt.Errorf("expired timestamp")
  }
  mac := hmac.New(sha256.New, []byte(secret))
  mac.Write([]byte(fmt.Sprintf("%d.%s", ts, rawBody)))
  expected := hex.EncodeToString(mac.Sum(nil))
  if !hmac.Equal([]byte(expected), []byte(parts[2])) {
    return fmt.Errorf("invalid signature")
  }
  return nil
}

func abs(n int64) int64 {
  if n < 0 {
    return -n
  }
  return n
}`,
};
