#!/bin/bash

# 허용된 컨테이너 이름 리스트
ALLOWED_CONTAINERS=("weather_link_nginx" "weather_link_app" "weather_link_db" "weather_link_certbot")

# CPU 사용량 기준 (퍼센트) - 이걸 넘으면 서버 재부팅
CPU_THRESHOLD=90

# 비정상 컨테이너 감지 및 제거
for container_id in $(docker ps -q); do
    container_name=$(docker inspect --format '{{.Name}}' "$container_id" | sed 's/^\/\(.*\)/\1/')
    
    allowed=false
    for allowed_name in "${ALLOWED_CONTAINERS[@]}"; do
        if [[ "$container_name" == "$allowed_name" ]]; then
            allowed=true
            break
        fi
    done

    if [ "$allowed" = false ]; then
        echo "🚨 비허용 컨테이너 발견: $container_name (ID: $container_id)"
        docker stop "$container_id"
        docker rm "$container_id"
        echo "✅ $container_name 제거 완료."
    fi
done

# CPU 사용량 체크
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8}')
cpu_usage=${cpu_usage%.*} # 소수점 제거

if [ "$cpu_usage" -ge "$CPU_THRESHOLD" ]; then
    echo "⚡ CPU 사용량 ${cpu_usage}% 초과! 서버 재부팅합니다."
    sudo reboot
fi
