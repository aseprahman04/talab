module.exports = {
  apps: [{
    name: 'watether-frontend',
    script: '/opt/watether/frontend/.next/standalone/server.js',
    cwd: '/opt/watether/frontend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3004,
      HOSTNAME: '127.0.0.1',
    },
    max_memory_restart: '512M',
    error_file: '/var/log/watether/frontend-err.log',
    out_file: '/var/log/watether/frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    watch: false,
  }]
};
