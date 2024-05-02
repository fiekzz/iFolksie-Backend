export GOOGLE_APPLICATION_CREDENTIALS=~/google-services.json
export NODE_ENV=production

pm2 start "GOOGLE_APPLICATION_CREDENTIALS=~/google-services.json bun run start" --name AG4U-Server
