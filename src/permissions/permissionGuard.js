class PermissionGuard {
  constructor(options = {}) {
    this.ownerRoleId = options.ownerRoleId || null;
    this.ownerRoleName = options.ownerRoleName || 'DONO';
  }

  canRunAnalysis(interaction) {
    if (this.ownerRoleId) {
      return hasRoleById(interaction, this.ownerRoleId);
    }

    return hasRoleByName(interaction, this.ownerRoleName);
  }
}

function hasRoleById(interaction, roleId) {
  const roles = interaction && interaction.member ? interaction.member.roles : null;

  if (!roles) {
    return false;
  }

  if (roles.cache && typeof roles.cache.has === 'function') {
    return roles.cache.has(roleId);
  }

  if (roles.cache && typeof roles.cache.some === 'function') {
    return roles.cache.some((role) => role && role.id === roleId);
  }

  if (Array.isArray(roles)) {
    return roles.some((role) => role && role.id === roleId);
  }

  return false;
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
  hasRoleById,
  hasRoleByName,
};
