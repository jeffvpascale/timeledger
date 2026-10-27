#!/usr/bin/env bash
set -Eeuo pipefail

# Run inside an existing Debian LXC. An optional second argument uses a local ZIP.
REPOSITORY="${TIMELEDGER_REPOSITORY:-jeffvpascale/timeledger}"
REQUESTED_VERSION="${1:-latest}"
LOCAL_ARCHIVE="${2:-}"
INSTALL_DIR="/opt/timeledger"
DATA_DIR="/var/lib/timeledger"
UNIT_FILE="/etc/systemd/system/timeledger.service"
WORK_DIR=""
CHANGES_STARTED=false
HAD_APP=false
HAD_UNIT=false
WAS_ACTIVE=false
WAS_ENABLED=false
DATA_SNAPSHOT_TAKEN=false

info() { printf '\n[INFO] %s\n' "$1"; }
fail() { printf '\n[ERROR] %s\n' "$1" >&2; exit 1; }

[[ "${EUID}" -eq 0 ]] || fail "Run this installer as root inside the LXC."
if command -v pveversion >/dev/null 2>&1 || [[ -d /etc/pve ]]; then
  fail "Run create-lxc.sh on the Proxmox host; install.sh belongs inside the LXC."
fi
[[ "$(uname -m)" == "x86_64" ]] || fail "This installer supports Intel/AMD x64 containers."
command -v systemctl >/dev/null 2>&1 || fail "A systemd-based Debian LXC is required."
[[ -f /etc/os-release ]] || fail "Cannot identify the operating system."
source /etc/os-release
[[ "${ID}" == "debian" ]] || fail "Debian 12 or 13 is required."
case "${VERSION_ID}" in
  12) DOTNET_LIBRARIES=(libicu72 libssl3) ;;
  13) DOTNET_LIBRARIES=(libicu76 libssl3t64) ;;
  *) fail "Debian 12 or 13 is required." ;;
