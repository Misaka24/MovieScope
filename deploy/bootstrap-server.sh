#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

cat > /etc/ssh/sshd_config.d/99-moviescope.conf <<'EOF'
Port 48690
PubkeyAuthentication yes
PasswordAuthentication yes
PermitRootLogin yes
AuthorizedKeysFile .ssh/authorized_keys
EOF
chown root:root /root /root/.ssh /root/.ssh/authorized_keys
chmod 700 /root /root/.ssh
chmod 600 /root/.ssh/authorized_keys
sshd -t
systemctl restart ssh

mkdir -p /data/docker /data/moviescope/app /data/moviescope/backups /data/moviescope/config
chmod 700 /data/moviescope/config
cat > /etc/docker-daemon-moviescope.json <<'EOF'
{
  "data-root": "/data/docker",
  "log-driver": "json-file",
  "log-opts": {"max-size": "20m", "max-file": "5"}
}
EOF

apt-get update
apt-get install -y ca-certificates curl gnupg nginx ufw git gzip
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
mkdir -p /etc/docker
cp /etc/docker-daemon-moviescope.json /etc/docker/daemon.json
systemctl enable --now docker nginx
systemctl restart docker

ufw allow 48690/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

cat > /data/moviescope/bootstrap-status.txt <<EOF
BOOTSTRAP_OK=$(date -u +%FT%TZ)
DOCKER_ROOT=$(docker info --format '{{.DockerRootDir}}')
EOF

echo '=== MOVIESCOPE_BOOTSTRAP_COMPLETE ==='
cat /data/moviescope/bootstrap-status.txt
sshd -T | grep -E '^(port|pubkeyauthentication|passwordauthentication|permitrootlogin|authorizedkeysfile)'
