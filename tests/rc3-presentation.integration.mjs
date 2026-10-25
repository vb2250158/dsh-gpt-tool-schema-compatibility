import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { adaptAssembly, apply } from '../lib/index.js'

test('rc.3 real assembly keeps executor schemas outside presentation listeners', async () => {
  assert(process.env.DSH_SOURCE_ROOT, 'Set DSH_SOURCE_ROOT to a built DSH rc.3 checkout')
  assert(process.env.DSH_CHAT_ENHANCEMENT_SOURCE, 'Set DSH_CHAT_ENHANCEMENT_SOURCE to the companion plugin checkout')
  const owner = createRequire(process.env.DSH_SOURCE_ROOT + '/packages/core/system-prompt/package.json')
  const { Context } = await import(pathToFileURL(owner.resolve('@deepseek-ai/cordis')).href)
  const { default: SystemPrompt } = await import(pathToFileURL(owner.resolve('@deepseek-ai/dsh-system-prompt')).href)
  const { describeTools } = await import(pathToFileURL(process.env.DSH_CHAT_ENHANCEMENT_SOURCE + '/lib/index.js').href)
  const ctx = new Context()
  const tool = { name: 'example', description: 'Fixture tool', parameters: { type: 'object', properties: {} } }
  try {
    await ctx.plugin(SystemPrompt)
    ctx.systemPrompt.tools(() => ({ schemas: [tool] }))
    apply({ inject(_services, callback) { callback({
      on: ctx.on.bind(ctx),
      sandboxPolicy: { resolve: () => ({ mode: 'danger-full-access' }) },
    }) } })
    ctx.on('system-prompt/assemble', async (_presentation, _context, next) => describeTools(await next(), 'Fixture hint'))
    let observed
    ctx.on('system-prompt/assemble', async (presentation, _context, next) => {
      observed = presentation
      return next()
    })
    const assembly = await ctx.systemPrompt.assemble({ agent: { options: { model: 'gpt-6.1-sol' }, session: { id: 'fixture' } } })
    assert.equal(Object.hasOwn(observed, 'tools'), false)
    assert.equal(adaptAssembly(observed, 'gpt-6.1-sol', { mode: 'danger-full-access' }), observed)
    assert.deepEqual(assembly.tools, [tool])
    assert(Array.isArray(assembly.sections))
    assert(Array.isArray(assembly.contexts))
  } finally {
    await ctx.fiber.dispose()
  }
})
