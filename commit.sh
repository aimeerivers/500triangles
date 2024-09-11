#!/bin/bash

echo "hello";

time=$(date "+%Y-%m-%d %H:%M")

git checkout updates && \
  git add . && \
  git commit -m "chore: update progress at $time" && \
  git push origin updates;
