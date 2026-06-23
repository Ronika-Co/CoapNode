import vm from 'vm'

export function runPreScript(scriptStr, requestConfig, env = {}) {
  if (!scriptStr) return { requestConfig, logs: [] }

  const logs = []
  const sandbox = {
    request: {
      url: requestConfig.url,
      method: requestConfig.method,
      queryParams: JSON.parse(JSON.stringify(requestConfig.queryParams || [])),
      headers: JSON.parse(JSON.stringify(requestConfig.headers || [])),
      payload: requestConfig.payload || ''
    },
    env: { ...env },
    console: {
      log: (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
      }
    }
  }

  try {
    vm.runInNewContext(scriptStr, sandbox, { timeout: 1000 })
    return {
      requestConfig: {
        ...requestConfig,
        url: sandbox.request.url,
        method: sandbox.request.method,
        queryParams: sandbox.request.queryParams,
        headers: sandbox.request.headers,
        payload: sandbox.request.payload
      },
      logs
    }
  } catch (err) {
    logs.push(`[Pre-Script Error] ${err.message}`)
    return { requestConfig, logs }
  }
}

export function runPostScript(scriptStr, responseData, requestConfig, env = {}) {
  if (!scriptStr) return { logs: [] }

  const logs = []
  const sandbox = {
    request: JSON.parse(JSON.stringify(requestConfig)),
    response: {
      code: responseData.code,
      payload: responseData.payload,
      options: JSON.parse(JSON.stringify(responseData.options || []))
    },
    env: { ...env },
    console: {
      log: (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
      }
    }
  }

  try {
    vm.runInNewContext(scriptStr, sandbox, { timeout: 1000 })
  } catch (err) {
    logs.push(`[Post-Script Error] ${err.message}`)
  }

  return { logs }
}
