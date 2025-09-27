import { Component, Types } from 'ecsy';

export const BODY_TYPE_VALUES = ['fixed', 'kinematic', 'dynamic'] as const;

export type BodyTypeValue = (typeof BODY_TYPE_VALUES)[number];

export const DEFAULT_BODY_TYPE: BodyTypeValue = 'dynamic';

function resolveStringType() {
  return (Types as { String?: any }).String ?? (Types as any).Ref;
}

export function normalizeBodyType(value: string | undefined): BodyTypeValue {
  return (BODY_TYPE_VALUES as readonly string[]).includes(value ?? '')
    ? (value as BodyTypeValue)
    : DEFAULT_BODY_TYPE;
}

/**
 * Defines the Rapier rigid body type to create for an entity.
 */
export class BodyType extends Component<BodyType> {
  value!: BodyTypeValue;

  static schema = {
    value: { type: resolveStringType(), default: DEFAULT_BODY_TYPE },
  };

  copy(src: BodyType): this {
    this.value = normalizeBodyType(src.value);
    return this;
  }

  reset(): void {
    this.value = DEFAULT_BODY_TYPE;
  }
}
