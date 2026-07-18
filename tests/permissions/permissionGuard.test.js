const test = require('node:test');
const assert = require('node:assert/strict');

const { PermissionGuard } = require('../../src/permissions/permissionGuard');

test('PermissionGuard allows only members with the configured owner role', () => {
  const guard = new PermissionGuard({ ownerRoleName: 'DONO' });

  assert.equal(guard.canRunAnalysis(interactionWithRoles(['DONO'])), true);
  assert.equal(guard.canRunAnalysis(interactionWithRoles(['LEITOR'])), false);
});

function interactionWithRoles(roleNames) {
  return {
    member: {
      roles: {
        cache: {
          some(callback) {
            return roleNames.map((name) => ({ name })).some(callback);
          },
        },
      },
    },
  };
}
