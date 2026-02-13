module.exports = {
  apps: [{
    name: 'battleship-backend',
    script: './dist/index.js',
    node_args: '--env-file=.env',
    env: {
      NODE_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
