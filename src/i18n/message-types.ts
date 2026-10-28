import type { MessageKey, zh } from './zh.ts'

export type MessageValues = Readonly<Record<string, string | number>>
export type MessageTemplate = string | ((values: MessageValues) => string)
export type MessageCatalog = Record<MessageKey, MessageTemplate>

type ParametersIn<Template extends string> =
  Template extends `${string}{${infer Name}}${infer Rest}`
    ? Name | ParametersIn<Rest>
    : never

/** The source dictionary also defines the required interpolation parameters. */
export type Translate = <Key extends MessageKey>(
  key: Key,
  ...args: [ParametersIn<(typeof zh)[Key]>] extends [never]
    ? []
    : [values: Record<ParametersIn<(typeof zh)[Key]>, string | number>]
) => string
