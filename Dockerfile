FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Expo ports
EXPOSE 19000 19001 19002

# Start Expo
CMD ["npm", "start"]
