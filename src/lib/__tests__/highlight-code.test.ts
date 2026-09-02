import { highlightCode } from '@/lib/highlight-code';
import {
  buildPartnerEndpointGo,
  buildPartnerEndpointJavaScript,
  buildPartnerEndpointPhp,
  buildPartnerEndpointPython,
  partnerWebhookSignatureExamples,
} from '@/lib/partner-api/docs-snippets';
import {
  buildPartnerEndpointCurl,
  partnerEndpointCatalog,
  partnerResponseExamples,
} from '@/lib/partner-api/docs-content';

const sample = partnerEndpointCatalog[0];

describe('highlightCode', () => {
  it('tokenizes javascript keywords and strings', () => {
    const html = highlightCode(buildPartnerEndpointJavaScript(sample), 'javascript');
    expect(html).toContain('hljs-keyword');
    expect(html).toContain('hljs-string');
    expect(html).not.toContain('<script');
  });

  it('tokenizes python, php, go, bash and json examples', () => {
    expect(highlightCode(buildPartnerEndpointPython(sample), 'python')).toContain('hljs-keyword');
    expect(highlightCode(buildPartnerEndpointPhp(sample), 'php')).toContain('hljs-variable');
    expect(highlightCode(buildPartnerEndpointGo(sample), 'go')).toContain('hljs-keyword');
    expect(highlightCode(buildPartnerEndpointCurl(sample), 'bash')).toContain('hljs-string');
    expect(highlightCode(partnerResponseExamples.webhook, 'json')).toContain('hljs-attr');
  });

  it('tokenizes webhook signature snippets', () => {
    expect(highlightCode(partnerWebhookSignatureExamples.node, 'javascript')).toContain('hljs-keyword');
    expect(highlightCode(partnerWebhookSignatureExamples.python, 'python')).toContain('hljs-keyword');
    expect(highlightCode(partnerWebhookSignatureExamples.php, 'php')).toContain('hljs-variable');
    expect(highlightCode(partnerWebhookSignatureExamples.go, 'go')).toContain('hljs-keyword');
  });

  it('escapes plaintext instead of injecting html', () => {
    const html = highlightCode('<script>alert(1)</script>', 'plaintext');
    expect(html).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
