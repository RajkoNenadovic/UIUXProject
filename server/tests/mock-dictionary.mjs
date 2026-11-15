// Fake dictionary provider so the failure cases (429, 500, garbage, timeout) can be tested on demand.
import http from 'node:http';

let hits = 0;
const server = http.createServer((req, res) => {
  const word = decodeURIComponent(req.url.split('/').pop());
  if (word === '__hits') { res.end(String(hits)); return; }
  hits += 1;
  const json = (code, body) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };
  if (word === 'forbearance') {
    return json(200, [{
      word: 'forbearance', phonetic: '/fɔːˈbɛːrəns/', phonetics: [],
      meanings: [
        { partOfSpeech: 'noun', definitions: [{ definition: 'Patient self-control; restraint.', example: 'Show forbearance.' }, { definition: 'A refusal to enforce a right.' }] },
        { partOfSpeech: 'verb', definitions: [{ definition: 'x' }] }
      ],
      license: { name: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0' },
      sourceUrls: ['https://en.wiktionary.org/wiki/forbearance']
    }]);
  }
  if (word === 'missing') return json(404, { title: 'No Definitions Found' });
  if (word === 'limited') return json(429, { title: 'Too many requests' });
  if (word === 'broken') return json(500, 'oops');
  if (word === 'garbage') return json(200, '<html>not json');
  if (word === 'emptyarr') return json(200, []);
  if (word === 'weird') return json(200, [{ word: 'weird', meanings: 'nope' }]);
  if (word === 'teapot') return json(418, {});
  if (word === 'slow') { setTimeout(() => json(200, []), 3000); return; }
  if (word === 'reset') { req.socket.destroy(); return; }
  return json(404, {});
});
server.listen(3199);
