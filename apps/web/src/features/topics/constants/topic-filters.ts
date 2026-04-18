export const TOPIC_FILTER_GROUPS = [
  { key: 'all', matcher: () => true },
  { key: 'work', matcher: (value: string) => value.includes('STRESS') || value.includes('BURNOUT') || value.includes('DRIVE') },
  { key: 'anxiety', matcher: (value: string) => value.includes('ANXIETY') || value.includes('FEAR') || value.includes('PANIC') },
  { key: 'mood', matcher: (value: string) => value.includes('DEPRESSION') || value.includes('EMOTION') || value.includes('GRIEF') },
  { key: 'family', matcher: (value: string) => value.includes('FAMILY') || value.includes('CHILD') || value.includes('RELATION') }
] as const;

export type TopicFilterKey = (typeof TOPIC_FILTER_GROUPS)[number]['key'];
