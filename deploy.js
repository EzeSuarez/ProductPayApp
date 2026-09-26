const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '108.167.58.201',
  port: 22022,
  username: 'eze',
  password: 'cu4lqu13r4',
  readyTimeout: 99999
};

const commands = [
  'sudo ufw allow 80/tcp || true',
  'sudo ufw allow 8080/tcp || true',
  'sudo apt-get update -y',
  'sudo apt-get install -y docker.io docker-compose-v2 git',
  'sudo systemctl start docker',
  'sudo systemctl enable docker',
  'rm -rf ProductPayApp',
  'git clone https://github.com/EzeSuarez/ProductPayApp.git',
  'sudo sh -c "cd ProductPayApp && docker compose -f docker-compose.prod.yml up -d --build"'
];

conn.on('ready', () => {
  console.log('Client :: ready');
  
  let i = 0;
  function execNext() {
    if (i >= commands.length) {
      console.log('All commands executed successfully!');
      conn.end();
      return;
    }
    const cmd = commands[i];
    console.log(`Executing: ${cmd}`);
    
    // For sudo commands, we need to pass the password via stdin
    const execCmd = cmd.startsWith('sudo') ? `echo "${config.password}" | sudo -S ${cmd.substring(5)}` : cmd;
    
    conn.exec(execCmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        console.log(`Command closed with code ${code}`);
        i++;
        execNext();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }
  
  execNext();
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect(config);
