interface LibRule {
  replaceWith: string;
  isUtility: boolean;
}

export const LIB_SUBSTITUTIONS: Record<string, LibRule> = {
  'moment': {
    replaceWith: 'dayjs',
    isUtility: true,
  }
};
