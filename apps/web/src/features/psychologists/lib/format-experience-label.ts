export function formatExperienceLabel(yearExperience: number) {
  const safeYears = Number.isFinite(yearExperience) ? Math.max(0, yearExperience) : 0;
  const years = Math.floor(safeYears);
  const months = Math.floor((safeYears - years) * 12);

  if (years === 0 && months === 0) {
    return '0 year experience';
  }

  if (years === 0) {
    return `${months} ${months === 1 ? 'month' : 'months'} experience`;
  }

  if (months === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'} experience`;
  }

  return `${years} ${years === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'} experience`;
}
