export function getPostAuthTarget(location, redirectParam) {
  const savedLocation = location.state?.from;
  const savedPath = savedLocation
    ? `${savedLocation.pathname || '/'}${savedLocation.search || ''}${savedLocation.hash || ''}`
    : '';
  const candidate = savedPath || redirectParam;

  if (typeof candidate !== 'string'
      || !candidate.startsWith('/')
      || candidate.startsWith('//')
      || candidate.includes('\\')) {
    return '/';
  }

  const target = new URL(candidate, window.location.origin);
  if (target.origin !== window.location.origin
      || target.pathname === '/login'
      || target.pathname === '/register') {
    return '/';
  }

  return `${target.pathname}${target.search}${target.hash}`;
}
