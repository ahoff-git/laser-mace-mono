import { Component, Types } from 'ecsy';

export const BODY_TYPE_VALUES = [
  'dynamic',
  'fixed',
  'kinematicVelocity',
  'kinematicPosition',
] as const;

export type BodyTypeValue = (typeof BODY_TYPE_VALUES)[number];
export type BodyTypeInput = BodyTypeValue | string | null | undefined;

export const DEFAULT_BODY_TYPE: BodyTypeValue = 'dynamic';

function resolveStringType(): any {
  const typed = Types as { String?: unknown; Ref?: unknown };
  return typed.String ?? typed.Ref ?? (Types as any).String ?? (Types as any).Ref;
}

const BODY_TYPE_ALIASES: Record<string, BodyTypeValue> = {
  kinematic: 'kinematicPosition',
  kinematicposition: 'kinematicPosition',
  kinematicpositionbased: 'kinematicPosition',
  kinematicvelocity: 'kinematicVelocity',
  kinematicvelocitybased: 'kinematicVelocity',
};

export function normalizeBodyType(value: BodyTypeInput): BodyTypeValue {
  if (!value) {
    return DEFAULT_BODY_TYPE;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return DEFAULT_BODY_TYPE;
  }

  const direct = BODY_TYPE_VALUES.find(
    (option) => option.toLowerCase() === normalized,
  ) as BodyTypeValue | undefined;
  if (direct) {
    return direct;
  }

  return BODY_TYPE_ALIASES[normalized] ?? DEFAULT_BODY_TYPE;
}

/**
 * Ecsy component for configuring Rapier rigid body types.
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
