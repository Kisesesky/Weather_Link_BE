#!/bin/bash

THRESHOLD=90   # CPU 사용률 % 기준
LOOP_INTERVAL=5 # 5초마다 체크

while true; do
  # CPU 많이 먹는 프로세스 찾기
  HIGH_CPU=$(ps -eo pid,ppid,cmd,%cpu --sort=-%cpu | awk -v threshold="$THRESHOLD" '$4 > threshold {print $1,$2,$3,$4}')

  if [[ ! -z "$HIGH_CPU" ]]; then
    echo "[`date`] High CPU usage detected:"
    echo "$HIGH_CPU"

    # 위험한 프로세스 죽이기
    echo "$HIGH_CPU" | awk '{print $1}' | xargs -r kill -9

    # 서버 재부팅 (옵션)
    echo "[`date`] Rebooting server due to high CPU usage..."
    sudo reboot
  fi

  sleep $LOOP_INTERVAL
done
