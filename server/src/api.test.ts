import { test, it, afterEach } from 'node:test'
import assert from 'node:assert'
import { startServer } from './api'

const pageSize = 10

const endpoints = {
  users: 'http://localhost:3003/users',
  roles: 'http://localhost:3003/roles',
}

function getFetchOptions(method: string, body?: unknown) {
  return body
    ? {
      method,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    }
    : { method }
}

const server = await startServer({
  port: 3003,
  speed: 'instant',
  requestLogging: false,
  pageSize: 10,
  chanceOfServerError: 0,
})

await test('API', async () => {
  // ----------
  // User tests
  // ----------

  await test('GET /users', async () => {
    await it('returns the 1st page of users by default', async () => {
      const response = await fetch(endpoints.users)
      const pagedData = await response.json()

      assert.strictEqual(pagedData.data.length, pageSize)
      assert.strictEqual(pagedData.next, 2)
      assert.strictEqual(pagedData.prev, null)
      assert.strictEqual(pagedData.pages, 2)
    })

    await it('returns the 2nd page of users', async () => {
      const response = await fetch(endpoints.users + '?page=2')
      const pagedData = await response.json()

      assert.strictEqual(pagedData.data.length, 6)
      assert.strictEqual(pagedData.next, null)
      assert.strictEqual(pagedData.prev, 1)
      assert.strictEqual(pagedData.pages, 2)
    })

    await it('returns a filtered page of users', async () => {
      const response = await fetch(endpoints.users + '?search=Mark')
      const pagedData = await response.json()

      assert.strictEqual(pagedData.data.length, 1)
      assert.strictEqual(pagedData.pages, 1)
    })
  })

  await test('GET /users/:id', async () => {
    await it('returns a user', async () => {
      const response = await fetch(endpoints.users + '/c7deb881-1939-4208-9a63-61a885f02d8f')
      const user = await response.json()

      assert.strictEqual(user.first, 'Mark')
      assert.strictEqual(user.last, 'Tipton')
    })

    await it('returns a 404 if user not found', async () => {
      const response = await fetch(endpoints.users + '/not-a-user')

      assert.strictEqual(response.status, 404)

      const message = await response.json()
      assert.strictEqual(message.message, 'User not found')
    })
  })

  await test('PATCH /users/:id', async () => {
    afterEach(() => server.reset())

    await it('returns the updated user', async () => {
      const response = await fetch(
        endpoints.users + '/c7deb881-1939-4208-9a63-61a885f02d8f',
        getFetchOptions('PATCH', { first: 'Max' })
      )
      const user = await response.json()

      assert.strictEqual(user.first, 'Max')
      assert.strictEqual(user.last, 'Tipton')
    })

    await it('updates the user', async () => {
      const id = 'c7deb881-1939-4208-9a63-61a885f02d8f'
      await fetch(endpoints.users + '/' + id, getFetchOptions('PATCH', { first: 'Maxwell' }))

      const response = await fetch(endpoints.users + '/' + id)
      const user = await response.json()

      assert.strictEqual(user.first, 'Maxwell')
      assert.strictEqual(user.last, 'Tipton')
    })

    await it('returns 400 if referenced role not found', async () => {
      const id = 'c7deb881-1939-4208-9a63-61a885f02d8f'
      const response = await fetch(endpoints.users + '/' + id, getFetchOptions('PATCH', { roleId: 'not-a-role' }))

      assert.strictEqual(response.status, 400)

      const message = await response.json()
      assert.strictEqual(message.message, 'Referenced role not found')
    })

    await it('returns 404 if user not found', async () => {
      const response = await fetch(endpoints.users + '/not-a-user', getFetchOptions('PATCH', { first: 'Bob' }))

      assert.strictEqual(response.status, 404)

      const message = await response.json()
      assert.strictEqual(message.message, 'User not found')
    })
  })

  await test('POST /users', async () => {
    afterEach(() => server.reset())

    await it('returns a new user', async () => {
      const response = await fetch(
        endpoints.users,
        getFetchOptions('POST', {
          first: 'Sue',
          last: 'Tran',
          roleId: '1a235261-fa93-4845-ab48-ee23895998e6',
        })
      )
      const user = await response.json()

      assert.strictEqual(user.first, 'Sue')
      assert.strictEqual(user.last, 'Tran')
    })

    await it('adds a new user', async () => {
      const response = await fetch(
        endpoints.users,
        getFetchOptions('POST', {
          first: 'Kelly',
          last: 'McDonald',
          roleId: '1a235261-fa93-4845-ab48-ee23895998e6',
        })
      )
      const user = await response.json()

      const response2 = await fetch(endpoints.users + '/' + user.id)
      const user2 = await response2.json()

      assert.strictEqual(user2.first, 'Kelly')
      assert.strictEqual(user2.last, 'McDonald')
    })

    await it('returns 400 if referenced role not found', async () => {
      const response = await fetch(
        endpoints.users,
        getFetchOptions('POST', {
          first: 'Kelly',
          last: 'McDonald',
          roleId: 'not-a-role',
        })
      )

      assert.strictEqual(response.status, 400)

      const message = await response.json()
      assert.strictEqual(message.message, 'Referenced role not found')
    })

    await it('returns 400 if user.first missing', async () => {
      const response = await fetch(
        endpoints.users,
        getFetchOptions('POST', {
          last: 'McDonald',
          roleId: '1a235261-fa93-4845-ab48-ee23895998e6',
        })
      )

      assert.strictEqual(response.status, 400)

      const message = await response.json()
      assert.strictEqual(message.message, 'Missing required field: first')
    })

    await it('returns 400 if user.last missing', async () => {
      const response = await fetch(
        endpoints.users,
        getFetchOptions('POST', {
          first: 'Kelly',
          roleId: '1a235261-fa93-4845-ab48-ee23895998e6',
        })
      )

      assert.strictEqual(response.status, 400)

      const message = await response.json()
      assert.strictEqual(message.message, 'Missing required field: last')
    })

    await it('returns 400 if user.roleId missing', async () => {
      const response = await fetch(
        endpoints.users,
        getFetchOptions('POST', {
          first: 'Kelly',
          last: 'McDonald',
        })
      )

      assert.strictEqual(response.status, 400)

      const message = await response.json()
      assert.strictEqual(message.message, 'Missing required field: roleId')
    })
  })

  await test('DELETE /users/:id', async () => {
    afterEach(() => server.reset())

    await it("returns a 'deleted' message", async () => {
      const response = await fetch(
        endpoints.users + '/c7deb881-1939-4208-9a63-61a885f02d8f',
        getFetchOptions('DELETE')
      )

      const user = await response.json()

      assert.strictEqual(user.id, 'c7deb881-1939-4208-9a63-61a885f02d8f')
    })

    await it('deletes the user', async () => {
      const id = 'c7deb881-1939-4208-9a63-61a885f02d8f'
      await fetch(endpoints.users + '/' + id, getFetchOptions('DELETE'))

      const response = await fetch(endpoints.users + '/' + id)

      assert.strictEqual(response.status, 404)
    })

    await it('returns 404 if user not found', async () => {
      const response = await fetch(endpoints.users + '/not-a-user', getFetchOptions('DELETE'))

      assert.strictEqual(response.status, 404)

      const message = await response.json()
      assert.strictEqual(message.message, 'User not found')
    })
  })

  // ----------
  // Role tests
  // ----------

  await test('GET /roles', async () => {
    await it('returns the 1st page of roles by default', async () => {
      const response = await fetch(endpoints.roles)
      const pagedData = await response.json()

      assert.strictEqual(pagedData.data.length, 4)
      assert.strictEqual(pagedData.next, null)
      assert.strictEqual(pagedData.prev, null)
      assert.strictEqual(pagedData.pages, 1)
    })

    await it('returns the 2nd page of roles', async () => {
      const response = await fetch(endpoints.roles + '?page=2')
      const pagedData = await response.json()

      assert.strictEqual(pagedData.data.length, 0)
      assert.strictEqual(pagedData.next, null)
      assert.strictEqual(pagedData.prev, 1)
      assert.strictEqual(pagedData.pages, 1)
    })

    await it('returns a filtered page of roles', async () => {
      const response = await fetch(endpoints.roles + '?search=visual')
      const pagedData = await response.json()

      assert.strictEqual(pagedData.data.length, 1)
      assert.strictEqual(pagedData.pages, 1)
    })
  })

  await test('GET /roles/:id', async () => {
    await it('returns a role', async () => {
      const response = await fetch(endpoints.roles + '/1a235261-fa93-4845-ab48-ee23895998e6')
      const role = await response.json()

      assert.strictEqual(role.name, 'Engineering')
      assert.strictEqual(
        role.description,
        'Engineers build and maintain the software that powers our products and services.'
      )
    })

    await it('returns a 404 if role not found', async () => {
      const response = await fetch(endpoints.roles + '/not-a-role')

      assert.strictEqual(response.status, 404)

      const message = await response.json()
      assert.strictEqual(message.message, 'Role not found')
    })
  })

  await test('PATCH /roles/:id', async () => {
    afterEach(() => server.reset())

    await it('returns the updated role', async () => {
      const response = await fetch(
        endpoints.roles + '/1a235261-fa93-4845-ab48-ee23895998e6',
        getFetchOptions('PATCH', { name: 'Frontend Engineering' })
      )
      const user = await response.json()

      assert.strictEqual(user.name, 'Frontend Engineering')
    })

    await it('updates the role', async () => {
      const id = '1a235261-fa93-4845-ab48-ee23895998e6'
      await fetch(endpoints.roles + '/' + id, getFetchOptions('PATCH', { name: 'Security' }))

      const response = await fetch(endpoints.roles + '/' + id)
      const user = await response.json()

      assert.strictEqual(user.name, 'Security')
    })

    await it('returns 400 if role name already exists', async () => {
      const response = await fetch(
        endpoints.roles + '/1a235261-fa93-4845-ab48-ee23895998e6',
        getFetchOptions('PATCH', { name: 'Support' })
      )

      assert.strictEqual(response.status, 400)

      const message = await response.json()
      assert.strictEqual(message.message, 'Role with given name already exists')
    })

    await it('returns 400 if default role is unset', async () => {
      const response = await fetch(
        endpoints.roles + '/6c0a71c0-a5bc-44f8-8634-60f44840d92a',
        getFetchOptions('PATCH', { isDefault: false })
      )

      assert.strictEqual(response.status, 400)

      const message = await response.json()
      assert.strictEqual(message.message, 'Cannot unset default role')
    })

    await it('returns 404 if role not found', async () => {
      const response = await fetch(endpoints.roles + '/not-a-role', getFetchOptions('PATCH', { name: 'Admin' }))

      assert.strictEqual(response.status, 404)

      const message = await response.json()
      assert.strictEqual(message.message, 'Role not found')
    })
  })

  await test('POST /roles', async () => {
    afterEach(() => server.reset())

    await it('returns a new role', async () => {
      const response = await fetch(
        endpoints.roles,
        getFetchOptions('POST', {
          name: 'Security',
          description: 'Security engineers protect our products and services.',
        })
      )
      const role = await response.json()

      assert.strictEqual(role.name, 'Security')
      assert.strictEqual(role.description, 'Security engineers protect our products and services.')
    })

    await it('adds a new role', async () => {
      const response = await fetch(
        endpoints.roles,
        getFetchOptions('POST', {
          name: 'Sales',
          description: 'Sales team members sell our products and services.',
        })
      )
      const role = await response.json()

      const response2 = await fetch(endpoints.roles + '/' + role.id)
      const role2 = await response2.json()

      assert.strictEqual(role2.name, 'Sales')
      assert.strictEqual(role2.description, 'Sales team members sell our products and services.')
    })

    await it('returns 400 if role.name missing', async () => {
      const response = await fetch(endpoints.roles, getFetchOptions('POST', {}))

      assert.strictEqual(response.status, 400)

      const message = await response.json()
      assert.strictEqual(message.message, 'Missing required field: name')
    })

    await it('returns 400 if role name already exists', async () => {
      const response = await fetch(endpoints.roles, getFetchOptions('POST', { name: 'Engineering' }))

      assert.strictEqual(response.status, 400)

      const message = await response.json()
      assert.strictEqual(message.message, 'Role with given name already exists')
    })
  })

  await test('DELETE /roles/:id', async () => {
    afterEach(() => server.reset())

    await it("returns a 'deleted' message", async () => {
      const response = await fetch(
        endpoints.roles + '/1a235261-fa93-4845-ab48-ee23895998e6',
        getFetchOptions('DELETE')
      )

      const role = await response.json()

      assert.strictEqual(role.id, '1a235261-fa93-4845-ab48-ee23895998e6')
    })

    await it('deletes the role', async () => {
      const id = '1a235261-fa93-4845-ab48-ee23895998e6'
      await fetch(endpoints.roles + '/' + id, getFetchOptions('DELETE'))

      const response = await fetch(endpoints.roles + '/' + id)

      assert.strictEqual(response.status, 404)

      const message = await response.json()
      assert.strictEqual(message.message, 'Role not found')
    })

    await it('updates all users with the role to the default role', async () => {
      const rolesResponse = await fetch(endpoints.roles)
      const roles = await rolesResponse.json()
      const defaultRole = roles.data.find((role: { isDefault: boolean }) => role.isDefault)

      const usersBeforeResponse = await fetch(endpoints.users)
      const usersBefore = await usersBeforeResponse.json()

      const id = '1a235261-fa93-4845-ab48-ee23895998e6'
      await fetch(endpoints.roles + '/' + id, getFetchOptions('DELETE'))

      const usersAfterResponse = await fetch(endpoints.users)
      const usersAfter = await usersAfterResponse.json()

      const usersWithRole = usersBefore.data.filter((user: { roleId: string }) => user.roleId === id)

      assert.strictEqual(usersWithRole.length, 7)

      for (const userWithRole of usersWithRole) {
        const userAfter = usersAfter.data.find(
          (user: { id: string; roleId: string }) => userWithRole.id === user.id
        )
        assert.strictEqual(userAfter.roleId, defaultRole.id)
      }
    })

    await it('returns 404 if role not found', async () => {
      const response = await fetch(endpoints.roles + '/not-a-role', getFetchOptions('DELETE'))

      assert.strictEqual(response.status, 404)

      const message = await response.json()
      assert.strictEqual(message.message, 'Role not found')
    })
  })
})

server.stop()
