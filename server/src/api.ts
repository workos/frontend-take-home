import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { data as rawData } from './data'

import type { PagedData, User, Role } from './models'

const serverConfig = {
  port: +(process.env.SERVER_PORT || 3002),
  speed: getServerSpeed(),
  chanceOfServerError: 0.05,
  pageSize: 10,
  requestLogging: true,
}

const searchFields = {
  users: ['first', 'last'],
  roles: ['name', 'description'],
}

function sortBy<T extends User | Role>(a: T, b: T) {
  return b.createdAt.localeCompare(a.createdAt)
}

function fullTextSearch<T extends Record<string, any>>(data: T[], fields: string[], search: string) {
  search = search.toLowerCase()
  return data.filter((item) => {
    for (const field of fields) {
      if ((item[field] as string).toString().toLowerCase().includes(search)) {
        return true
      }
    }
  })
}

function getPagedData<T extends User | Role>(req: express.Request, data: T[], searchFields: string[]): PagedData<T> {
  const search = req.query.search as string
  if (search) {
    data = fullTextSearch(data, searchFields, search)
  }

  data.sort(sortBy)

  const page = +(req.query.page || 1) || 1
  const pages = Math.ceil(data.length / serverConfig.pageSize)
  const next = page < pages ? page + 1 : null
  const prev = page > 1 ? page - 1 : null
  return {
    data: data.slice((page - 1) * serverConfig.pageSize, page * serverConfig.pageSize),
    next,
    prev,
    pages,
  }
}

function getEntity<T extends Record<string, any>>(req: express.Request, data: T[]): T | undefined {
  const id = req.params.id as string
  return data.find((item) => item.id === id)
}

function updateField<T extends Record<string, any>>(item: T, field: string, value: any) {
  if (value && value !== item[field]) {
    ; (item[field] as keyof T) = value
    return true
  }

  return false
}

function getDefaultRole(): Role {
  return data.roles.find((role) => role.isDefault) as Role
}

function clearDefaultRole() {
  const defaultRole = getDefaultRole()
  defaultRole.isDefault = false
}

function getServerSpeed() {
  switch (process.env.SERVER_SPEED) {
    case 'slow':
    case 'fast':
    case 'instant':
      return process.env.SERVER_SPEED
    default:
      return 'fast'
  }
}

function logWithNetworkEffects(req: express.Request, res: express.Response, next: () => void) {
  let latencyInMs = 0
  if (serverConfig.speed === 'slow') {
    latencyInMs = Math.floor(Math.random() * 1000) + 1000 // between 1000ms and 2000ms
  } else if (serverConfig.speed === 'fast') {
    latencyInMs = Math.floor(Math.random() * 500) + 500 // between 500ms and 1000ms
  }

  const serverError = Math.random() < serverConfig.chanceOfServerError

  if (serverConfig.requestLogging) {
    const serverErrorMessage = serverError ? ' (Server Error)' : ''
    const latencyMessage = latencyInMs ? ` (+${latencyInMs}ms)` : ''
    console.log(`${req.method} ${req.path}${latencyMessage}${serverErrorMessage}`)
  }

  function afterDelay() {
    if (serverError) {
      res.status(500).json({ message: 'Server Error' })
      return
    }

    next()
  }

  if (latencyInMs) {
    setTimeout(afterDelay, latencyInMs)
    return
  }

  afterDelay()
}

function resetData(): { users: User[]; roles: Role[] } {
  return {
    users: rawData.users.map((user) => ({ ...user })),
    roles: rawData.roles.map((role) => ({ ...role })),
  }
}

// ------------
// Server Setup
// ------------

let data = resetData()

const api = express()
api.use(cors())
api.use(logWithNetworkEffects)
api.use(express.json())

// -----------
// User Routes
// -----------

api.get('/users', (req, res) => {
  res.json(getPagedData<User>(req, data.users, searchFields.users))
})

api.get('/users/:id', (req, res) => {
  const user = getEntity<User>(req, data.users)
  if (!user) {
    res.status(404)
  }

  res.json(user ? user : { message: 'User not found' })
})

api.patch('/users/:id', (req, res) => {
  const user = getEntity<User>(req, data.users)
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const { first, last, roleId } = req.body
  let updated = false
  updated = updateField(user, 'first', first) || updated
  updated = updateField(user, 'last', last) || updated
  if (roleId) {
    const role = data.roles.find((role) => role.id === roleId)
    if (!role) {
      res.status(400).json({ message: 'Referenced role not found' })
      return
    }

    user.roleId = roleId
    updated = true
  }

  if (updated) {
    user.updatedAt = new Date().toISOString()
  }

  res.json(user)
})

