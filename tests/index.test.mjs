import assert from 'node:assert/strict'
import test from 'node:test'
import { adaptAssembly, apply, isGptModel, withoutEscalationFields } from '../lib/index.js'

const pwsh = {
  name: 'pwsh',
  description: 'Run PowerShell',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string' },
      description: { type: 'string' },
      sandbox_permissions: { type: 'string' },
      justification: { type: 'string' },
    },
    required: ['command', 'description', 'sandbox_permissions', 'justification'],
  },
}

test('identifies GPT and Codex model names without matching DeepSeek', () => {
  assert.equal(isGptModel('GPT-5.6-Terra High'), true)
  assert.equal(isGptModel('gpt-5.3-codex'), true)
  assert.equal(isGptModel('deepseek-chat'), false)
})

test('removes only escalation fields from a tool schema', () => {
  const adapted = withoutEscalationFields(pwsh)
  assert.deepEqual(Object.keys(adapted.parameters.properties), ['command', 'description'])
  assert.deepEqual(adapted.parameters.required, ['command', 'description'])
  assert.equal(withoutEscalationFields(adapted), adapted)
})

test('adapts GPT schemas only while the session already has Full access', () => {
  const assembly = { tools: [pwsh] }
  const full = adaptAssembly(assembly, 'GPT-5.6-Terra High', { mode: 'danger-full-access' })
  assert.equal('sandbox_permissions' in full.tools[0].parameters.properties, false)
  assert.equal(adaptAssembly(assembly, 'deepseek-chat', { mode: 'danger-full-access' }), assembly)
  assert.equal(adaptAssembly(assembly, 'GPT-5.6-Terra High', { mode: 'workspace-write' }), assembly)
})

test('adapts the public prompt assembly waterfall using the agent session policy', async () => {
  const listeners = []
  const session = { id: 'session-1' }
  const ctx = {
    sandboxPolicy: { resolve(request) { assert.deepEqual(request, { session }); return { mode: 'danger-full-access' } } },
    inject(_services, callback) { callback(ctx) },
    on(name, listener) { listeners.push({ name, listener }); return () => {} },
  }
  apply(ctx)
  assert.equal(listeners.length, 1)
  assert.equal(listeners[0].name, 'system-prompt/assemble')
  const assembly = await listeners[0].listener({}, { agent: { options: { model: 'GPT-5.6-Terra High' }, session } }, async () => ({ tools: [pwsh] }))
  assert.equal('justification' in assembly.tools[0].parameters.properties, false)
})
