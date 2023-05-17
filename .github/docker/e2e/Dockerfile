# Use the polybase image as the base image
FROM gcr.io/polybase-prenet/polybase:latest

# Set the working directory
WORKDIR /app

# Install node, yarn and other dependencies for your tests
USER root
RUN apt update && apt install -y nodejs npm
RUN npm install -g yarn

# Copy your polybase-ts directory into the container
COPY . /app/polybase-ts/

# Change ownership of the copied files and directories to the spaceman user
RUN chown -R spaceman:spaceman /app/polybase-ts

# Switch to the spaceman user and install the dependencies
USER spaceman
RUN cd /app/polybase-ts/packages/client && yarn install

# Run the binary in the background, run the tests and then stop the binary
CMD ["bash", "-c", "/usr/bin/polybase & p1=$! && cd /app/polybase-ts/packages/client && yarn test:e2e && kill \"$p1\" && echo \"Tests passed\""]