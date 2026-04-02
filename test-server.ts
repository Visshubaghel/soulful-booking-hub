import { createServer } from 'http';
import handler from './api/admin/slots.ts'; // with tsx we can import .ts

const server = createServer(async (req, res) => {
  // mock simplified Vercel request/response
  const vercelReq = {
    method: 'GET',
    query: { date: '2026-04-02' },
    headers: req.headers,
  };
  const vercelRes = {
    setHeader: (k, v) => res.setHeader(k, v),
    status: (code) => {
      res.statusCode = code;
      return vercelRes;
    },
    json: (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    },
    end: () => res.end(),
  };
  try {
    await handler(vercelReq as any, vercelRes as any);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end(err.message);
  }
});
server.listen(4000, () => {
    console.log("Test server running on 4000");
});
