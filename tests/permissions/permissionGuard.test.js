const test = require('node:test');
const assert = require('node:assert/strict');

const { PermissionGuard } = require('../../src/permissions/permissionGuard');

test('PermissionGuard allows only members with the configured owner role', () => {
  const guard = new PermissionGuard({ ownerRoleName: 'DONO' });

  assert.equal(guard.canRunAnalysis(interactionWithRoles(['DONO'])), true);
  assert.equal(guard.canRunAnalysis(interactionWithRoles(['LEITOR'])), false);
});

test('PermissionGuard prefers the configured owner role id', () => {
  const guard = new PermissionGuard({ ownerRoleId: 'role-1', ownerRoleName: 'DONO' });

  assert.equal(guard.canRunAnalysis(interactionWithRoles(['DONO'], ['role-2'])), false);
  assert.equal(guard.canRunAnalysis(interactionWithRoles(['LEITOR'], ['role-1'])), true);
});

function interactionWithRoles(roleNames, roleIds = []) {
  return {
    member: {
      roles: {
        cache: {
          has(roleId) {
            return roleIds.includes(roleId);
          },
          some(callback) {
            return roleNames.map((name, index) => ({ id: roleIds[index], name })).some(callback);
          },
        },
      },
    },
  };
}
