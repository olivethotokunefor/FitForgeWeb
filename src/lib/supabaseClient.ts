export const supabase = new Proxy(
  {},
  {
    get() {
      throw new Error('Supabase has been removed. Use Firebase instead.')
    },
  },
)