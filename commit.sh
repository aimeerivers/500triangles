#!/bin/bash

echo "hello";

time=$(date "+%Y-%m-%d %H:%M:%S")

git checkout updates && \
  git add . && \
  git commit -m "chore: update at $time"