esac
[[ "${REPOSITORY}" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || fail "Invalid GitHub repository."
if [[ "${REQUESTED_VERSION}" != "latest" && ! "${REQUESTED_VERSION}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  fail "Version must be latest or a tag such as v1.0.0."
fi
if [[ -n "${LOCAL_ARCHIVE}" ]]; then
  [[ -f "${LOCAL_ARCHIVE}" ]] || fail "Local ZIP does not exist: ${LOCAL_ARCHIVE}"
  [[ "${REQUESTED_VERSION}" != "latest" ]] || fail "Specify a version when installing a local ZIP."
fi

info "Installing Linux dependencies"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates curl jq unzip libc6 libgcc-s1 libgssapi-krb5-2 \
  libstdc++6 tzdata zlib1g "${DOTNET_LIBRARIES[@]}"

if [[ "${REQUESTED_VERSION}" == "latest" ]]; then
  info "Finding the latest TimeLedger release"
  REQUESTED_VERSION="$(curl -fsSL --retry 3 \
    "https://api.github.com/repos/${REPOSITORY}/releases/latest" | jq -er '.tag_name')"
fi
[[ "${REQUESTED_VERSION}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "Release tag must look like v1.0.0."

finish() {
  local exit_code=$?
  local recovery_failed=false
  trap - EXIT
  set +e
  if [[ "${exit_code}" -ne 0 && "${CHANGES_STARTED}" == true ]]; then
    printf '\n[ERROR] Installation failed. Restoring the previous installation.\n' >&2
    systemctl stop timeledger.service >/dev/null 2>&1
    if [[ -d "${WORK_DIR}/previous-app" ]]; then
      if ! rm -rf -- "${INSTALL_DIR}" || ! mv -- "${WORK_DIR}/previous-app" "${INSTALL_DIR}"; then
        recovery_failed=true
      fi
    elif [[ "${HAD_APP}" == false ]]; then
      rm -rf -- "${INSTALL_DIR}" || recovery_failed=true
    fi
    if [[ "${DATA_SNAPSHOT_TAKEN}" == true ]]; then
      rm -f -- "${DATA_DIR}/timeledger.db" "${DATA_DIR}/timeledger.db-wal" \
        "${DATA_DIR}/timeledger.db-shm" "${DATA_DIR}/timeledger.db-journal" || recovery_failed=true
      cp -a "${WORK_DIR}/database/." "${DATA_DIR}/" || recovery_failed=true
    fi
    if [[ "${HAD_UNIT}" == true ]]; then
      cp -a "${WORK_DIR}/previous.service" "${UNIT_FILE}" || recovery_failed=true
    else
      systemctl disable timeledger.service >/dev/null 2>&1
      rm -f -- "${UNIT_FILE}" || recovery_failed=true
    fi
    systemctl daemon-reload || recovery_failed=true
    if [[ "${HAD_UNIT}" == true && "${WAS_ENABLED}" == false ]]; then
      systemctl disable timeledger.service >/dev/null 2>&1
    fi
    if [[ "${WAS_ACTIVE}" == true ]]; then
      if ! systemctl start timeledger.service; then
        recovery_failed=true
        printf '[ERROR] Previous service could not restart; inspect journalctl -u timeledger.\n' >&2
      fi
    fi
  fi
  if [[ "${recovery_failed}" == true ]]; then
    printf '[ERROR] Recovery needs attention. Backup files retained at %s\n' "${WORK_DIR}" >&2
  elif [[ -n "${WORK_DIR}" && -d "${WORK_DIR}" ]]; then
    rm -rf -- "${WORK_DIR}"
  fi
  exit "${exit_code}"
}
trap finish EXIT

# Stage on the same filesystem as /opt/timeledger so the directory swap is atomic.
WORK_DIR="$(mktemp -d /opt/timeledger-install.XXXXXX)"
ARCHIVE_PATH="${WORK_DIR}/release.zip"
if [[ -n "${LOCAL_ARCHIVE}" ]]; then
  cp -- "${LOCAL_ARCHIVE}" "${ARCHIVE_PATH}"
else
  info "Downloading TimeLedger ${REQUESTED_VERSION}"
  curl -fL --retry 3 --retry-delay 2 \
    "https://github.com/${REPOSITORY}/releases/download/${REQUESTED_VERSION}/timeledger-${REQUESTED_VERSION}-linux-x64.zip" \
    -o "${ARCHIVE_PATH}"
fi
mkdir "${WORK_DIR}/app"
unzip -q "${ARCHIVE_PATH}" -d "${WORK_DIR}/app"
for required_file in TimeLedger.Api TimeLedger.Api.dll wwwroot/index.html; do
  [[ -f "${WORK_DIR}/app/${required_file}" ]] || fail "Release is missing ${required_file}."
done
if find "${WORK_DIR}/app" -type f \( -name '*.db' -o -name '*.db-*' -o -name '*.sqlite*' \) -print -quit | grep -q .; then
  fail "The release contains database files; refusing to install it."
fi
chmod -R u=rwX,go=rX "${WORK_DIR}/app"
chmod 0755 "${WORK_DIR}/app/TimeLedger.Api"
chown -R root:root "${WORK_DIR}/app"

getent group timeledger >/dev/null 2>&1 || groupadd --system timeledger
if ! id timeledger >/dev/null 2>&1; then
  useradd --system --gid timeledger --home-dir "${DATA_DIR}" \
    --no-create-home --shell /usr/sbin/nologin timeledger
fi
install -d -o timeledger -g timeledger -m 0750 "${DATA_DIR}"

[[ ! -d "${INSTALL_DIR}" ]] || HAD_APP=true
if [[ -f "${UNIT_FILE}" ]]; then
  cp -a "${UNIT_FILE}" "${WORK_DIR}/previous.service"
  HAD_UNIT=true
fi
if systemctl is-active --quiet timeledger.service; then WAS_ACTIVE=true; fi
if systemctl is-enabled --quiet timeledger.service; then WAS_ENABLED=true; fi
CHANGES_STARTED=true
if [[ "${HAD_UNIT}" == true ]]; then systemctl stop timeledger.service; fi

# Snapshot the stopped database so failed startup migrations can be rolled back too.
mkdir "${WORK_DIR}/database"
for database_file in "${DATA_DIR}/timeledger.db" "${DATA_DIR}/timeledger.db-wal" \
  "${DATA_DIR}/timeledger.db-shm" "${DATA_DIR}/timeledger.db-journal"; do
  if [[ -f "${database_file}" ]]; then
    cp -a -- "${database_file}" "${WORK_DIR}/database/"
  fi
done
DATA_SNAPSHOT_TAKEN=true
if [[ "${HAD_APP}" == true ]]; then mv -- "${INSTALL_DIR}" "${WORK_DIR}/previous-app"; fi
mv -- "${WORK_DIR}/app" "${INSTALL_DIR}"

cat >"${UNIT_FILE}" <<'EOF'
[Unit]
Description=TimeLedger
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=timeledger
Group=timeledger
WorkingDirectory=/opt/timeledger
ExecStart=/opt/timeledger/TimeLedger.Api --urls http://0.0.0.0:5000
Environment="ASPNETCORE_ENVIRONMENT=Production"
Environment="ConnectionStrings__DefaultConnection=Data Source=/var/lib/timeledger/timeledger.db"
Environment="HOME=/var/lib/timeledger"
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/lib/timeledger

[Install]
WantedBy=multi-user.target
EOF

info "Starting TimeLedger and checking the frontend and database"
systemctl daemon-reload
systemctl enable timeledger.service
systemctl restart timeledger.service
APPLICATION_READY=false
for _ in {1..30}; do
  if systemctl is-active --quiet timeledger.service &&
    curl -fsS --max-time 2 http://127.0.0.1:5000/ >/dev/null &&
    curl -fsS --max-time 2 http://127.0.0.1:5000/api/client | jq -e 'type == "array"' >/dev/null; then
    APPLICATION_READY=true
    break
  fi
  sleep 2
done
if [[ "${APPLICATION_READY}" != true ]]; then
  systemctl status timeledger.service --no-pager || true
  journalctl -u timeledger.service -n 50 --no-pager || true
  fail "The service did not respond correctly; installation will be rolled back."
fi
CHANGES_STARTED=false
CONTAINER_IP="$(hostname -I | awk '{print $1}')"
printf '\nTimeLedger %s installed successfully.\n' "${REQUESTED_VERSION}"
printf 'Open: http://%s:5000\n' "${CONTAINER_IP:-CONTAINER-IP}"
printf 'Database: %s/timeledger.db\n' "${DATA_DIR}"
