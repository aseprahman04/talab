module.exports = {
  apps: [{
    name: 'talab-frontend',
    script: '/opt/talab/frontend/.next/standalone/frontend/server.js',
    cwd: '/opt/talab/frontend/.next/standalone/frontend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3021,
      HOSTNAME: '127.0.0.1',
    },
    max_memory_restart: '512M',
    error_file: '/var/log/talab/frontend-err.log',
    out_file: '/var/log/talab/frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    watch: false,
  }]
};
