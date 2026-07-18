class PermissionGuard {
  constructor(options = {}) {
    this.ownerRoleName = options.ownerRoleName || 'DONO';
  }

  canRunAnalysis(interaction) {
    return hasRoleByName(interaction, this.ownerRoleName);
  }
}

function hasRoleByName(interaction, roleName) {
  const roles = interaction && interaction.member ? interaction.member.roles : null;

  if (!roles) {
    return false;
  }

  if (roles.cache && typeof roles.cache.some === 'function') {
    return roles.cache.some((role) => role && role.name === roleName);
  }

  if (Array.isArray(roles)) {
    return roles.some((role) => role && role.name === roleName);
  }

  return false;
}

module.exports = {
  PermissionGuard,
  hasRoleByName,
};
