export const name = 'gpt-tool-schema-compatibility'
export const inject = ['systemPrompt', 'sandboxPolicy']

const ESCALATION_FIELDS = new Set(['sandbox_permissions', 'justification'])

/** Whether a model uses the OpenAI/GPT tool-call behavior requiring schema compatibility. */
export function isGptModel(model) {
  return typeof model === 'string' && /\b(?:gpt|codex)(?:[-_.]|\d|$)/i.test(model)
}

/** Remove escalation-only parameters from one model-facing tool schema. */
export function withoutEscalationFields(tool) {
  const properties = tool.parameters?.properties
  if (properties === undefined || !Object.keys(properties).some(name => ESCALATION_FIELDS.has(name))) return tool
  const filteredProperties = Object.fromEntries(Object.entries(properties).filter(([name]) => !ESCALATION_FIELDS.has(name)))
  const required = tool.parameters.required
  return {
    ...tool,
    parameters: {
      ...tool.parameters,
      properties: filteredProperties,
      ...required === undefined ? {} : { required: required.filter(name => !ESCALATION_FIELDS.has(name)) },
    },
  }
}

/** Adapt schemas only for GPT-family calls that already hold the widest sandbox mode. */
export function adaptAssembly(assembly, model, policy) {
  if (!isGptModel(model) || policy.mode !== 'danger-full-access') return assembly
  const tools = assembly.tools.map(withoutEscalationFields)
  return tools.every((tool, index) => tool === assembly.tools[index]) ? assembly : { ...assembly, tools }
}

/** Register model-facing compatibility without changing the official tool registry or executors. */
export function apply(ctx) {
  ctx.inject(['systemPrompt', 'sandboxPolicy'], scope => {
    scope.on('system-prompt/assemble', async (_assembly, context, next) => {
      const assembled = await next()
      const agent = context.agent
      if (agent === undefined) return assembled
      return adaptAssembly(assembled, agent.options.model, scope.sandboxPolicy.resolve({ session: agent.session }))
    })
  })
}
