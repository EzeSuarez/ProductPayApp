const fs = require('fs');
const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  
  // 1. Upload the file
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('SFTP :: ready');
    
    const readStream = fs.createReadStream('app.tar.gz');
    const writeStream = sftp.createWriteStream('app.tar.gz');
    
    writeStream.on('close', () => {
      console.log('File transferred successfully');
      
      // 2. Execute commands
      const cmd = `
        mkdir -p ProductPayApp && 
        tar -xzf app.tar.gz -C ProductPayApp && 
        cd ProductPayApp && 
        sudo -S apt update && 
        sudo -S apt install -y nodejs npm && 
        npm install --prefix server && 
        npm install --prefix client && 
        npm run build && 
        sudo -S docker-compose up -d postgres &&
        sudo pkill node || true &&
        nohup npm run start:server > server.log 2>&1 &
      `;
      
      conn.exec(cmd, { pty: true }, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
        }).on('data', (data) => {
          console.log('STDOUT: ' + data);
          // Auto-fill sudo password
          if (data.toString().includes('password')) {
            stream.write('cu4lqu13r4\n');
          }
        }).stderr.on('data', (data) => {
          console.log('STDERR: ' + data);
        });
      });
    });
    
    readStream.pipe(writeStream);
  });
}).connect({
  host: '108.167.58.201',
  port: 22022,
  username: 'eze',
  password: 'cu4lqu13r4'
});
