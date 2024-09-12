#!/bin/bash

time=$(date "+%Y-%m-%d %H:%M");

while true; do
    time=$(date "+%Y-%m-%d %H:%M");

    git checkout updates && \
      git add . && \
      git commit -m "chore: update progress at $time" && \
      git push origin updates;
    
    # Pause for 1 hour (3600 seconds)
    sleep 3600;
done
