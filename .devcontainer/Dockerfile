FROM mcr.microsoft.com/devcontainers/javascript-node:latest

# Install additional packages useful for development.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends git curl procps \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
