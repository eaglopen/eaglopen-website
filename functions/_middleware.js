export async function onRequest(context) {
  const url = new URL(context.request.url)

  if (url.hostname.includes("pages.dev")) {
    return Response.redirect(
      `https://eaglopen.org${url.pathname}${url.search}`,
      301,
    )
  }

  return context.next()
}
