const http = require('http');
const server = http.createServer((req, res) => {
  res.end('ok');
});
server.listen(5002, () => {
  console.log('Listening on 5002');
});
