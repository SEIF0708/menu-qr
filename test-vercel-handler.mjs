import http from 'http';
import handler from './.vercel/output/functions/__nitro.func/index.cjs';

const server = http.createServer((req, res) => {
  handler(req, res).catch(err => {
    console.error("Handler error:", err);
    res.statusCode = 500;
    res.end("Error");
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
  fetch('http://localhost:3000/').then(r => r.text()).then(t => {
    console.log("Response length:", t.length);
    console.log("Response start:", t.substring(0, 100));
    server.close();
  });
});
