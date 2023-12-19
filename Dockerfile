# Use an official Node.js runtime as a base image
FROM --platform=linux/amd64 node:16

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the necessary files for installing dependencies
COPY tsconfig*.json ./
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the source code
COPY src/ ./src/

# Build the TypeScript source code
RUN npm run build

# Copy the built artifacts to the working directory
COPY dist .

# Expose port 80
EXPOSE 80

# Specify the command to run your application
CMD ["node", "dist/index.js"]
