export function ensureImagePreconnectForTests(): void {
  const preconnectHref = 'https://example.com';
  const selector = `link[rel="preconnect"][href="${preconnectHref}"]`;

  if (!document.head.querySelector(selector)) {
    const preconnectLink = document.createElement('link');
    preconnectLink.setAttribute('rel', 'preconnect');
    preconnectLink.setAttribute('href', preconnectHref);
    document.head.appendChild(preconnectLink);
  }
}
