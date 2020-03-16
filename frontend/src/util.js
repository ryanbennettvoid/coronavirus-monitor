
export function hideUsCitiesFilter(r) {
  if (r.isAmerica) {
    return !r.region.includes(',') // 'Los Angeles, CA' vs 'California'
  }
  return true
}