const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '108.167.58.201',
  port: 22022,
  username: 'eze',
  password: 'cu4lqu13r4',
  readyTimeout: 30000,
};

conn.on('ready', () => {
  console.log('Connected to VPS...');
  const cmd = `echo "${config.password}" | sudo -S docker rm -f productpay_tunnel 2>/dev/null || true
echo "${config.password}" | sudo -S docker run -d --name productpay_tunnel --restart always --network host node:20-alpine npx -y localtunnel --port 80 --subdomain tender-moose-knock
sleep 5
echo "${config.password}" | sudo -S docker logs productpay_tunnel
`;

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (code) => {
      console.log(`\nScript exited with code ${code}`);
      conn.end();
    });
  });
});

conn.on('error', (err) => {
  console.error('SSH Error:', err);
});

conn.connect(config);
