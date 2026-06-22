import coap from 'coap'
import dgram from 'dgram'
import vm from 'vm'

let server = null
let runningPort = null
let activeRoutes = []
let sharedSocket = null
let sharedAgent = null

export function getSharedAgent() {
  return sharedAgent
}

export function startMockServer(port, routes, webContents) {
  return new Promise((resolve, reject) => {
    if (server) {
      return reject(new Error('Mock server is already running'))
    }

    try {
      sharedSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true })

      sharedSocket.on('error', (err) => {
        console.error('Mock server socket error:', err)
        webContents.send('mock-server:error', err.message)
      })

      sharedSocket.bind(port, () => {
        server = coap.createServer()
        activeRoutes = routes || []
        runningPort = port

        server.on('request', (req, res) => {
          handleIncomingRequest(req, res, webContents)
        })

        server.listen(sharedSocket, () => {
          sharedAgent = new coap.Agent({ socket: sharedSocket })
          console.log(`CoAP Mock Server listening on port ${port}`)
          resolve({ port })
        })

        server.on('error', (err) => {
          console.error('CoAP Mock Server error:', err)
          webContents.send('mock-server:error', err.message)
        })
      })

    } catch (err) {
      cleanupSocketResources()
      reject(err)
    }
  })
}

export function stopMockServer() {
  return new Promise((resolve) => {
    if (!server) {
      cleanupSocketResources()
      return resolve(true)
    }

    server.close(() => {
      cleanupSocketResources()
      resolve(true)
    })
  })
}

function cleanupSocketResources() {
  if (sharedAgent) {
    try { sharedAgent.close() } catch (e) {}
    sharedAgent = null
  }
  if (sharedSocket) {
    try { sharedSocket.close() } catch (e) {}
    sharedSocket = null
  }
  server = null
  runningPort = null
}

export function getMockServerStatus() {
  return {
    running: server !== null,
    port: runningPort
  }
}

export function updateMockServerRoutes(routes) {
  activeRoutes = routes || []
}

function handleIncomingRequest(req, res, webContents) {
  const method = req.method
  const path = '/' + req.url.split('?')[0].replace(/^\//, '')
  const remoteAddress = req.rsinfo ? `${req.rsinfo.address}:${req.rsinfo.port}` : 'unknown'
  const timestamp = new Date().toLocaleTimeString()

  const matchingRoute = activeRoutes.find(r => {
    const routeMethod = (r.method || 'GET').toUpperCase()
    const routePath = '/' + (r.path || '').replace(/^\//, '')
    return routeMethod === method && routePath === path
  })

  const chunks = []
  req.on('data', chunk => chunks.push(chunk))
  req.on('end', () => {
    const rawPayload = Buffer.concat(chunks).toString()
    
    const reqOptions = req.options.map(opt => ({
      key: opt.name,
      value: opt.value.toString()
    }))

    webContents.send('mock-server:request-received', {
      method,
      path,
      remoteAddress,
      timestamp,
      matched: !!matchingRoute
    })

    if (!matchingRoute) {
      res.code = '4.04'
      res.end('Not Found')
      return
    }

    const scriptText = matchingRoute.script || ''
    if (!scriptText.trim()) {
      res.code = '2.05'
      res.end('Mock Response')
      return
    }

    const logs = []
    const sandbox = {
      request: {
        method,
        payload: rawPayload,
        options: reqOptions
      },
      response: {
        code: '2.05',
        payload: 'Mock Response',
        options: []
      },
      console: {
        log: (...args) => {
          logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '))
        }
      }
    }

    try {
      const script = new vm.Script(scriptText, { filename: `mock-route-${matchingRoute.id}` })
      const context = vm.createContext(sandbox)
      script.runInContext(context, { timeout: 1000 })

      res.code = sandbox.response.code || '2.05'

      if (sandbox.response.options && Array.isArray(sandbox.response.options)) {
        sandbox.response.options.forEach(opt => {
          if (opt.key && opt.value) {
            let val = opt.value
            if (/^\d+$/.test(val)) {
              val = parseInt(val, 10)
            }
            try {
              res.setOption(opt.key, val)
            } catch (e) {
              if (e.message && /unknown string to buffer converter/i.test(e.message) && typeof val === 'string') {
                try {
                  res.setOption(opt.key, Buffer.from(val))
                } catch (e2) {
                  console.error(`Failed to set CoAP option ${opt.key}:`, e2.message)
                }
              } else {
                console.error(`Failed to set CoAP option ${opt.key}:`, e.message)
              }
            }
          }
        })
      }

      if (logs.length > 0) {
        webContents.send('mock-server:script-logs', {
          timestamp,
          path,
          logs
        })
      }

      res.end(sandbox.response.payload)

    } catch (e) {
      console.error(`Mock script error for ${method} ${path}:`, e.message)
      webContents.send('mock-server:script-logs', {
        timestamp,
        path,
        logs: [`[Script Error] ${e.message}`]
      })
      res.code = '5.00'
      res.end(`Sandbox script execution failed: ${e.message}`)
    }
  })
}
