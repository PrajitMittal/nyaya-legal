#!/bin/bash
cd "$(dirname "$0")/backend" && python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