api.post('/users', (req, res) => {
  const { first, last, roleId } = req.body

  const missingFields = [...(!first ? ['first'] : []), ...(!last ? ['last'] : []), ...(!roleId ? ['roleId'] : [])]
  if (missingFields.length) {
    const message = `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`
    res.status(400).json({ message })
    return
  }

  const role = data.roles.find((role) => role.id === roleId)
  if (!role) {
    res.status(400).json({ message: 'Referenced role not found' })
    return
  }

  const id = randomUUID()
  const createdAt = new Date().toISOString()
  const updatedAt = createdAt
  const photo = `https://i.pravatar.cc/400?img=${Math.floor(Math.random() * 70)}}`

  const user = {
    id,
    first,
    last,
    roleId,
    photo,
    createdAt,
    updatedAt,
  }

  data.users.push(user)
  res.json(user)
})

api.delete('/users/:id', (req, res) => {
  const user = getEntity<User>(req, data.users)
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  data.users = data.users.filter((item) => item.id !== user.id)

  res.json(user)
})

// -----------
// Role Routes
// -----------

api.get('/roles', (req, res) => {
  res.json(getPagedData<Role>(req, data.roles, searchFields.roles))
})

api.get('/roles/:id', (req, res) => {
  const role = getEntity<Role>(req, data.roles)
  if (!role) {
    res.status(404)
  }

  res.json(role ? role : { message: 'Role not found' })
})

api.patch('/roles/:id', (req, res) => {
  const role = getEntity<Role>(req, data.roles)
  if (!role) {
    res.status(404).json({ message: 'Role not found' })
    return
  }

  const { name, description, isDefault } = req.body
  const { id } = role
  if (data.roles.find((role) => role.name === name && role.id !== id)) {
    res.status(400).json({ message: 'Role with given name already exists' })
    return
  }

  let updated = false
  updated = updateField(role, 'name', name) || updated
  updated = updateField(role, 'description', description) || updated
  if (isDefault !== role.isDefault) {
    if (isDefault === false) {
      res.status(400).json({ message: 'Cannot unset default role' })
      return
    }
    if (isDefault === true) {
      clearDefaultRole()
      role.isDefault = true
      updated = true
    }
  }

  if (updated) {
    role.updatedAt = new Date().toISOString()
  }

  res.json(role)
})

api.post('/roles', (req, res) => {
  const { name, description = '', isDefault = false } = req.body
  if (!name) {
    res.status(400).json({ message: 'Missing required field: name' })
    return
  }

  if (data.roles.find((role) => role.name === name)) {
    res.status(400).json({ message: 'Role with given name already exists' })
    return
  }

  const id = randomUUID()
  const createdAt = new Date().toISOString()
  const updatedAt = createdAt
  if (isDefault === true) {
    clearDefaultRole()
  }

  const role = {
    id,
    name,
    description,
    isDefault,
    createdAt,
    updatedAt,
  }

  data.roles.push(role)
  res.json(role)
})

api.delete('/roles/:id', (req, res) => {
  const role = getEntity<Role>(req, data.roles)
  if (!role) {
    res.status(404).json({ message: 'Role not found' })
    return
  }

  if (role.isDefault) {
    res.status(400).json({ message: 'Cannot delete default role' })
    return
  }

  const defaultRole = getDefaultRole()
  data.users.filter((user) => user.roleId === role.id).forEach((user) => (user.roleId = defaultRole.id))

  data.roles = data.roles.filter((item) => item.id !== role.id)

  res.json(role)
})

// ---------------
// Start Listening
// ---------------

export function startServer(config: typeof serverConfig): Promise<{ stop: () => void; reset: () => void }> {
  serverConfig.port = config.port
  serverConfig.speed = config.speed
  serverConfig.pageSize = config.pageSize
  serverConfig.requestLogging = config.requestLogging
  serverConfig.chanceOfServerError = config.chanceOfServerError

  return new Promise((resolve) => {
    const server = api.listen(config.port, () => {
      resolve({
        stop: () => server.close(),
        reset: () => {
          data = resetData()
        },
      })
    })
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await startServer(serverConfig)

  console.log('\n\x1b[1m  API Endpoints:\x1b[0m')
  console.log(`  ➜  http://localhost:${serverConfig.port}/users`)
  console.log(`  ➜  http://localhost:${serverConfig.port}/roles`)
  console.log(`\n\x1b[1m  Server Speed:\x1b[0m ${serverConfig.speed}\n`)
}
