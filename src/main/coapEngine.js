import coap from 'coap'
import { URL } from 'url'
import { runPreScript, runPostScript } from './scriptRunner.js'

// Track active connections
const activeRequests = new Map()

export function cancelRequest(subId) {
  const req = activeRequests.get(subId)
  if (req) {
    req.abort()
    activeRequests.delete(subId)
    return true
  }
  return false
}

// Helper to convert key-value arrays to coap options
function configureOptions(req, headers) {
  if (!headers || !Array.isArray(headers)) return

  headers.forEach(({ key, value }) => {
    if (!key || !value) return
    try {
      let val = value
      if (/^\d+$/.test(value)) {
        val = parseInt(value, 10)
      }
      req.setOption(key, val)
    } catch (e) {
      console.error(`Failed to set CoAP option ${key}:`, e.message)
    }
  })
}

// Main execution logic for one-off requests (GET, POST, PUT, DELETE without observe)
export async function sendCoapRequest(config) {
  // 1. Run pre-request script
  const { requestConfig, logs: preLogs } = runPreScript(config.preScript, config)

  return new Promise((resolve) => {
    const startTime = Date.now()
    const resultLogs = [...preLogs]

    try {
      const url = new URL(requestConfig.url)
      
      // Inject query parameters into the URL if defined in queryParams
      if (requestConfig.queryParams && requestConfig.queryParams.length > 0) {
        requestConfig.queryParams.forEach(({ key, value }) => {
          if (key) url.searchParams.append(key, value)
        })
      }

      const options = {
        hostname: url.hostname,
        port: url.port ? parseInt(url.port) : 5683,
        pathname: url.pathname,
        query: url.search.substring(1), // Remove leading '?'
        method: requestConfig.method || 'GET',
        confirmable: true
      }

      const req = coap.request(options)
      configureOptions(req, requestConfig.headers)

      // Store in active requests in case user aborts it
      const reqId = requestConfig.id || Math.random().toString()
      activeRequests.set(reqId, req)

      req.on('response', (res) => {
        const chunks = []
        res.on('data', (chunk) => {
          chunks.push(chunk)
        })

        res.on('end', () => {
          activeRequests.delete(reqId)
          const elapsed = Date.now() - startTime
          const rawPayload = Buffer.concat(chunks).toString()

          // Parse CoAP response options
          const resOptions = res.options.map(opt => ({
            key: opt.name,
            value: opt.value.toString()
          }))

          const responseData = {
            code: res.code,
            payload: rawPayload,
            options: resOptions,
            duration: elapsed
          }

          // Run post-request script
          const { logs: postLogs } = runPostScript(requestConfig.postScript, responseData, requestConfig)

          resolve({
            success: true,
            response: responseData,
            logs: [...resultLogs, ...postLogs]
          })
        })
      })

      req.on('error', (err) => {
        activeRequests.delete(reqId)
        resolve({
          success: false,
          error: err.message,
          logs: [...resultLogs, `[Network Error] ${err.message}`]
        })
      })

      // Send payload if method is not GET/DELETE
      if (requestConfig.payload && ['POST', 'PUT'].includes(options.method)) {
        req.write(Buffer.from(requestConfig.payload))
      }

      req.end()

    } catch (e) {
      resolve({
        success: false,
        error: e.message,
        logs: [...resultLogs, `[Execution Error] ${e.message}`]
      })
    }
  })
}

// Main execution logic for Observe subscriptions
export function startObserveStream(config, subId, webContents) {
  // 1. Run pre-request script
  const { requestConfig, logs: preLogs } = runPreScript(config.preScript, config)

  // Send initial pre-script logs to UI
  if (preLogs.length > 0) {
    webContents.send('coap:observe-update', {
      subId,
      data: {
        type: 'log',
        logs: preLogs
      }
    })
  }

  try {
    const url = new URL(requestConfig.url)

    if (requestConfig.queryParams && requestConfig.queryParams.length > 0) {
      requestConfig.queryParams.forEach(({ key, value }) => {
        if (key) url.searchParams.append(key, value)
      })
    }

    const options = {
      hostname: url.hostname,
      port: url.port ? parseInt(url.port) : 5683,
      pathname: url.pathname,
      query: url.search.substring(1),
      method: 'GET',
      observe: true
    }

    const req = coap.request(options)
    configureOptions(req, requestConfig.headers)

    // Store req for cancellation
    activeRequests.set(subId, req)

    req.on('response', (res) => {
      res.on('data', (chunk) => {
        const rawPayload = chunk.toString()
        const resOptions = res.options.map(opt => ({
          key: opt.name,
          value: opt.value.toString()
        }))

        const responseData = {
          code: res.code,
          payload: rawPayload,
          options: resOptions,
          timestamp: new Date().toLocaleTimeString()
        }

        // Run post-request script on each stream message
        const { logs: postLogs } = runPostScript(requestConfig.postScript, responseData, requestConfig)

        webContents.send('coap:observe-update', {
          subId,
          data: {
            type: 'message',
            response: responseData,
            logs: postLogs
          }
        })
      })

      res.on('error', (err) => {
        webContents.send('coap:observe-update', {
          subId,
          data: {
            type: 'error',
            error: err.message
          }
        })
      })
    })

    req.on('error', (err) => {
      activeRequests.delete(subId)
      webContents.send('coap:observe-update', {
        subId,
        data: {
          type: 'error',
          error: err.message
        }
      })
    })

    req.end()

  } catch (e) {
    webContents.send('coap:observe-update', {
      subId,
      data: {
        type: 'error',
        error: e.message
      }
    })
  }
}
