#!/bin/bash
# =============================================================================
# deploy.sh — Smart deployment script for Finance Tracker + Monitoring Stack
# Usage: bash deploy.sh [app|monitoring|all|status|stop]
# =============================================================================

set -e  # Exit on any error

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log()    { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# -----------------------------------------------
# Check if a specific container is already running
# -----------------------------------------------
is_running() {
  local container_name="$1"
  docker ps --filter "name=${container_name}" --filter "status=running" --format "{{.Names}}" | grep -q "^${container_name}$"
}

# -----------------------------------------------
# Check if a Docker network already exists
# -----------------------------------------------
network_exists() {
  docker network ls --format "{{.Name}}" | grep -q "^finance-tracker-network$"
}

# -----------------------------------------------
# Ensure the shared network exists
# -----------------------------------------------
ensure_network() {
  if network_exists; then
    log "Shared network 'finance-tracker-network' already exists — skipping creation."
  else
    log "Creating shared Docker network 'finance-tracker-network'..."
    docker network create finance-tracker-network
  fi
}

# -----------------------------------------------
# Deploy the app stack (app + db + pgadmin)
# -----------------------------------------------
deploy_app() {
  log "=== Checking App Stack ==="

  local needs_start=false

  if is_running "finance-tracker"; then
    warn "finance-tracker is already running — skipping."
  else
    log "finance-tracker is NOT running."
    needs_start=true
  fi

  if is_running "finance-tracker-db"; then
    warn "finance-tracker-db is already running — skipping."
  else
    log "finance-tracker-db is NOT running."
    needs_start=true
  fi

  if [ "$needs_start" = true ]; then
    log "Starting app stack..."
    docker compose up -d --remove-orphans
    log "App stack started successfully."
  else
    log "App stack is already up-to-date. No changes needed."
  fi
}

# -----------------------------------------------
# Deploy the monitoring stack
# -----------------------------------------------
deploy_monitoring() {
  log "=== Checking Monitoring Stack ==="

  local needs_start=false
  local monitoring_containers=("finance-prometheus" "finance-loki" "finance-promtail" "finance-grafana")

  for container in "${monitoring_containers[@]}"; do
    if is_running "$container"; then
      warn "$container is already running — skipping."
    else
      log "$container is NOT running."
      needs_start=true
    fi
  done

  if [ "$needs_start" = true ]; then
    log "Starting monitoring stack..."
    docker compose -f docker-compose.monitoring.yml up -d --remove-orphans
    log "Monitoring stack started successfully."
    log "Grafana is available at: http://$(hostname -I | awk '{print $1}'):3200"
  else
    log "Monitoring stack is already fully running. No changes needed."
  fi
}

# -----------------------------------------------
# Show status of all containers
# -----------------------------------------------
show_status() {
  echo ""
  log "=== Container Status ==="
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" \
    --filter "name=finance-tracker" \
    --filter "name=finance-prometheus" \
    --filter "name=finance-loki" \
    --filter "name=finance-promtail" \
    --filter "name=finance-grafana"
  echo ""
}

# -----------------------------------------------
# Stop all containers
# -----------------------------------------------
stop_all() {
  log "Stopping monitoring stack..."
  docker compose -f docker-compose.monitoring.yml down || true

  log "Stopping app stack..."
  docker compose down || true

  log "All stacks stopped."
}

# -----------------------------------------------
# Main entrypoint
# -----------------------------------------------
COMMAND="${1:-all}"

case "$COMMAND" in
  app)
    ensure_network
    deploy_app
    ;;
  monitoring)
    ensure_network
    deploy_monitoring
    ;;
  all)
    ensure_network
    deploy_app
    deploy_monitoring
    show_status
    ;;
  status)
    show_status
    ;;
  stop)
    stop_all
    ;;
  *)
    echo "Usage: bash deploy.sh [app|monitoring|all|status|stop]"
    exit 1
    ;;
esac
