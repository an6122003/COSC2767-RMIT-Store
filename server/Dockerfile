# Use an official Node.js runtime as the base image
# Use an official Node.js runtime as the base image
FROM node:17

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json into the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the server code to the working directory
COPY . .

# Expose the port the server listens on (e.g., 5000)
EXPOSE 3000

# Set the environment to production
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "index.js"]


### docker build -t mern-server .
### docker run -p 3000:3000 --env-file server/.env mern-server
