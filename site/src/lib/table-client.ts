/**
 * Client-side table sorting. Headers opt in with data-sort="num|str" and
 * data-key="<row dataset key>"; rows carry matching data-<key> attributes.
 */
export const initSort = (table: HTMLTableElement): void => {
  const headers = [...table.querySelectorAll<HTMLTableCellElement>('thead th[data-sort]')]
  for (const th of headers) {
    th.addEventListener('click', () => {
      const key = th.dataset.key
      if (!key) return
      const dir = th.dataset.dir === 'desc' ? 'asc' : 'desc'
      for (const h of headers) delete h.dataset.dir
      th.dataset.dir = dir
      const tbody = table.tBodies[0]
      if (!tbody) return
      const rows = [...tbody.rows]
      const numeric = th.dataset.sort === 'num'
      // Missing values always sink to the bottom, regardless of direction
      const missing = dir === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
      const parse = (v: string): number => {
        const n = Number.parseFloat(v)
        return Number.isNaN(n) ? missing : n
      }
      rows.sort((a, b) => {
        const av = a.dataset[key] ?? ''
        const bv = b.dataset[key] ?? ''
        const cmp = numeric ? parse(av) - parse(bv) : av.localeCompare(bv)
        return dir === 'asc' ? cmp : -cmp
      })
      for (const row of rows) tbody.appendChild(row)
    })
  }
}
